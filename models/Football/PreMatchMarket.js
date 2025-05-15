
// models\preMatchMarkets.js
const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true }
});

const SportsDataSchema = new mongoose.Schema({
  id: { type: Number, required: true },         // Sport ID
  name: { type: String, required: true },        // Sport Name
  count: { type: Number, required: true },       // Total number of unique markets
  markets: [MarketSchema]                        // Array of markets
}, { timestamps: true });

module.exports = mongoose.model('PreMatchmarket', SportsDataSchema);

