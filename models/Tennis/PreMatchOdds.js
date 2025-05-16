const mongoose = require('mongoose');

const tennisPreMatchOddsSchema = new mongoose.Schema({
  id: String,
  odds: String,
  header: { type: String },
  name: { type: String },
  team: { type: String },
  handicap: { type: mongoose.Schema.Types.Mixed }
 
  
}, { _id: false, versionKey: false });

const MarketSchema = new mongoose.Schema({
  id: String,
  name: String,
  odds: [tennisPreMatchOddsSchema]
}, { _id: false, versionKey: false });

const PreMatchMarketSchema = new mongoose.Schema({
  PRE_MATCH_MARKETS: [MarketSchema],
  total_markets: Number
}, { versionKey: false });

// module.exports = mongoose.model('TennisPreMatchOdds', tennisPreMatchOddsSchema);
// Change your model export to:
module.exports = mongoose.model('TennisPreMatchOdds', PreMatchMarketSchema);