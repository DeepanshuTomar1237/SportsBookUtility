// controllers/Cricket/LiveMatchMarketController.js
require('dotenv').config();
const CricketLiveMarket = require('../../models/Cricket/LiveMatchMarket');
const { processLiveMatchMarket } = require('../../market-processors/Common/LiveMatchMarketProcessor'); // Adjust if Cricket has a separate processor
const { CRICKET_LIVE_EVENT_IDS } = require('../../constants/bookmakers');

exports.LiveCricketMatchMarket = async (req, res) => {
  try {
    const eventIds = CRICKET_LIVE_EVENT_IDS;
    const result = await processLiveMatchMarket(eventIds);

   
    result.marketKey = `cricket_${eventIds.join('_')}`;
    result.sportId = 3; 
    result.sportName = "Cricket";
    result.name = "Cricket Markets";

    const savedMarket = await CricketLiveMarket.findOneAndUpdate(
      { marketKey: result.marketKey },
      result,
      { upsert: true, new: true, projection: { _id: 0 } }
    );

    res.json([{
      count: savedMarket.count || 0,
      markets: savedMarket.markets || []
    }]);
  } catch (error) {
    console.error('CricketController Error:', error);
    res.status(500).json([{ count: 0, markets: [] }]);
  }
};
