// models\Football\LiveMatchMarket.js
const mongoose = require('mongoose');

const FootballLiveMatchMarketSchema = new mongoose.Schema({
  marketKey: { type: String, required: true, unique: true }, // Unique key for identifying each market set
  sportId: { type: Number, required: true },                  // ID representing the sport (e.g., 1 for football)
  name: { type: String, required: true },                     // Name for display (e.g., "Football Markets")
  sportName: { type: String },                                // Optional sport name (e.g., "Football")
  count: { type: Number, required: true },                    // Number of markets
  markets: { type: Array, required: true },                   // List of market objects
  eventIds: { type: Array, required: true },                  // List of associated event IDs
  createdAt: { type: Date, default: Date.now }                // Timestamp when this record is created
});

module.exports = mongoose.model('FootballLiveMatchMarket', FootballLiveMatchMarketSchema);
