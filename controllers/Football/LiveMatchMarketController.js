// controllers\Football\LiveMatchMarketController.js
require('dotenv').config();
const FootballMarket = require('../../models/Football/LiveMatchMarket');
const { processLiveMatchMarket } = require('../../market-processors/Football/LiveMatchMarketProcessor');
const { FOOTBALL_DEFAULT_EVENT_IDS } = require('../../constants/bookmakers');

exports.LiveMatchMarket = async (req, res) => {
  try {
    const eventIds = FOOTBALL_DEFAULT_EVENT_IDS;
    const result = await processLiveMatchMarket(eventIds);
    
    result.marketKey = `football_${eventIds.join('_')}_${Date.now()}`;
    result.sportId = 1;
    result.sportName = "Football";
    result.name = "Football Markets";

    const savedMarket = await FootballMarket.findOneAndUpdate(
      { marketKey: result.marketKey },
      result,
      { 
        upsert: true, 
        new: true,
        select: '-_id' // Explicitly exclude _id from the returned document
      }
    );

    // Convert to plain object and remove any potential _id
    const responseData = savedMarket.toObject();
    delete responseData._id;

    res.json([{
      count: responseData.count || 0,
      markets: responseData.markets || []
    }]);
  } catch (error) {
    console.error('FootballController Error:', error);
    res.status(500).json([{ count: 0, markets: [] }]);
  }
};