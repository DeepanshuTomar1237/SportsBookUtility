const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  id: String,
  name: String
}, { _id: false });

const marketSchema = new mongoose.Schema({
  id: String,
  name: String,
  leagues: [leagueSchema]
}, { _id: false });

const preMatchMarketSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: String,
  count: Number,
  markets: [marketSchema]
}, {
  collection: 'tennis_prematchmarkets',
  versionKey: false,
  timestamps: false
});

module.exports = mongoose.model('PreMatchMarket', preMatchMarketSchema);