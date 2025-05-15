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

const IceHockeyPreMatchOddsSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  count: { type: Number, required: true },
  markets: [MarketSchema],
  lastUpdated: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  collection: 'ice_hockey_prematch_odds'
});

// Create indexes (removed duplicate index definitions)
IceHockeyPreMatchOddsSchema.index({ id: 1 });
IceHockeyPreMatchOddsSchema.index({ 'markets.id': 1 });

// Export the model directly
module.exports = mongoose.model('IceHockeyPreMatchOdds', IceHockeyPreMatchOddsSchema);