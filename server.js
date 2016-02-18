var express = require('express')
var serveStatic = require('serve-static')

var app = express()

app.use(serveStatic(__dirname + '/labData'));
app.use(serveStatic(__dirname + '/public'));
app.use(serveStatic(__dirname + '/utils'));
app.listen(8000)
console.log("started FE static asset server, after the BE has been started, please navigate your webbrowser to http://localhost:8000/");