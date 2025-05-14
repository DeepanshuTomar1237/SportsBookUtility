const { fetchBet365Data } = require('../../utils/api');
const { processMarkets } = require('../../utils/marketProcessor');
const { formatSportsData } = require('../../utils/dataFormatter');
const PreMatchMarket = require('../../models/PreMatchMarket');
require('dotenv').config();

const TARGET_FIS = [
  '174229112', '174187790', '174277015',
  '173889141', '174217277', '173889464',
  '174408256',
];

exports.PreMatchMarket = async (req, res) => {
  try {
    // Fetch data from Bet365 API
    const data = await fetchBet365Data(TARGET_FIS);

    if (!data?.results || data.results.length === 0) {
      return res.status(404).json({
        error: 'No events found',
        request: { FIs: TARGET_FIS, timestamp: new Date().toISOString() },
      });
    }

    // Process the event data received from the API
    const consolidatedMarkets = processMarkets(data.results, TARGET_FIS);

    // Format the data into a user-friendly format
    const sportsData = formatSportsData(consolidatedMarkets);

    // Save or update the sports data in the database
    await PreMatchMarket.findOneAndUpdate(
      { id: sportsData.id },
      sportsData,
      { upsert: true, new: true }
    );

    // Return the processed data
    res.json([sportsData]);

  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch data from Bet365 API',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
