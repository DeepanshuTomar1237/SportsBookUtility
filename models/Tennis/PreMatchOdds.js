const mongoose = require('mongoose');

const tennisPreMatchOddsSchema = new mongoose.Schema({
  // Basic event identification
  eventId: {
    type: String,
    required: true,
    index: true
  },
  sportId: {
    type: Number,
    default: 13 // Tennis
  },
  sportName: {
    type: String,
    default: "Tennis"
  },
  eventName: String,
  // Market data
  markets: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    odds: [{
      id: String,
      odds: String,
      header: String,
      name: String,
      handicap: String
    }]
  }],
  // Metadata
  totalMarkets: {
    type: Number,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Reference to the source
  source: {
    type: String,
    default: "bet365"
  },
  // Additional metadata
  metadata: {
    fi: String, // The FI code from bet365
    processedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  collection: 'tennis_prematch_odds', // Explicit collection name
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for faster querying
tennisPreMatchOddsSchema.index({ eventId: 1, sportId: 1 });
tennisPreMatchOddsSchema.index({ 'markets.id': 1 });
tennisPreMatchOddsSchema.index({ lastUpdated: -1 });

// Middleware to update lastUpdated before saving
tennisPreMatchOddsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('TennisPreMatchOdds', tennisPreMatchOddsSchema);