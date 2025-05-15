const mongoose = require('mongoose');

const tennisMarketSchema = new mongoose.Schema({
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
});

// Update the updatedAt field before saving
tennisMarketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Tennis', tennisMarketSchema);