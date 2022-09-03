var createError = require('http-errors')
var express = require('express')
var path = require('path')
//const fs = require('fs')
//var router = express.Router()

var indexRouter = require('./routes/index')

var app = express()
app.set('views', path.join(__dirname, 'views'))


app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.get('/favicon.ico', (req, res) => res.status(204))
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  console.log(req.originalUrl)
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.message = err.message
  res.sendFile(path.join(process.cwd(), 'public', '500.html'))
})

module.exports = app
