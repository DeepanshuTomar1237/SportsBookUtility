// models/CRICKET/PreMatchMarket.js
const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true }
});

const CricketPreMatchMarketSchema = new mongoose.Schema({
  sportId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  count: { type: Number, required: true },
  markets: [MarketSchema],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

CricketPreMatchMarketSchema.index({ sportId: 1 });

module.exports = mongoose.model('CricketPreMatchMarket', CricketPreMatchMarketSchema);