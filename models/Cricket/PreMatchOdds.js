// models\Cricket\PreMatchOdds.js
const mongoose = require('mongoose');

const OddSchema = new mongoose.Schema({
  id: { type: String, required: true },
  odds: { type: String, required: true },
  header: { type: String },
  name: { type: String },
  handicap: { type: String }
});

const MarketSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  odds: [OddSchema]
});

const CricketPreMatchOddsSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  count: { type: Number, required: true },
  markets: [MarketSchema],
  lastUpdated: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  collection: 'cricket_prematch_odds'
});

// Create indexes
CricketPreMatchOddsSchema.index({ id: 1 });
CricketPreMatchOddsSchema.index({ 'markets.id': 1 });

module.exports = mongoose.model('CricketPreMatchOdds', CricketPreMatchOddsSchema);