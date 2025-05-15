const mongoose = require('mongoose');

const preMatchMarketSchema = new mongoose.Schema({
  sportId: {
    type: Number,
    required: true,
    default: 13
  },
  name: {
    type: String,
    required: true,
    default: "Tennis"
  },
  count: {
    type: Number,
    required: true
  },
  markets: [{
    id: String,
    name: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'tennis_prematchmarkets' });

// Update the updatedAt field before saving
preMatchMarketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a parent reference if needed
const TennisSchema = new mongoose.Schema({
  prematchmarkets: [preMatchMarketSchema]
}, { collection: 'tennis' });

const SportsbookSchema = new mongoose.Schema({
  tennis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tennis'
  }
}, { collection: 'sportsbook' });

// Export all models
module.exports = {
  PreMatchMarket: mongoose.model('PreMatchMarket', preMatchMarketSchema),
  Tennis: mongoose.model('Tennis', TennisSchema),
  Sportsbook: mongoose.model('Sportsbook', SportsbookSchema)
};