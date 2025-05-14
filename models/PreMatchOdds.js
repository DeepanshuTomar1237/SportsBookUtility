const mongoose = require('mongoose');

const OddsSchema = new mongoose.Schema({
  id: String,
  odds: String,
  header: { type: String, default: null },
  name: { type: String, default: null },
  handicap: { type: mongoose.Schema.Types.Mixed, default: null }
}, { _id: false, versionKey: false });

const MarketSchema = new mongoose.Schema({
  id: String,
  name: String,
  odds: [OddsSchema]
}, { _id: false, versionKey: false });

const PreMatchMarketSchema = new mongoose.Schema({
  PRE_MATCH_MARKETS: [MarketSchema],
  total_markets: Number,
  // timestamp: { type: Date, default: Date.now }
  // Removed the source field completely
}, { versionKey: false });

module.exports = mongoose.model('PreMatchodds', PreMatchMarketSchema);