const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/httpError');
const Place = require('../models/place');
const User = require('../models/user');


exports.getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId)
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a place', 500);
        return next(error);
    }

    if (!place) {
        const error = new HttpError('Could not find a place for provided id', 404);
        return next(error);
    }

    res.json({ place: place.toObject({ getters: true }) });
};

exports.getPlaceByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let userWithPlaces;
    try {
        userWithPlaces = await User.findById(userId).populate('places')
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find places for that user.', 500);
        return next(error);
    }


    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        const error = new HttpError('Could not find a place for the provided user id.', 404);
        return next(error);
    }
    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) })
};

exports.createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed', 422));
    }
    const { title, description, address } = req.body;
    const createdPlace = new Place({
        title,
        description,
        address,
        image: req.file.path,
        creator: req.userData.userId
    });

    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError('Creating place failed, please try again', 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for provided id', 404);
        return next(error);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });
        user.places.push(createdPlace);
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError('Creating place failed, please try again', 500);
        return next(error);
    }

    res.status(201).json({ place: createdPlace });
}

exports.updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Invalid inputs for updating.', 422));
    }

    const placeId = req.params.pid;
    const { title, description } = req.body;

    let place;
    try {
        place = await Place.findByIdAndUpdate(placeId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update place', 500);
        return next(error);
    }

    if(place.creator.toString() !==req.userData.userId){
        const error = new HttpError('You are not allowed to edit this place', 401);
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save()
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update place', 500);
        return next(error);
    }

    res.status(200).json({ place: place.toObject({ getters: true }) });
}

exports.deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        const error = new HttpError('Something went wrong.', 500);
        return next(error);
    }
    if (!place) {
        const error = new HttpError('Could not find place for this id', 404);
        return next(error);
    }

    if(place.creator.id !==req.userData.userId){
        const error = new HttpError('You are not allowed to edit this place', 401);
        return next(error);
    }

    const imagePath = place.image;

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({ session: sess });
        place.creator.places.pull(place);
        await place.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete place', 500);
        return next(error);
    }

    fs.unlink(imagePath, err =>{
        console.log(err);
    });

    res.status(200).json({ message: 'Place Deleted' });
}