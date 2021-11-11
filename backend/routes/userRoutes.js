const express = require('express');
const { check } = require('express-validator');
const router = express.Router();

const userControllers = require('../controllers/userControllers');
const fileUpload = require('../middleware/file-upload');

router.get('/', userControllers.getUsers);
router.post('/signup',fileUpload.single('image'), [check('name').not().isEmpty(),check('email').isEmail(),check('password').isLength({min: 5})], userControllers.signup);
router.post('/login', userControllers.login);

module.exports = router;