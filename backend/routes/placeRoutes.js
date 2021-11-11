const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');

const placeControllers = require('../controllers/placeControllers');
const fileUpload = require('../middleware/file-upload');

router.get('/:pid', placeControllers.getPlaceById);
router.get('/user/:uid', placeControllers.getPlaceByUserId);
router.use(checkAuth);
router.post('/',fileUpload.single('image'), [check('title').not().isEmpty(),check('description').isLength({min: 5}),check('address').not().isEmpty()], placeControllers.createPlace);
router.post('/:pid', [check('title').not().isEmpty(),check('description').isLength({min: 5})], placeControllers.updatePlace);
router.delete('/:pid', placeControllers.deletePlace);

module.exports = router;