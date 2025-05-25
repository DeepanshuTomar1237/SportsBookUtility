// models\ICE_HOCKEY\PreMatchMarket.js
const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true }
});

const IceHockeyPreMatchMarketSchema = new mongoose.Schema({
  sportId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  count: { type: Number, required: true },
  markets: [MarketSchema],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

IceHockeyPreMatchMarketSchema.index({ sportId: 1 });

// Create and export the model
const IceHockeyPreMatchMarket = mongoose.model('IceHockeyPreMatchMarket', IceHockeyPreMatchMarketSchema);

module.exports = IceHockeyPreMatchMarket;  // Directly export the model