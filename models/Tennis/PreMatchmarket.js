// models/Tennis/PreMatchmarket.js
const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
}, { _id: false }); // Disable _id for subdocuments

const preMatchMarketSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
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
  markets: {
    type: [marketSchema],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  collection: 'tennis_prematchmarkets',
  versionKey: false, // Disable the __v field
  toJSON: {
    transform: function(doc, ret) {
      // Reorder fields when converting to JSON
      return {
        id: ret.id,
        name: ret.name,
        count: ret.count,
        markets: ret.markets,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
        _id: ret._id
      };
    }
  }

});

// Update timestamp before saving
preMatchMarketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create index on id field for faster queries
preMatchMarketSchema.index({ id: 1 }, { unique: true });

// Remove the nested schemas since we're not using them
module.exports = {
  PreMatchMarket: mongoose.model('PreMatchMarket', preMatchMarketSchema)
};