// controllers\Football\PreMatchoddsController.js
const { fetchBet365Data } = require('../../utils/api');
const PreMatchOdds = require('../../models/PreMatchOdds');
const PreMatchOddsProcessor = require('../../market-processors/Football/PreMatchOddsProcessor');
require('dotenv').config();

const TARGET_FIS = [
  '174229112', '174187790', '174277015',
  '173889141', '174217277', '173889464',
];

exports.PreMatchOdds = async (req, res) => {
  try {
    // Fetch data from Bet365 API
    const data = await fetchBet365Data(TARGET_FIS);

    // Process data using the processor
    const processedData = PreMatchOddsProcessor.process(data, TARGET_FIS);

    if (processedData.error) {
      return res.status(404).json(processedData);
    }

    // Format data to match desired structure
    const dataToStore = {
      PRE_MATCH_MARKETS: processedData.PRE_MATCH_MARKETS,
      total_markets: processedData.total_markets,
    };

    // Save to MongoDB
    const document = new PreMatchOdds(dataToStore);
    const saved = await document.save();
    console.log(`Data inserted with _id: ${saved._id}`);

    // Return response in array format as shown in example
    res.json([dataToStore]);

  } catch (error) {
    console.error('⚠️ API Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch or store data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};