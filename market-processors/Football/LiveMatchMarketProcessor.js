// market-processors/Football/LiveMatchMarketProcessor.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('API_BASE_URL is not defined in environment variables');
}

const fetchMarketData = async (eventId, marketMap) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/event`, {
      params: { evId: eventId }
    });

    if (!response.data?.success) {
      console.warn(`API returned non-success for event ${eventId}`);
      return;
    }

    const markets = response.data?.eventData?.markets || [];
    
    markets.forEach((market) => {
      if (!market?.name) return;

      let marketId = market.market ||
                    (market.Odds?.[0]?.market) 

      if (!marketMap.has(market.name)) {
        marketMap.set(market.name, marketId);
      }
    });

  } catch (err) {
    console.error(`Error fetching event ${eventId}:`, err.message);
  }
};

const processLiveMatchMarket = async (eventIds) => {
  const marketMap = new Map();

  await Promise.all(eventIds.map((id) => fetchMarketData(id, marketMap)));

  return {
    // sportId: 1,
    // name: "Football",
    count: marketMap.size,
    markets: Array.from(marketMap, ([name, id]) => ({ id, name })),
    // eventIds
  };
};

module.exports = { processLiveMatchMarket };  
