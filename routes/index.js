var express = require('express')
var router = express.Router()
const fs = require('fs')
var path = require('path')

/* GET home page. */
router.get('/', function (req, res, next) {
  let sPath = path.join(express().get('public'), 'index.html')
  fs.readFile(sPath, 'utf8', function (err, data) {
    data = data
      .replace('@:GOOGLEMAPSAPIKEY', process.env.GOOGLEMAPSAPIKEY)
      .replace('@:MAPQUESTAPIKEY', process.env.MAPQUESTAPIKEY)
      .replace('@:ISDEBUG', process.debugPort > 0)

    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': Buffer.byteLength(data, 'utf8')
    })
    res.write(data, 'utf8')
    res.end()
  })
})

module.exports = router
