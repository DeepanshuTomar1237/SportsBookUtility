// controllers/Football/LiveMatchMarket.js
const axios = require('axios');
require('dotenv').config();
const FootballMarket = require('../../models/LiveMatchMarket');

if (!process.env.API_BASE_URL) {
  throw new Error('API_BASE_URL is not defined in environment variables');
}

const API_BASE_URL = process.env.API_BASE_URL;
const DEFAULT_EVENT_IDS = [
  '174503327', '174454680', '174454688','174454684','174507949','174507951',
  '173889257','174586714','174454691','174566908','174454340','174507694',
  '174507707','174504434','174503897','174548838','174503894'
];

exports.LiveMatchMarket = async (req, res) => {
  try {
    const eventIds = req.query.evIds
      ? [...new Set(req.query.evIds.split(','))]
      : DEFAULT_EVENT_IDS;

    const marketMap = new Map();

    const fetchMarketData = async (eventId) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/event`, {
          params: { evId: eventId },
          timeout: 5000
        });

        if (!response.data?.success) {
          console.warn(`API returned non-success for event ${eventId}`);
          return;
        }

        const markets = response.data?.eventData?.markets || [];
        
        markets.forEach((market) => {
          if (!market?.name) return;

          let marketId = market.market || 
                        (market.Odds?.[0]?.market) || 
                        '1778'; // Default fallback
          
          if (!marketMap.has(market.name)) {
            marketMap.set(market.name, marketId);
          }
        });
      } catch (err) {
        console.error(`Error fetching event ${eventId}:`, err.message);
      }
    };

    await Promise.all(eventIds.map(fetchMarketData));

    const result = {
      sportId: 1,
      name: "Football",
      count: marketMap.size,
      markets: Array.from(marketMap, ([name, id]) => ({ id, name })),
      eventIds: eventIds
    };

    // Save to MongoDB
    const savedMarket = await FootballMarket.create(result);

    // Send response
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