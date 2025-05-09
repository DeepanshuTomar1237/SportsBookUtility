const express = require('express');
const router = express.Router();

const { getOddsData } = require('../controllers/PreMatchFootball');
const { getOddsData1 } = require('../controllers/PreMatchodds');
const { getOddsData2 } = require('../controllers/LiveMatchFootball');

// Route for PreMatchFootball
router.get('/prematch', getOddsData);

// Route for PreMatchodds
router.get('/prematch-ids', getOddsData1);

// Route for LiveMatchFootball
router.get('/livematch', getOddsData2);

module.exports = router;
