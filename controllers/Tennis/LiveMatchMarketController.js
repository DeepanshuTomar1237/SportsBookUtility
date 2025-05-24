require('dotenv').config();
const TennisLiveMarket = require('../../models/Tennis/LiveMatchMarket');
const { processLiveMatchMarket } = require('../../market-processors/Football/LiveMatchMarketProcessor');
const { TENNIS_LIVE_EVENT_IDS } = require('../../constants/bookmakers');

exports.TennisLiveMatchMarket = async (req, res) => {
  try {
    const eventIds =  TENNIS_LIVE_EVENT_IDS;
    const result = await processLiveMatchMarket(eventIds);
  
    result.marketKey = `football_${eventIds.join('_')}_${Date.now()}`;
    
    const savedMarket = await TennisLiveMarket.findOneAndUpdate(
      { marketKey: result.marketKey },
      result,
      { upsert: true, new: true }
    );

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