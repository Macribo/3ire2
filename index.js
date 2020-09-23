const path = require("path");
const express = require('express');
const app = express();
morgan = require('morgan');
bodyParser = require('body-parser');
uuid = require('uuid');
const mongoose = require('mongoose');
const Models = require('./models.js');
const Locations = Models.Location;
const Users = Models.User;
const passport = require('passport');
require('./passport'); //local passport file
const cors = require('cors');
const { check, validationResult } = require('express-validator');

mongoose.connect('mongodb://localhost:27017/tofuDb', { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// var allowedOrigins = ['http://lolscalhost:8080', 'http://localhost:1234', 'https://spinner-project.herokuapp.com'];

//middleware.
app.use(cors({
  origin: function (origin, callback) {
    console.log(origin);
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
      var message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

app.use(bodyParser.json());

var auth = require('./auth')(app);

app.use(morgan('common'));

app.use(express.static('public'));
app.use("/client", express.static(path.join(__dirname, "client", "dist")));

app.get("/client/*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

//introductory message on opening API with no url endpoint specified
app.get('/', function (req, res, next) {
  res.send('fáilte go comhéadan feidhmchlár  riomhchlárú 3ire2');
  next();
});

//LOGÁNTA --- gets all locations
app.get("/log", passport.authenticate('jwt', { session: false }), function (req, res) {
  Locations.find()
    .then(function (locations) {
      res.status(200).json(locations);
    }).catch(function (error) {
      console.error(error);
      res.status(500).send("Error: " + error);
    });
});

//get locations by province

app.get('/locations/:Cuige', function (req, res) {
  Locations.findOne({ Title: req.params.Title })
    .then(function (location) {
      if (!location) {
        res.status(404).send(req.params.Title + " níor aimsíodh ceantar ar an ainm sin...");
      } else {
        res.json(location)
      }
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});
// app.get('/users', (req, res) => {
//   Users.find().then(users => res.json(users));
// });

//gets an update of location's activities by searching a name
//https://docs.mongodb.com/manual/tutorial/query-embedded-documents/
app.get('/locations/status/:Name', passport.authenticate('jwt', { session: false }), function (req, res) {
  Locations.findOne({ 'Status.Name': req.params.Name })
    .then(function (status) {
      if (!status) {
        res.status(404).send(req.params.Name + "deabhail rud anseo go fóil...");
      } else {
        res.json(status.Status)
      }
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error:" + err);
    });
});

//gets basic info about a location's Taoiseach upon searching their name
app.get('/locations/Taoiseach/:Name', passport.authenticate('jwt', { session: false }), function (req, res) {
  Location.findOne({ 'Taoiseach.Name': req.params.Name })
    .then(function (taoiseach) {
      if (!taoiseach) {
        res.status(404).send(req.params.Name + " Níl Taoiseach i gceanais ar an ceantar seo go fóil  .");
      } else {
        res.json(taoiseach.Taoiseach)
      }
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error:" + err);
    });
});

//USERS --- get all users
app.get('/users', passport.authenticate('jwt', { session: false }), function (req, res) {

  Users.find()
    .then(function (users) {
      res.status(200).json(users)
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//gets a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), function (req, res) {
  Users.findOne({ Username: req.params.Username })
    .then(function (user) {
      if (!user) {
        res.status(404).send(req.params.Username + " Níór aimsíodh an imreoir sin!");
      } else {
        res.status(200).json(user)
      }
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//add new user - required fields = username, password, email and Birthday
app.post('/users',[
  check('Password', 'Cogar.').not().isEmpty(),
  check('Email', 'r-post @ i gceart?').isEmail()],
  function (req, res) {
    // check the validation object for errors
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    var hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Ainm: req.body.Ainm })
      .then(function (user) {
        if (user) {
          return res.status(400).send(req.body.Ainm + "Tá an tainm sin in úsáid theanna féin.");
        } else {
          Users
            .create({
              Ainm: req.body.Ainm,
              Password: hashedPassword,
              Email: req.body.Email
            })
            .then(function (user) { res.status(201).json(user) })
            .catch(function (error) {
              console.error(error);
              res.status(500).send("Error: " + error);
            })
        }
      }).catch(function (error) {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  });

//allows user to update their information
app.put('/users/:Ainm', passport.authenticate('jwt', { session: false }),

  function (req, res) {
    if (req.user.Username === req.params.Ainm) {
      Users.findOne({ Username: req.params.Ainm })
        .then(function (user) {
          if (!user) {

            res.status(404).send("níor aimsíodh" + req.params.Ainm);
          }
          else {
            const updatedUser = {
              Ainm: req.body.Ainm || user.Ainm,
              Password: req.body.Password ? Users.hashPassword(req.body.Password) : user.Password,
              Email: req.body.Email || user.Email,
            }

            console.log(updatedUser)
            Users.findOneAndUpdate({ _id: user._id }, {
              $set:
                updatedUser
            },
              { new: true }, // This line makes sure that the updated document is returned
              function (err, updatedUser) {
                console.log(err, updatedUser)
                if (err) {
                  console.error(err);
                  res.status(500).send("Error: " + err);
                } else {
                  res.status(200).json(updatedUser)
                }
              })
          }
        })
        .catch(function (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        });
    }
    else {
      return res.status(403).send(req.params.Ainm + " Ní feidir.");
    };
  });

//delete existing user (deregistration)
app.delete('/users/:Ainm', passport.authenticate('jwt', { session: false }), function (req, res) {
  if (req.user.Ainm === req.params.Ainm) {
    Users.findOneAndRemove({ Ainm: req.params.Ainm })
      .then(function (user) {
        if (!user) {
          res.status(404).send("Níor aimsíodh "+req.params.Ainm );
        } else {
          res.status(200).send(req.params.Ainm + "bainnte.");
        }
      })
      .catch(function (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
  else {
    return res.status(403).send(req.params.Ainm + " Ní feidir.");
  };
});

//Add location to User profile, prevents duplicates of the same location being added to the user profile.
app.post('/users/:Username//:LocationID', passport.authenticate('jwt', { session: false }), function (req, res) {
  if (req.user.Ainm === req.params.Ainm) {
    Users.findOneAndUpdate({ Ainm: req.params.Ainm }, {
      $addToSet: { FavouriteMovies: req.params.LocationID }
    },
      { new: true }, // This line makes sure that the updated document is returned
      function (err, updatedUser) {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.status(201).json(updatedUser)
        }
      })
  }
  else {
    return res.status(403).send(req.params.Ainm + "Ní feidir.");
  };
});


var port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", function () {
  console.log(`Ag Éisteacht ar ${port}`);
});
