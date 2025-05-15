const mongoose = require('mongoose');

const tennisLiveMarketSchema = new mongoose.Schema({
  // Basic identification
  sportId: {
    type: Number,
    required: true,
    default: 13 // Tennis
  },
  sportName: {
    type: String,
    required: true,
    default: "Tennis"
  },
  // Market data
  markets: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  }],
  // Count of markets
  count: {
    type: Number,
    required: true
  },
  // Event IDs used to fetch this data
  eventIds: [String],
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Reference to the source
  source: {
    type: String,
    default: "jarlon-api"
  }
}, {
  collection: 'tennis_live_markets', // Explicit collection name
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for faster querying
tennisLiveMarketSchema.index({ sportId: 1 });
tennisLiveMarketSchema.index({ 'markets.id': 1 });
tennisLiveMarketSchema.index({ lastUpdated: -1 });

// Middleware to update lastUpdated before saving
tennisLiveMarketSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('TennisLiveMarket', tennisLiveMarketSchema);