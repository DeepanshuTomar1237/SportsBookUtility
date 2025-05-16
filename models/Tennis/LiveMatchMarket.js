const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true }
});

const tennisLiveMarketSchema = new mongoose.Schema({
  sportId: { type: String },   // Add this
  name: { type: String },      // Add this
  count: { type: Number, required: true },
  markets: { type: [marketSchema], required: true },
  marketKey: { type: String, required: true, unique: true, select: false }
}, { versionKey: false });

// Keep at least the marketKey index since you're using it for upserts
tennisLiveMarketSchema.index({ marketKey: 1 }, { unique: true });

// Only keep other indexes if you actually query by these fields frequently
// footballMarketSchema.index({ sportId: 1 });  // Only if you query by sportId
// footballMarketSchema.index({ eventIds: 1 }); // Only if you query by eventIds

module.exports = mongoose.model('TennisLiveMarket', tennisLiveMarketSchema);