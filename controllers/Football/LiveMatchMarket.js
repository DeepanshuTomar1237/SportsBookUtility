// This file handles live football match market data (like odds, bets, etc.)
// It gets data, processes it, saves it to database, and sends back to user

// Load environment variables (like secret keys or settings)
require('dotenv').config();

// Import necessary tools:
// - FootballMarket model (for database operations)
// - processLiveMatchMarket (the main processing function)
// - Default football event IDs (in case none are specified)
const FootballMarket = require('../../models/LiveMatchMarket');
const { processLiveMatchMarket } = require('../../market-processors/Football/LiveMatchMarketProcessor');
const { FOOTBALL_DEFAULT_EVENT_IDS } = require('../../constants/bookmakers');

// The main function that runs when this API endpoint is called
exports.LiveMatchMarket = async (req, res) => {
  try {
    const eventIds = req.query.evIds
      ? req.query.evIds.split(',')
      : FOOTBALL_DEFAULT_EVENT_IDS;

    const result = await processLiveMatchMarket(eventIds);
    
    // Ensure marketKey is never null
    if (!result.marketKey) {
      result.marketKey = `football_${Date.now()}`; // Example dynamic key
    }

    const savedMarket = await FootballMarket.findOneAndUpdate(
      { marketKey: result.marketKey },
      result,
      { upsert: true, new: true, runValidators: true }
    ).select('-__v'); // Exclude version key

    res.json([{
      id: savedMarket.sportId,
      name: savedMarket.name,
      count: savedMarket.count,
      markets: savedMarket.markets
    }]);

  } catch (error) {
    console.error('Controller Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};