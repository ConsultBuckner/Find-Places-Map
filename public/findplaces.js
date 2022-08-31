var map
var service
var infowindow
var placeResults
var placeMarkers
var searchBoxesObject

function createMap (lat, long) {
  var pyrmont = new google.maps.LatLng(lat, long)

  map = new google.maps.Map(document.getElementById('map'), {
    center: pyrmont,
    zoom: 15
  })
  infowindow = new google.maps.InfoWindow()
}

function addResults () {
  setTimeout(() => {
    $('#fetching').hide()
    $('#places').show()
    $('.toolbutton-container').show()
  }, 1)

  for (var k in searchBoxesObject) {
    var rcc = searchBoxesObject[k].resultCount
    var rqq = searchBoxesObject[k].requestCount
    var label = 'Result Count: ' + rcc + ' Request Count: ' + rqq
    var mapLabelOpt = {
      text: label,
      position: searchBoxesObject[k].rectangle.getBounds().getSouthWest(),
      map: map,
      fontSize: 13,
      align: 'left',
      strokeWeight: 3,
      strokeColor: '#fff',
      maxZoom: 0, // Keeps it hidden
      minZoom: 100 // Keeps it hidden
    }

    searchBoxesObject[k].mapLabel = new MapLabel(mapLabelOpt)
  }

  setTimeout(() => {
    for (var k in placeResults) {
      var result = placeResults[k]
      var li =
        '<li placeId="' +
        result.id +
        '"><span class="placeName">' +
        result.name +
        '</span>' +
        '<div class="placeAddress">' +
        result.displayString.replace(result.name + ', ', '') +
        '</div></li>'

      var $li = $(li).appendTo('#places')
      var marker = createMarker(result)
      if (marker) {
        $li.on('mouseover', function () {
          google.maps.event.trigger(
            placeMarkers[$(this).attr('placeId')],
            'mouseover'
          )
        })
        $li.on('click', function () {
          google.maps.event.trigger(
            placeMarkers[$(this).attr('placeId')],
            'click'
          )
        })
      }
    }

    if (_isDebug) {
      console.log(
        window.totalResults +
          ' total results\n\r' +
          Object.keys(placeResults).length +
          ' unique results'
      )
    }
  }, 100)
}

function prepareSearch () {
  var boxes = calcSearchBBoxes(map.getBounds())
  var remain = boxes.length
  var bExecuted = false
  var done = function (bForce) {
    remain--
    if (_isDebug) {
      console.log(remain + ' request(s) remain')
    }
    if ((bForce || remain < 1) && !bExecuted) {
      bExecuted = true
      addResults()
    }
  }

  setTimeout(() => {
    $('#fetching').show()
  }, 1)

  if (_isDebug) {
    console.log('sending ' + remain + ' request(s)')
    window.totalResults = 0
  }

  for (var ib = 0; ib < boxes.length; ib++) {
    var reqParams = {}
    reqParams.key = _mqKey
    reqParams.q = $.trim($('#searchboxinput').val())
    reqParams.pageSize = 50
    reqParams.page = 1
    reqParams.sort = 'relevance'
    reqParams.bbox = boxes[ib].join(',')
    var arParams = []
    for (var k in reqParams)
      arParams.push(k + '=' + encodeURIComponent(reqParams[k]))
    var url = _mqUrl + '?' + arParams.join('&')

    if (_isDebug) {
      console.log(url)
    }

    setTimeout(sendRequest.bind(null, url, ib, done), 10)
  }

  //safety to prevent infinite wait
  setTimeout(done.bind(null, true), 8000 * boxes.length)
}

function sendRequest (url, index, clbDone) {
  var closure = function (pUrl, pIndex, clb) {
    searchBoxesObject[pIndex].requestCount += 1
    $.get(pUrl, data => {
      if (_isDebug) {
        window.totalResults += data.results.length
      }
      searchBoxesObject[pIndex].resultCount += data.results.length
      $.each(data.results, (i, result) => {
        placeResults[result.id] = placeResults[result.id] || result
      })
      if (data.pagination && data.pagination.nextUrl)
        sendRequest(data.pagination.nextUrl, pIndex, clb)
      else clb()
    }).fail(err => {
      $('#places').append(
        '<li><span class="error">' + err.responseText + '</span></li>'
      )
      clb()
    })
  }

  closure(url, index, clbDone)
}

function clearPlaces () {
  $('#places')
    .hide()
    .empty()
  placeResults = {}

  for (var key in placeMarkers) {
    placeMarkers[key].setMap(null)
  }

  placeMarkers = {}

  for (var k in searchBoxesObject) {
    let boxObj = searchBoxesObject[k]
    boxObj.rectangle.setMap(null)
    boxObj.rectangle = null
    boxObj.mapLabel.setMap(null)
    boxObj.mapLabel = null
  }

  searchBoxesObject = {}

  $('#raster').attr('data-hidden', 'true')

  $('#pager')
    .hide()
    .filter('a')
    .hide()
  $('.toolbutton-container').hide()
  $('#exportDL').empty()
}

function createMarker (result) {
  if (
    !result.place ||
    !result.place.geometry ||
    !result.place.geometry.coordinates
  )
    return null

  var marker = new google.maps.Marker({
    map: map,
    title: result.name,
    position: {
      lat: result.place.geometry.coordinates[1],
      lng: result.place.geometry.coordinates[0]
    }
  })

  google.maps.event.addListener(marker, 'click', function () {
    infowindow.setContent(result.displayString || '')
    infowindow.open({ anchor: marker, map, shouldFocus: true })
  })

  google.maps.event.addListenerOnce(map, 'click', function () {
    infowindow.close()
  })

  placeMarkers[result.id] = marker
  return marker
}

/// HELPERS ///
function calcSearchBBoxes (bounds) {
  var area = getBBoxAreaKM(bounds)
  if (_isDebug) {
    console.log('area: ' + area + 'km')
  }
  var factor =
    area < 4
      ? 1
      : area < 16
      ? 4
      : area < 256
      ? 16
      : area < 1024
      ? 64
      : area < 4096
      ? 256
      : 512

  // tesselate matrix object
  var tMatrix = {
    rects: {},
    deltaLat: 0,
    deltaLng: 0,
    getBoxes (numBoxes, jsonBounds) {
      let index = Math.sqrt(numBoxes)
      this.deltaLat = Math.fround((jsonBounds.north - jsonBounds.south) / index)
      this.deltaLng = Math.fround((jsonBounds.east - jsonBounds.west) / index)
      let y = 0
      let rectId = numBoxes
      while (y < index) {
        let x = 0
        while (x < index) {
          this.rects[rectId] = this.rects[rectId] || new Array(4)
          this.rects[rectId][0] = Math.fround(
            jsonBounds.west + this.deltaLng * x
          )
          this.rects[rectId][1] = Math.fround(
            jsonBounds.south + this.deltaLat * y
          )
          this.rects[rectId][2] = Math.fround(
            jsonBounds.west + this.deltaLng * (x + 1)
          )
          this.rects[rectId][3] = Math.fround(
            jsonBounds.south + this.deltaLat * (y + 1)
          )

          x++
          rectId--
        }
        y++
        rectId--
      }
      return Object.values(this.rects)
    }
  }

  var boxes = tMatrix.getBoxes(factor, bounds.toJSON())

  /// SURPRISE, THESE RECTANGLES ARE REALLY POLYLINES
  let arRects = []
  boxes.forEach((box, indx) => {
    var rect = new google.maps.Rectangle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      bounds: {
        west: box[0],
        south: box[1],
        east: box[2],
        north: box[3]
      },
      map: map,
      visible: false
    })

    searchBoxesObject[indx] = {
      rectangle: rect,
      mapLabel: null,
      resultCount: 0,
      requestCount: 0
    }
  })

  return boxes
}

function getBBoxAreaKM (bounds) {
  if (!bounds) {
    return 0
  }

  var sw = bounds.getSouthWest()
  var ne = bounds.getNorthEast()
  var southWest = new google.maps.LatLng(sw.lat(), sw.lng())
  var northEast = new google.maps.LatLng(ne.lat(), ne.lng())
  var southEast = new google.maps.LatLng(sw.lat(), ne.lng())
  var northWest = new google.maps.LatLng(ne.lat(), sw.lng())
  return (
    google.maps.geometry.spherical.computeArea([
      northEast,
      northWest,
      southWest,
      southEast
    ]) / 1000000
  )
}

//initial place
function ipLookUp () {
  $.ajax('http://ip-api.com/json').then(
    function success (response) {
      console.log("User's Location Data is ", response)
      console.log("User's Country", response.country)
      createMap(response.lat, response.lon)
    },

    function fail (data, status) {
      console.log('Request failed.  Returned status of', status)
      createMap(37.7749, 122.4194)
    }
  )
}

function handleUserLocation () {
  if ('geolocation' in navigator) {
    // check if geolocation is supported/enabled on current browser
    navigator.geolocation.getCurrentPosition(
      function success (position) {
        // for when getting location is a success
        console.log(
          'latitude',
          position.coords.latitude,
          'longitude',
          position.coords.longitude
        )
        createMap(position.coords.latitude, position.coords.longitude)
      },
      function error (error_message) {
        // for when getting location results in an error
        console.error(
          'An error has occured while retrieving' + 'location',
          error_message
        )
        ipLookUp()
      }
    )
  } else {
    // geolocation is not supported
    // get your location some other way
    console.log('geolocation is not enabled on this browser')
    ipLookUp()
  }
}

function loadTool () {
  searchBoxesObject = {}
  handleUserLocation()

  $('#searchbox_form').attr('action', '/' + Math.random())

  //attach handlers
  $('#searchbutton').click(function () {
    clearPlaces()
    prepareSearch()
    return false
  })

  $('#clearbutton').click(function () {
    $('#searchboxinput').val('')
    clearPlaces()
    return false
  })

  $('#searchboxinput').on('keypress', function (e) {
    if (e.keyCode == 13) {
      $('#searchbutton').click()
    }
  })

  $('#raster').click(function () {
    var bShow = Boolean($(this).attr('data-hidden'))
    var vals = bShow
      ? { minZoom: 14, maxZoom: 20 }
      : { minZoom: 100, maxZoom: 0 }

    for (var key in searchBoxesObject) {
      searchBoxesObject[key].rectangle.setVisible(bShow)
      searchBoxesObject[key].mapLabel.setValues(vals)
    }

    $(this).attr('data-hidden', bShow ? null : 'true')
    return false
  })

  $('#next').click(function () {
    sendRequest($(this).attr('pgt'))
    return false
  })

  $('#prev').click(function () {
    blitPlaces($(this).prop('places'))
    return false
  })

  new ClipboardJS('#copy', {
    text: function (trigger) {
      var thelist = ''
      $('#places li').each(function () {
        thelist +=
          '\n\r' +
          $(this)
            .find('.placeName')
            .text() +
          '\n' +
          $(this)
            .find('.placeAddress')
            .text() +
          '\n\r'
      })
      return thelist
    }
  })

  $('#export').click(function () {
    var thelist = []
    $('#places li').each(function () {
      thelist.push([
        $(this)
          .find('.placeName')
          .text(),
        $(this)
          .find('.placeAddress')
          .text()
      ])
    })

    $('#exportDL').DataTable({
      data: thelist,
      columns: [{ title: 'Name' }, { title: 'Address' }],
      dom: 'Bfrtip',
      buttons: [
        'copyHtml5',
        {
          text: 'TSV',
          extend: 'csvHtml5',
          fieldSeparator: '\t',
          extension: '.tsv'
        }
      ]
    })

    $('.buttons-csv').click()
    return false
  })
}

$(document).ready(loadTool)
