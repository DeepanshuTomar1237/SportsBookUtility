// controllers/Tennis/PreMatchMarketController.js
const axios = require('axios');
const { PreMatchMarket } = require('../../models/Tennis/PreMatchmarket');
const { processMarkets } = require('../../market-processors/Football/PreMatchMarketProcessor');

exports.TennisPreMatchMarket = async (req, res) => {
  try {
    const targetFIs = ['174515827', '174515829', '174520444', '174465670', '174505725', '174508102', '174508104', '174512203', '174512207'];

    const response = await axios.get('https://api.b365api.com/v3/bet365/prematch', {
      params: {
        token: '72339-5QJh8lscw8VTIY',
        FI: targetFIs.join(',')
      },
      paramsSerializer: params =>
        Object.entries(params)
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
    });

    if (!response.data.results || response.data.results.length === 0) {
      return res.status(404).json({ error: 'No events found' });
    }

    // Filter events based on target FIs (in priority order)
    const filteredEvents = targetFIs
      .map(fi => response.data.results.find(ev => ev.FI?.toString() === fi))
      .filter(Boolean);

    // Process markets using the shared processor
    const consolidatedMarkets = processMarkets(filteredEvents);

    // Transform into the desired format (without odds)
    const sportsData = {
      id: 13,
      name: "Tennis",
      count: Object.keys(consolidatedMarkets).length,
      markets: Object.keys(consolidatedMarkets).map(marketKey => ({
        id: consolidatedMarkets[marketKey].id,
        name: consolidatedMarkets[marketKey].name
      }))
    };

    // Store in MongoDB
    try {
      await PreMatchMarket.findOneAndUpdate(
        { id: 13 },
        sportsData,
        { upsert: true, new: true }
      );
      console.log('Tennis prematch data successfully stored in MongoDB');
    } catch (dbError) {
      console.error('Error storing data:', dbError.message);
    }

    res.json([sportsData]);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch data from Bet365 API',
      details: error.message
    });
  }
};