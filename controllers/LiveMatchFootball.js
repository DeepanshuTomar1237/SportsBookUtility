// controllers\LiveMatchFootball.js
const axios = require('axios');

const API_BASE_URL = 'https://jarlon.onlinegamblingtech.com/api/v1';

const DEFAULT_EVENT_IDS = [
  '173882661', '174342210', '173888902', '173888999', '173888838', '173888840',
  '174217275', '174361672', '174361672', '173889376', '173889363', '173889462',
  '173889464', '173889175', '174217279', '173889404'
];

exports.getOddsData2 = async (req, res) => {
  try {
    const eventIds = req.query.evIds
      ? req.query.evIds.split(',')
      : DEFAULT_EVENT_IDS;

    const allMarkets = {};

    await Promise.all(
      eventIds.map(async (eventId) => {
        try {
          const response = await axios.get(`${API_BASE_URL}/event`, {
            params: { evId: eventId }
          });

          if (response.data?.success && response.data.eventData?.markets) {
            response.data.eventData.markets.forEach(market => {
              if (market.market && market.name && !allMarkets[market.name]) {
                allMarkets[market.name] = market.market;
              }
            });
          }
        } catch (err) {
          console.error(`Error fetching event ${eventId}:`, err.message);
        }
      })
    );

    res.json({
      markets: allMarkets,
      total_markets: Object.keys(allMarkets).length
    });

  } catch (error) {
    console.error('Critical Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status
    });

    res.status(500).json({
      error: 'Unexpected error while fetching market data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
