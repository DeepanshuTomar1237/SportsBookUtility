// routes\Index.js
const express = require('express');
const router = express.Router();

// Import all controller functions using correct export style
const { PreMatchMarket } = require('../controllers/Football/PreMatchmarketController');
const { PreMatchOdds } = require('../controllers/Football/PreMatchOddsController');
const { LiveMatchMarket } = require('../controllers/Football/LiveMatchMarketController');
const { TennisPreMatchMarket } = require('../controllers/Tennis/PreMatchMarketController');
const { TennisPreMatchOdds } = require('../controllers/Tennis/PreMatchOddsController'); // Assuming default export
const { TennisLiveMatchMarket } = require('../controllers/Tennis/LiveMatchMarketController');
const { IceHockeyPreMatchMarket } = require("../controllers/ICE_HOCKEY/PreMatchMarketController");
const { IceHockeyPreMatchOdds } = require("../controllers/ICE_HOCKEY/PreMatchOddsController");

// Football Routes
router.get('/football/pre-match/market/list', PreMatchMarket);
router.get('/football/pre-match/market/odds', PreMatchOdds);
router.get('/football/live-match/market/list', LiveMatchMarket);

// // Tennis Routes
router.get('/tennis/pre-match/market/list', TennisPreMatchMarket);
router.get('/tennis/pre-match/market/odds', TennisPreMatchOdds);
router.get('/tennis/live-match/market/list', TennisLiveMatchMarket);

// IceHockey Routes
router.get('/ICE_HOCKEY/pre-match/market/list', IceHockeyPreMatchMarket);
router.get('/ICE_HOCKEY/pre-match/market/odds', IceHockeyPreMatchOdds);

module.exports = router;