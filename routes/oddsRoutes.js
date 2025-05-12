const express = require('express');
const router = express.Router();

const { getOddsData } = require('../controllers/PreMatchFootball');
const { getOddsData1 } = require('../controllers/PreMatchodds');
const { getOddsData2 } = require('../controllers/LiveMatchFootball');
const { getOddsData4 } = require('../controllers/PreMatchTennis');
const { getOddsData5 } = require('../controllers/Tennis/PreMatchOdds');
const { getOddsData6 } = require('../controllers/Tennis/LiveMatchMarket');


// Route for PreMatchFootball
router.get('/football/pre-match/market/odds', getOddsData);

// Route for PreMatchodds
router.get('/football/pre-match/market/list', getOddsData1);

// Route for LiveMatchFootball
router.get('/livematch', getOddsData2);

router.get('/Tennis/pre-match/market/list', getOddsData4);

router.get('/Tennis/pre-match/market/odds', getOddsData5)

router.get('/Tennis/live-match/market/odds', getOddsData6)

module.exports = router;
// /football/live-match/market/list
 