require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');
const fs = require('fs');
const uuid = require('uuid/v4');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();

passport.use(
  new LocalStrategy((username, password, done) => {
    if (
      username !== process.env.USERNAME ||
      password !== process.env.PASSWORD
    ) {
      done(null, false, {message: 'Incorrect credentials'});
      return;
    }
    return done(null, {username: username});
  })
);

passport.serializeUser((user, done) => {
  console.log(user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log(user);
  done(null, user);
});

app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public'));

const sslkey = fs.readFileSync('./config/ssl-key.pem');
const sslcert = fs.readFileSync('./config/ssl-cert.pem');

const options = {
  key: sslkey,
  cert: sslcert
};

mongoose
  .connect(
    `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${
      process.env.DB_HOST
    }:${process.env.DB_PORT}/test`,
    {useNewUrlParser: true}
  )
  .then((res) => {
    console.log('Mongodb connected');
    https.createServer(options, app).listen(3000);
    http
      .createServer((req, res) => {
        res.writeHead(301, {Location: 'https://localhost:3000' + req.url});
        res.end();
      })
      .listen(8080);
  })
  .catch((err) => {
    console.log(err);
  });

const db = mongoose.connection;

db.once('open', () => {
  console.log('Connected to MongoDB');
});

db.on('error', (err) => {
  console.log(err);
});

const imgDataSchema = new mongoose.Schema({
  time: {type: String, required: true},
  category: {type: String, required: true},
  title: {type: String, required: true},
  details: {type: String, required: true},
  coordinates: {type: Object, required: true},
  thumbnail: String,
  image: String,
  original: {type: String, required: true}
});

const ImgData = mongoose.model('ImgData', imgDataSchema);

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, callback) => {
    callback(null, uuid() + path.extname(file.originalname));
  }
});

const upload = multer({storage: storage}).single('image');

app.get('/get-images', (req, res) => {
  ImgData.find({}, (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      res.send(data);
    }
  });
});

app.get('/get-images/:id', (req, res) => {
  const id = req.params.id;

  ImgData.findById(id, (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      res.send(data);
    }
  });
});

app.get('/search', (req, res) => {
  const title = req.query.title;

  ImgData.find({title: {$regex: title, $options: 'i'}}, (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      console.log(data);
      res.send(data);
    }
  });
});

const convertImage = (file, height, width) =>
  new Promise((resolve, reject) => {
    const newName =
      file.destination +
      file.filename.split('.')[0] +
      '_' +
      height +
      'x' +
      width +
      path.extname(file.originalname);

    sharp(file.path)
      .resize(height, width)
      .toFile(newName, (err, info) => {
        if (err) reject(err);
        else resolve(newName);
      });
  });

app.put('/upload', upload, (req, res) => {
  if (!req.body || !req.file) return sendStatus(400);
  const date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '');

  const dataObj = {
    time: date,
    category: req.body.category,
    title: req.body.title,
    details: req.body.description,
    coordinates: {
      lat: parseFloat(req.body.latitude),
      lng: parseFloat(req.body.longitude)
    },
    original: req.file.path.replace('public/', '')
  };

  convertImage(req.file, 320, 300)
    .then((data) => {
      dataObj.thumbnail = data.replace('public/', '');

      convertImage(req.file, 768, 720)
        .then((response) => {
          dataObj.image = response.replace('public/', '');

          const data = new ImgData(dataObj);
          data.save();
          res.sendStatus(200);
        })
        .catch((err) => {
          console.log(err);
          res.sendStatus(400);
        });
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

app.post('/update/:id', (req, res) => {
  if (!req.body) return sendStatus(400);

  const id = req.params.id;

  ImgData.findById(id, (err, image) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      image.set({
        coordinates: req.body.coordinates,
        category: req.body.category,
        title: req.body.title,
        details: req.body.details
      });

      image.save((err, updatedData) => {
        if (err) {
          console.log(err);
          res.sendStatus(400);
        } else {
          res.send(updatedData);
        }
      });
    }
  });
});

app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/test'
  })
);

app.delete('/delete/:id', (req, res) => {
  const id = req.params.id;

  ImgData.findOne({_id: id}, (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      const imagePaths = [data.original, data.thumbnail, data.image];

      imagePaths.forEach((path) => {
        fs.unlink('public/' + path, (err) => {
          if (err) console.log(err);
        });
      });

      ImgData.deleteOne({_id: id}, (err) => {
        if (err) {
          console.log(err);
          res.sendStatus(400);
        } else {
          res.sendStatus(200);
        }
      });
    }
  });
});
