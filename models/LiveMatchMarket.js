// models\LiveMatchMarket.js
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
    default: 1
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
  eventIds: {
    type: [String],
    required: true
  },
  marketKey: {
    type: String,
    required: true,
    unique: true,
    select: false // This will exclude the field from query results
  }
}, { versionKey: false }); // This removes the __v field

// Indexes
footballMarketSchema.index({ sportId: 1 });
footballMarketSchema.index({ lastUpdated: -1 });
footballMarketSchema.index({ eventIds: 1 });
footballMarketSchema.index({ marketKey: 1 }, { unique: true }); //  index for upsert

const FootballMarket = mongoose.model('LiveMatchmarket', footballMarketSchema);

module.exports = FootballMarket;
