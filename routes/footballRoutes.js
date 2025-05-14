const express = require('express');
const router = express.Router();

// Import football controllers
const { PreMatchMarket } = require('../controllers/Football/PreMatchmarketController');
const { PreMatchoods } = require('../controllers/Football/PreMatchOddsController');
const { LiveMatchMarket } = require('../controllers/Football/LiveMatchMarket');

// Football Routes
router.get('/pre-match/market/list', PreMatchMarket);
router.get('/pre-match/market/odds', PreMatchoods);
router.get('/live-match/market/list', LiveMatchMarket);

module.exports = router;
