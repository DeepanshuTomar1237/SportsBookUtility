const { fetchBet365Data } = require('../../utils/api');
const PreMatchOdds = require('../../models/PreMatchOdds');
const PreMatchOddsProcessor = require('../../market-processors/Football/PreMatchOddsProcessor');
const { TARGET_FIS } = require('../../constants/bookmakers');
require('dotenv').config();

exports.PreMatchOdds = async (req, res) => {
  try {
    const data = await fetchBet365Data(TARGET_FIS);
    const processedData = PreMatchOddsProcessor.process(data, TARGET_FIS);

    if (processedData.error) {
      return res.status(404).json(processedData);
    }

    // Since we're not using source for filtering anymore, we need another approach
    // Option 1: Always update the first document (if you only want one document)
    // Option 2: Use another field or combination of fields as a filter
    
    // For this example, we'll update the most recent document
    const update = {
      $set: {
        PRE_MATCH_MARKETS: processedData.PRE_MATCH_MARKETS,
        total_markets: processedData.total_markets,
        timestamp: new Date()
      }
    };

    const options = { 
      new: true,
      sort: { timestamp: -1 }, // Get the most recent document
      upsert: true
    };

    // Find the most recent and update, or create new if none exists
    const result = await PreMatchOdds.findOneAndUpdate({}, update, options);

    // Create clean response
    const response = {
      PRE_MATCH_MARKETS: result.PRE_MATCH_MARKETS,
      total_markets: result.total_markets,
      // timestamp: result.timestamp
    };

    res.json([response]);

  } catch (error) {
    console.error('API Error:', error.message);
    const response = {
      error: 'Failed to fetch or store data'
    };

    if (process.env.NODE_ENV === 'development') {
      response.details = error.message;
      response.stack = error.stack;
    }

    res.status(500).json(response);
  }
};
