
const express = require('express');
const router = express.Router();
const { getOddsData } = require('../controllers/oddsController');

router.get('/', getOddsData);

module.exports = router;