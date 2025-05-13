const express = require('express');
const router = express.Router();

// Import all controller functions
const { PreMatchMarket } = require('../controllers/Football/PreMatchMarket');
const { PreMatchoods } = require('../controllers/Football/PreMatchodds');
const { LiveMatchMarket } = require('../controllers/Football/LiveMatchMarket');
const { TennisPreMatchMarket } = require('../controllers/Tennis/PreMatchMarket');
const { TennisPreMatchoods } = require('../controllers/Tennis/PreMatchOdds');
const { TennisLiveMatchMarket } = require('../controllers/Tennis/LiveMatchMarket');

// Football Routes
router.get('/football/pre-match/market/odds', PreMatchMarket);
router.get('/football/pre-match/market/list', PreMatchoods);
router.get('/football/live-match/market/list', LiveMatchMarket);

// Tennis Routes
router.get('/tennis/pre-match/market/list', TennisPreMatchMarket);
router.get('/tennis/pre-match/market/odds', TennisPreMatchoods);
router.get('/tennis/live-match/market/odds', TennisLiveMatchMarket);

module.exports = router;