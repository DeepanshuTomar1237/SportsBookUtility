// models\CommonFootballandIceHockeyOdds.js
const mongoose = require('mongoose');

// Schema for individual odds entry
const OddSchema = new mongoose.Schema({
  id: { type: String, required: true },
  odds: { type: mongoose.Schema.Types.Mixed, required: true }, // Accept both string or number
  name: { type: String, required: true },
  handicap: { type: String, required: false },
  header: { type: String, required: false },
  team: { type: String, required: false },
  corner: { type: String, required: false } // Only used in ice hockey
}, { _id: false });

// Schema for odds under a sport
const SportMarketSchema = new mongoose.Schema({
  odds: [OddSchema]
}, { _id: false });

// Main schema for combined markets
const CommonMarketSchema = new mongoose.Schema({
  football_market_id: { type: String, required: true },
  ice_hockey_market_id: { type: String, required: true },
  name: { type: String, required: true },
  Football: SportMarketSchema,
  'ice-hockey': SportMarketSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for faster querying and uniqueness
CommonMarketSchema.index({ football_market_id: 1, ice_hockey_market_id: 1 }, { unique: true });
CommonMarketSchema.index({ name: 1 });

// Automatically update `updatedAt` before save
CommonMarketSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CommonFootballandIceHockeyOdds', CommonMarketSchema);
