var ViA = ViA || {}
ViA.GMaps = ViA.GMaps || {}
ViA.GMaps.GeoSpatialOps = ViA.GMaps.GeoSpatialOps || {}

ViA.GMaps.GeoSpatialOps.RasterData = function (nSouth, nWest, nNorth, nEast) {
  var _getBBoxAreaKM = function (bounds) {
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
}
