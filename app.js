var createError = require('http-errors')
var express = require('express')
var path = require('path')
var router = express.Router()

var indexRouter = require('./routes/index')

var app = express()
app.set('views', path.join(__dirname, 'views'))
app.set('public', path.join(__dirname, 'public'))
app.use(express.static(app.get('public')))

app.use('/', indexRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
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
  res.sendFile(app.get('public') + '/500.html')
})

module.exports = app
