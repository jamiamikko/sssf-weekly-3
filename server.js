require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');
const fs = require('fs');
const uuid = require('uuid/v4');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

app.use('/', express.static('public'));

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
