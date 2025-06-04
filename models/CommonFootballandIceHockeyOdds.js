const mongoose = require('mongoose');

const OddSchema = new mongoose.Schema({
  id: { type: String, required: true },
  odds: { type: Number, required: true },
  name: { type: String, required: true },
  handicap: { type: String, required: false },
  header: { type: String, required: false },
  team: { type: String, required: false },
  corner: { type: String, required: false } // Specific to ice hockey
}, { _id: false });

const SportMarketSchema = new mongoose.Schema({
  odds: [OddSchema]
}, { _id: false });

const CommonMarketSchema = new mongoose.Schema({
  football_market_id: { type: String, required: true },
  ice_hockey_market_id: { type: String, required: true },
  name: { type: String, required: true },
  Football: SportMarketSchema,
  'ice-hockey': SportMarketSchema,
  // Adding timestamps for when the record was created/updated
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add index for better query performance
CommonMarketSchema.index({ football_market_id: 1, ice_hockey_market_id: 1 }, { unique: true });
CommonMarketSchema.index({ name: 1 });

// Update the updatedAt field before saving
CommonMarketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CommonFootballandIceHockeyOdds', CommonMarketSchema);