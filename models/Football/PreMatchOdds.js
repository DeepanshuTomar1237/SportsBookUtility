// models/Football/PreMatchOdds.js
const mongoose = require('mongoose');

// Define odds structure inside each market
const OddsSchema = new mongoose.Schema({
  id: String,
  odds: String,
  header: String,
  name: String,
  team: String,
  handicap: mongoose.Schema.Types.Mixed
});

// Define market structure with nested odds
const MarketSchema = new mongoose.Schema({
  id: String,
  name: String,
  odds: [OddsSchema]
});

// Top-level schema containing all markets and a total count
const PreMatchMarketSchema = new mongoose.Schema({
  PRE_MATCH_MARKETS: [MarketSchema],
  total_markets: Number
});

// Export the Mongoose model
module.exports = mongoose.model('FootballPreMatchOdds', PreMatchMarketSchema);
