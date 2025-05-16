const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  id: String,
  home: String,
  away: String,
  league: String
}, { _id: false });

const marketSchema = new mongoose.Schema({
  id: String,
  name: String
}, { _id: false });

const preMatchMarketSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: String,
  count: Number,
  events: [eventSchema],
  markets: [marketSchema]
}, {
  collection: 'tennis_prematchmarkets',
  versionKey: false,
  timestamps: false
});

module.exports = mongoose.model('PreMatchMarket', preMatchMarketSchema);