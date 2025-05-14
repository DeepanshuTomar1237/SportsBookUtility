// models/FootballMarket.js
const mongoose = require('mongoose');

// Define the market subdocument schema
const marketSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
});

// Define the main football market schema
const footballMarketSchema = new mongoose.Schema({
  sportId: {
    type: Number,
    required: true,
    default: 1 // Default to football ID
  },
  name: {
    type: String,
    required: true,
    default: "Football"
  },
  count: {
    type: Number,
    required: true
  },
  markets: {
    type: [marketSchema],
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Reference to the event IDs used to generate this data
  eventIds: {
    type: [String],
    required: true
  }
});

// Add indexes for better query performance
footballMarketSchema.index({ sportId: 1 });
footballMarketSchema.index({ lastUpdated: -1 });
footballMarketSchema.index({ eventIds: 1 });

// Create the model
const FootballMarket = mongoose.model('LiveMatchmarket', footballMarketSchema);

module.exports = FootballMarket;