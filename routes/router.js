var express = require('express');
var router = express.Router();
var User = require('../models/user');
var bookArray = require('../models/bookArray');
let nodemailer = require('nodemailer');
var bcrypt = require('bcrypt')
var path = require('path');
var crypto = require('crypto');


// GET route for reading data
router.get('/', function (req, res, next) {
  return res.sendFile(path.join(__dirname + '/views/login.html'));
});


//POST route for updating data
router.post('/', function (req, res, next) {
  // confirm that user typed same password twice
  if (req.body.password !== req.body.passwordConf) {
    var err = new Error('Passwords do not match.');
    err.status = 400;
    res.send("passwords dont match");
    return next(err);
  }

  if (req.body.email &&
    req.body.username &&
    req.body.password &&
    req.body.passwordConf) {

    var userData = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      passwordConf: req.body.passwordConf,
    }

    User.create(userData, function (error, user) {
      if (error) {
        return next(error);
      } else {
        req.session.userId = user._id;
        return res.redirect('/');
      }
    });

  } else if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function (error, user) {
      if (error || !user) {
        var err = new Error('Wrong email or password.');
        err.status = 401;
        return next(err);
      } else {
        req.session.userId = user._id;
        return res.redirect('/profile');
        // return res.sendFile('books.html', {root: __dirname})
      }
    });
  } else {
    var err = new Error('All fields required.');
    err.status = 400;
    return next(err);
  }
})

var saveCurrentUser = "";
var userMakeId = "";

var token = "";
router.post('/forgot', function(req, res) {
  User.findOne({email: req.body.email})
  .exec(function (err, user) {
    crypto.randomBytes(20, function(err, buf) {
      token = buf.toString('hex');
      user.resetToken = token;
      User.findByIdAndUpdate(user._id, user).then(newUser => {
        // console.log('New User!!!' + newUser);
      })
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'bookapi314@gmail.com',
          pass: '58852552'
        }
      });
      const mailOptions = {
        from: 'bookapi314@gmail.com', // sender address
        to: req.body.email, // list of receivers
        subject: 'Subject of your email', // Subject line
        html: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.<br>' +
        'Please click on the following link, or paste this into your browser to complete the process:<br>' +
        'http://localhost:3000/resetpass/' + user.resetToken +'<br>' +
        'If you did not request this, please ignore this email and your password will remain unchanged.<br>'
      };


      transporter.sendMail(mailOptions, function (err, info) {
        if(err)
        console.log(err)
        else{
          console.log(info);
          console.log("User token: " + user.resetToken);
          res.redirect('login')
        }
      });
    });
    if (err) {
      return console.log('Error sending e-mail!');
    } else if (!user) {
      var err = new Error('User not found.');
      err.status = 401;
      return res.redirect('/forgot')
    }else {
      console.log('Sending e-mail to:');
    }
  console.log(req.body.email);
  });
});

router.get('/resetpass/:resetToken', function (req, res) {
  User.findOne({resetToken: req.params.resetToken})
  .exec(function (err, user) {
    if (err) {
      return console.log('Error while loading resetpass/:resetToken in router.get!');
    } else if (!user) {
      var err = new Error('User not found with this token!');
      err.status = 401;
      return res.redirect('/login')
    }else {
      console.log("Reset token equals to email token, you can change password! :)");
      res.redirect('/login')
    }
  res.sendFile(path.resolve('views/resetpass.html'));
})
})

router.post('/resetpass/:resetToken', function (req, res, next) {
  User.findOne({resetToken: req.params.resetToken})
  .exec(function (err, user) {
    console.log('Old user password: ' + user.password);
    if (err) {
      return console.log('Error while loading resetpass/:resetToken in router.post!');
    } else if (!user) {
      var err = new Error('User not found with this token!');
      err.status = 401;
      return res.redirect('/forgot')
    }else {
      console.log('Change paswwoed, after mails are equal');
      bcrypt.hash(req.body.password, 10, function (err, hash) {
        if (err) {
          return next(err);
        }else if ( req.body.password == req.body.confirm) {
          console.log('Req.body.password: ' + req.body.password);
          req.body.password = hash;
          user.password = req.body.password;
          console.log('New User.password: ' + user.password);
          User.findByIdAndUpdate(user._id, user).then(newUser => {
          console.log('New User!!!' + newUser);
          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'bookapi314@gmail.com',
              pass: '58852552'
            }
          });
          const mailOptions = {
            from: 'bookapi314@gmail.com', // sender address
            to: user.email, // list of receivers
            subject: 'Pasword reset', // Subject line
            html: 'You are receiving this because you (or someone else) have reset your password to your account.<br>' +
            'Please click on the following link, or paste this into your browser to check did your password has been changed:<br>' +
            'http://localhost:3000/login' +'<br>' +
            'If you did not request this, please ignore this email and your password will remain unchanged.<br>'
          };
          transporter.sendMail(mailOptions, function (err, info) {
            if(err)
            console.log(err)
            else{
              console.log('Response e-mail');
              console.log(info);
              console.log("User token: " + user.resetToken);
              return res.redirect('/login')
            }
          });
          next();
          })
        }else if (req.body.password !== req.body.confirm) {
          var err = new Error('Passwords do not match.');
          err.status = 400;
          res.send("passwords dont match");
          return next(err);
        }else {
          console.log('Check router.js line 137-173!');
          res.redirect('/resetpass/:resetToken')
        }
      })
    }
})
})

// GET route after registering
router.get('/profile', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        if (user === null) {
          var err = new Error('Not authorized! Go back!');
          err.status = 400;
          return next(err);
        } else {
          return res.send('<h1>Name: </h1>' + user.username + '<h2>Mail: </h2>' + user.email + '<br><a type="button" href="/api">Logout</a>' + '<br><a type="button" href="/genres">genres</a>')
        }
      }
    });
});


let books = require('../models/books');

let recomended = books.booksData();
// var bestiary = recomended.filter((book) => {return book.genre == 'bestiary'})

//Take ganres
var genres = [];
genres.push("autobiography")
for (var i = 0; i < recomended.length; i++) {
  // console.log("Start loop")
  // console.log(genres.length)
  var found = false;
  for (var j = 0; j<genres.length; j++){
    // console.log("start loop 2");
    if (recomended[i].genre == genres[j]) {
      found = true;
    }
  }
  if(!found){
    genres.push(recomended[i].genre);
  }
}


router.get('/genres', function (req, res, next){
  var fuckit = "";
  for (var i = 0; i < genres.length ; i++) {
    // res.send('<h1>Genre: </h1>' + autobiography[i].title)
    fuckit = fuckit.concat('<br><a type="button" href="/genres/' + genres[i] + '">' + genres[i] + '</a>');
    console.log('loading genres list');
  }
  res.send('<input type="text" placeholder="Genres..." name="search">' + '<button type="submit">Submit</button>' + '<h1>Genres</h1>' + fuckit);
})

router.get('/genres/:genre', function (req, res, next) {
  let books = bookArray.filter((b) => {return b.genre == req.params.genre});
  let arr = '';
  if(books.length > 0){
    console.log('Loading books of genre');
    for (var i = 0; i < books.length ; i++) {
      arr = arr.concat('<br><a type="button" href="/genres/' + req.params.genre +'/' + books[i].title + '">' + books[i].title + '</a>');
      console.log('loading books list');
    }
    res.send('<h1>' + req.params.genre + '</h1>' + arr);
  }
  else {
    console.log('opa ');
    return res.send("404 Error");
  }
})

router.get('/genres/:genre/:title', function (req, res, next){
  console.log('Starts this reoter ');
  let thisBook = bookArray.filter((b) => {return b.title == req.params.title});
  if(thisBook.length > 0){
    console.log('Loading book');
    res.send('<h1>Name: </h1>' + thisBook[0].title + '<h1>Author: </h1>' + thisBook[0].author + '<h1>Genre: </h1>' + thisBook[0].genre + '<h1>Year: </h1>' + thisBook[0].year);
  }
  else {
    console.log('opa ');
    return res.send("404 Error");
  }
})

// GET for logout logout
router.get('/logout', function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/api');
      }
    });
  }
});

module.exports = router;
