const mongoose = require('mongoose');

const LiveMatchMarketSchema = new mongoose.Schema({
  marketKey: { type: String, required: true, unique: true },
  sportId: { type: Number, required: true },
  name: { type: String, required: true },
  sportName: { type: String },
  count: { type: Number, required: true },
  markets: { type: Array, required: true },
  eventIds: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IceHockeyMarket', LiveMatchMarketSchema);
