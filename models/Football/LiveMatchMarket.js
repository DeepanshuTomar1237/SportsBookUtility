const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false }); // This is the key change - disables _id for subdocuments

const footballMarketSchema = new mongoose.Schema({
  sportId: { type: Number },
  sportName: { type: String },
  name: { type: String },
  count: { type: Number, required: true },
  markets: { type: [marketSchema], required: true },
  marketKey: { type: String, required: true, unique: true }
}, { 
  versionKey: false, // Disables the __v field
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
});

module.exports = mongoose.model('FootballLiveMatchMarket', footballMarketSchema);