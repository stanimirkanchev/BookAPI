var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var User = require('./models/user');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var books = require('./models/books');
let recomended = books.booksData();
let nodemailer = require('nodemailer');

// function makeid() {
//   var text = "";
//   var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//
//   for (var i = 0; i < 5; i++)
//     text += possible.charAt(Math.floor(Math.random() * possible.length));
//
//   return text;
// }
//
// console.log(makeid());

app.use(express.static(__dirname + './views/forgot.html'));

app.get('/forgot', function (req, res) {
  res.sendFile('./views/forgot.html', {root: __dirname});
});

app.get('/api', function (req, res) {
  res.sendFile('./views/homepage.html', {root: __dirname});
});

app.get('/login', function (req, res) {
  res.sendFile('./views/login.html', {root: __dirname});
});

// app.get('/reset/:token', function (req, res) {
//   console.log('Logs in app.get function in router');
//     res.sendFile('./views/reset.html', {root: __dirname});
// });

app.get('/books', function (req, res) {
    res.redirect('login')
});

//connect to MongoDB
mongoose.connect('mongodb://localhost/127.0.0.1:27017]/api');
// mongoose.connect('mongodb://azkmetat:Poznai12@cluster0-shard-00-00-jpice.mongodb.net:27017,cluster0-shard-00-01-jpice.mongodb.net:27017,cluster0-shard-00-02-jpice.mongodb.net:27017/booktest?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin');
mongoose.connect('mongodb://stani6996:Mm669900668811!@bookapi-shard-00-00-s7rmj.mongodb.net:27017,bookapi-shard-00-01-s7rmj.mongodb.net:27017,bookapi-shard-00-02-s7rmj.mongodb.net:27017/test?ssl=true&replicaSet=BookAPI-shard-0&authSource=admin')

var db = mongoose.connection;

//handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // we're connected!
});

//use sessions for tracking logins
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));
// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// serve static files from template
app.use(express.static(__dirname + './views/login.html'));

// include routes
var routes = require('./routes/router');
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});



app.listen(3000, function () {
  console.log('Listening on port 3000!');
});
