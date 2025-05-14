const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('API_BASE_URL is not defined in environment variables');
}

const DEFAULT_EVENT_IDS = [
  '174503327', '174454680', '174454688','174454684','174507949','174507951',
  '173889257','174586714','174454691','174566908','174454340','174507694',
  '174507707','174504434','174503897','174548838','174503894'
];

const fetchMarketData = async (eventId, marketMap) => {
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
                    '1778'; // Fallback market ID

      if (!marketMap.has(market.name)) {
        marketMap.set(market.name, marketId);
      }
    });

  } catch (err) {
    console.error(`Error fetching event ${eventId}:`, err.message);
  }
};

const processLiveMatchMarket = async (customEventIds) => {
  const eventIds = customEventIds?.length
    ? [...new Set(customEventIds)]
    : DEFAULT_EVENT_IDS;

  const marketMap = new Map();

  await Promise.all(eventIds.map((id) => fetchMarketData(id, marketMap)));

  return {
    sportId: 1,
    name: "Football",
    count: marketMap.size,
    markets: Array.from(marketMap, ([name, id]) => ({ id, name })),
    eventIds
  };
};

module.exports = { processLiveMatchMarket };
