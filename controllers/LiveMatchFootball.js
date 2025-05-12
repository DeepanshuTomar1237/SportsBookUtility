// controllers/LiveMatchFootball.js
const axios = require('axios');

const API_BASE_URL = 'https://jarlon.onlinegamblingtech.com/api/v1';

const DEFAULT_EVENT_IDS = [
  '174404876','174409475','174539248','174539246','174409479', 
  '174503672', '174408256', '174408252', '174408258', '174414556', 
  '174409483', '174414565', '174539250'
];

exports.getOddsData2 = async (req, res) => {
  const eventIds = req.query.evIds
    ? [...new Set(req.query.evIds.split(','))]
    : DEFAULT_EVENT_IDS;

  const marketMap = new Map(); // Using Map to avoid duplicates

  try {
    const fetchMarketData = async (eventId) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/event`, {
          params: { evId: eventId }
        });

        const markets = response.data?.eventData?.markets;

        if (response.data?.success && Array.isArray(markets)) {
          markets.forEach((market) => {
            if (market.name) {
              // First try to get market ID from root level
              let marketId = market.market;
              
              // If not found at root level, check first odds item
              if (!marketId && market.Odds && market.Odds.length > 0) {
                marketId = market.Odds[0].market;
              }
              
              // If still no ID found, use a default
              marketId = marketId || '1778';
              
              // Store in Map to avoid duplicates (name as key, id as value)
              if (!marketMap.has(market.name)) {
                marketMap.set(market.name, marketId);
              }
            }
          });
        }
      } catch (err) {
        console.error(`Error fetching event ${eventId}:`, err.message);
      }
    };

    await Promise.all(eventIds.map(fetchMarketData));

    // Convert the Map to the desired output format
    const result = [{
      id: 1,
      name: "Football",
      count: marketMap.size,
      markets: Array.from(marketMap).map(([name, id]) => ({
        id: id,
        name: name
      }))
    }];

    res.json(result);

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