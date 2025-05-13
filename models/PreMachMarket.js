// models/PreMatchMarket.js
const mongoose = require('mongoose');

const OddsSchema = new mongoose.Schema({
  id: String,
  odds: Number,
  header: String,
  name: String,
  handicap: mongoose.Schema.Types.Mixed
});

const MarketSchema = new mongoose.Schema({
  id: String,
  name: String,
  odds: [OddsSchema]
}, { timestamps: true });

module.exports = mongoose.model('PreMatchMarket', MarketSchema);
