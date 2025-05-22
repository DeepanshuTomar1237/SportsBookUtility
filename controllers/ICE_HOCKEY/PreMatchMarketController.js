const axios = require('axios');
const IceHockeyPreMatchMarket = require('../../models/ICE_HOCKEY/PreMatchMarket');
const { processMarkets } = require('../../market-processors/Football/PreMatchMarketProcessor');
const { TARGET_FIS_HOCKEY } = require('../../constants/bookmakers');

exports.IceHockeyPreMatchMarket = async (req, res) => {
  try {
    const response = await axios.get('https://api.b365api.com/v3/bet365/prematch', {
      params: {
        token: '72339-5QJh8lscw8VTIY',
        FI: TARGET_FIS_HOCKEY.join(',')
      },
      paramsSerializer: params =>
        Object.entries(params)
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
    });

    if (!response.data.results || response.data.results.length === 0) {
      return res.status(404).json({ error: 'No events found' });
    }

    // Filter events by target FIs and process markets
    const filteredEvents = response.data.results.filter(event => 
      event.FI && TARGET_FIS_HOCKEY.includes(event.FI.toString())
    );

    // Process markets using the football processor
    const processedMarkets = processMarkets(filteredEvents, TARGET_FIS_HOCKEY);
    const marketsArray = Object.values(processedMarkets).map(market => ({
      id: market.id,
      name: market.name
    }));

    const sportsData = {
      id: 17,
      name: "IceHockey",
      count: marketsArray.length,
      markets: marketsArray
    };

    try {
      const result = await IceHockeyPreMatchMarket.findOneAndUpdate(
        { sportId: 17 },
        sportsData,
        { upsert: true, new: true }
      );
      
      console.log('Ice Hockey prematch markets successfully stored in MongoDB');
      console.log(`Stored ${result.markets.length} markets`);
      res.json([sportsData]);
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({ 
        error: 'Database operation failed',
        details: dbError.message
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch data from Bet365 API',
      details: error.message
    });
  }
};