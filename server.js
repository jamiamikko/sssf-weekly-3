require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');

console.log(
  `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${
    process.env.DB_HOST
  }:${process.env.DB_PORT}/test`
);

const port = process.env.PORT || 3000;

mongoose
  .connect(
    `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${
      process.env.DB_HOST
    }:${process.env.DB_PORT}/test`,
    {useNewUrlParser: true}
  )
  .then((res) => {
    console.log(res);
    app.listen(port, () => console.log('Listening to port 3000'));
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
  id: {type: Number, required: true},
  time: {type: String, required: true},
  category: {type: String, required: true},
  title: {type: String, required: true},
  details: {type: String, required: true},
  coordinates: {type: Object, required: true},
  thumbnail: String,
  image: String,
  original: {type: String, required: true},
});

const ImgData = mongoose.model('ImgData', imgDataSchema);

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, callback) => {
    callback(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({storage: storage}).single('image');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/', express.static('public'));

const convertImage = (file, height, width) =>
  new Promise((resolve, reject) => {
    const newName =
      file.destination +
      file.fieldname +
      '_' +
      height +
      'x' +
      width +
      '-' +
      Date.now() +
      path.extname(file.originalname);

    sharp(file.path)
      .resize(height, width)
      .toFile(newName, (err, info) => {
        if (err) reject(err);
        else resolve(newName);
      });
  });

app.get('/get-images', (req, res, next) => {
  ImgData.find({}, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
      res.send(data);
    }
  });
});

app.post('/upload', upload, (req, res, next) => {
  if (!req.body || !req.file) sendStatus(400);
  const date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '');

  const dataObj = {
    id: Math.floor(Math.random() * 100 + 1),
    time: date,
    category: req.body.category,
    title: req.body.title,
    details: req.body.description,
    coordinates: {
      lat: parseFloat(req.body.latitude),
      lng: parseFloat(req.body.longitude),
    },
    original: req.file.path.replace('public/', ''),
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
