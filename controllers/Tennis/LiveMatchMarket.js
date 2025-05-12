// controllers/LiveMatchFootball.js
const axios = require('axios');

const API_BASE_URL = 'https://jarlon.onlinegamblingtech.com/api/v1';

const DEFAULT_EVENT_IDS = [
    "174499544",
    "174513101",
    "174548336",
    "174509215",
    "174548335",
    "174515002",
    "174509794",
    "174521246",
    "174551911",
    "174551727",
    "174512762",
    "174549024",
    "174519063",
    "174513890",
    "174515714",
    "174513762",
    "174512207",
    "174513100",
    "174512203",
    "174508104",
    "174508102",
    "174445166",
    "174518853",
    "174518854",
    "174518862",
    "174519725",
    "174519724",
    "174518851",
    "174518852",
    "174519057",
    "174471043",
    "174459805",
    "174549293",
    "174444146",
    "174521253",
    "174521257",
    "174509214",
    "174455199",
    "174445165",
    "174469468",
    "174458307",
    "174553934",
    "174556412",
    "174518648",
    "174515827",
    "174465676",
    "174515011",
    "174519710"
  ];

exports.getOddsData6 = async (req, res) => {
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
      id: 13,
      name: "Tennis",
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