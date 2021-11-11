const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/httpError');
const User = require('../models/user');

exports.getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password');
    } catch (err) {
        const error = new HttpError('Fetching users failed, please try again later.', 500);
        return next(error);
    }

    res.json({ users: users.map(user => user.toObject({ getters: true })) })

};

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new Error('Invalid inputs. Please check your inputs.', 422));
    }

    const { name, email, password } = req.body;

    let existUser
    try {
        existUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError('Sign up failed, please try again later.', 500);
        return next(error);
    }

    if (existUser) {
        const error = new HttpError('User already exists. Please login.', 422);
        return next(error);
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        const error = new HttpError('Could not create user, please try again.', 500)
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        password: hashedPassword,
        image: req.file.path,
        places: []
    });

    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError('Signup failed, please try again', 500);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, 'secretkeyforjwt', { expiresIn: '1h' });
    } catch (err) {
        const error = new HttpError('Signup failed, please try again', 500);
        return next(error);
    }


    res.status(201).json({ userId: createdUser.id, email: createdUser.email, token: token });
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    let existUser
    try {
        existUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError('Logging in failed, please try again later.', 500);
        return next(error);
    }

    if (!existUser) {
        const error = new HttpError('Invalid login.', 401);
        return next(error);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existUser.password);
    } catch (err) {
        const error = new HttpError('Logging in failed. pls try again.', 500);
        return next(error);
    }

    if (!isValidPassword) {
        const error = new HttpError('Invalid login.', 401);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign({ userId: existUser.id, email: existUser.email }, 'secretkeyforjwt', { expiresIn: '1h' });
    } catch (err) {
        const error = new HttpError('Logging in failed, please try again', 500);
        return next(error);
    }

    res.json({ userId: existUser.id, email: existUser.email, token: token });
};