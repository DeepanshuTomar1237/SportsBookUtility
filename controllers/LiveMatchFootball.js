// controllers/LiveMatchFootball.js
const axios = require('axios');

const API_BASE_URL = 'https://jarlon.onlinegamblingtech.com/api/v1';

const DEFAULT_EVENT_IDS = [
  '173882661', '174342210', '173888902', '173888999', '173888838', '173888840',
  '174217275', '174361672', '173889376', '173889363', '173889462',
  '173889464', '173889175', '174217279', '173889404', '173889406', '174298126', '174217277','173889310','174294603', '174234032', '174234027', '174236822', '174188190', '174239771'
];

exports.getOddsData2 = async (req, res) => {
  const eventIds = req.query.evIds
    ? [...new Set(req.query.evIds.split(','))] // remove duplicates
    : DEFAULT_EVENT_IDS;

  const allMarkets = {};

  try {
    const fetchMarketData = async (eventId) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/event`, {
          params: { evId: eventId }
        });

        const markets = response.data?.eventData?.markets;
        if (response.data?.success && Array.isArray(markets)) {
          markets.forEach((market) => {
            if (market.market && market.name && !allMarkets[market.name]) {
              allMarkets[market.name] = market.market;
            }
          });
        }
      } catch (err) {
        console.error(`Error fetching event ${eventId}:`, err.message);
      }
    };

    await Promise.all(eventIds.map(fetchMarketData));

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
