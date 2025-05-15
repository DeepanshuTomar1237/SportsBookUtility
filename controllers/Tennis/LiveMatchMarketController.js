const axios = require('axios');
const TennisLiveMarket = require('../../models/Tennis/LiveMatchMarket');

const API_BASE_URL = 'https://jarlon.onlinegamblingtech.com/api/v1';

const DEFAULT_EVENT_IDS = [
  "174664869", "174612303", "174612304","174665077","174669221","174686997","174664872","174667017","174676279","174669777"
];

exports.TennisLiveMatchMarket = async (req, res) => {
  const eventIds = req.query.evIds
    ? [...new Set(req.query.evIds.split(','))]
    : DEFAULT_EVENT_IDS;

  const marketMap = new Map();

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
              let marketId = market.market;
              
              if (!marketId && market.Odds && market.Odds.length > 0) {
                marketId = market.Odds[0].market;
              }
              
              marketId = marketId || '1778';
              
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

    // Prepare data for response and storage
    const result = {
      id: 13,
      name: "Tennis",
      count: marketMap.size,
      markets: Array.from(marketMap).map(([name, id]) => ({
        id: id,
        name: name
      }))
    };

    // Store in MongoDB
    try {
      // Upsert operation - update if exists, insert if not
      await TennisLiveMarket.findOneAndUpdate(
        { sportId: 13 },
        {
          sportId: 13,
          sportName: "Tennis",
          markets: result.markets,
          count: result.count,
          eventIds: eventIds,
          source: "jarlon-api"
        },
        { upsert: true, new: true }
      );

      console.log(`Successfully stored ${result.count} live tennis markets`);
    } catch (dbError) {
      console.error('Error storing live market data in MongoDB:', dbError.message);
    }

    res.json([result]);

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