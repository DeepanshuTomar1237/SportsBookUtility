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
// This is a pre-save middleware hook for the CommonMarketSchema in Mongoose.
// It runs **before** saving a document to the MongoDB database.

CommonMarketSchema.pre('save', function (next) {
  // `this` refers to the current document that is about to be saved.
  // We're setting the `updatedAt` field to the current timestamp.
  this.updatedAt = Date.now();

  // Call `next()` to pass control to the next middleware or to continue the save operation.
  next();
});


module.exports = mongoose.model('CommonFootballandIceHockeyOdds', CommonMarketSchema);
