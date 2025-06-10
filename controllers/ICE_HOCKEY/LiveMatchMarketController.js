// controllers\ICE_HOCKEY\LiveMatchMarketController.js
require('dotenv').config();
// const IceHockeyLiveMarket = require('../../models/ICE_HOCKEY/LiveMatchMarket');
const IceHockeyLiveMarket = require('../../models/ICE_HOCKEY/LiveMatchMarket');
const { processLiveMatchMarket } = require('../../market-processors/Common/LiveMatchMarketProcessor');
const { ICE_HOCKEY_DEFAULT_EVENT_IDS } = require('../../constants/bookmakers');

exports.LiveICEMatchMarket = async (req, res) => {
  try {
    const eventIds =  ICE_HOCKEY_DEFAULT_EVENT_IDS;
    const result = await processLiveMatchMarket(eventIds);
    
    result.marketKey = `ice_hockey_${eventIds.join('_')}_${Date.now()}`;
    result.sportId = 17;
    result.sportName = "Ice Hockey";
    result.name = "Ice Hockey Markets";

    const savedMarket = await IceHockeyLiveMarket.findOneAndUpdate(

        { marketKey: result.marketKey },
        result,
        { upsert: true, new: true, projection: { _id: 0 } } // Add projection to exclude _id
      );

    res.json([{
      count: savedMarket.count || 0,
      markets: savedMarket.markets 
    }]);
  } catch (error) {
    console.error('IceHockeyController Error:', error);
    res.status(500).json([{ count: 0, markets: [] }]);
  }
};