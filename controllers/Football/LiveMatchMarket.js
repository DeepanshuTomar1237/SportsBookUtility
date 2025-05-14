require('dotenv').config();
const FootballMarket = require('../../models/LiveMatchMarket');
const { processLiveMatchMarket } = require('../../market-processors/Football/LiveMatchMarketProcessor');

exports.LiveMatchMarket = async (req, res) => {
  try {
    const eventIds = req.query.evIds
      ? req.query.evIds.split(',')
      : undefined;

    const result = await processLiveMatchMarket(eventIds);

    const savedMarket = await FootballMarket.create(result);

    res.json([{
      id: savedMarket.sportId,
      name: savedMarket.name,
      count: savedMarket.count,
      markets: savedMarket.markets
    }]);

  } catch (error) {
    console.error('Controller Error:', {
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
};
