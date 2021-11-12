const fs = require('fs');
const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const placeRoutes = require('./routes/placeRoutes');
const userRoutes = require('./routes/userRoutes');
const HttpError = require('./models/httpError');

const app = express();
app.use(cors());

app.use(express.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allowed-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/places', placeRoutes);
app.use('/api/users', userRoutes);

app.use((req, res, next) => {
    const error = new HttpError('Could not find this page.', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            console.log(err);
        });
    }
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occured!' });
});

mongoose.connect('mongodb+srv://username:password@cluster0.0oi7q.mongodb.net/mern?retryWrites=true&w=majority')
    .then(() => {
        app.listen(5000);
    })
    .catch(err => { console.log(err) });
