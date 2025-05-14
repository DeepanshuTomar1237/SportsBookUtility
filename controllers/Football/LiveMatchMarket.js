// This file handles live football match market data (like odds, bets, etc.)
// It gets data, processes it, saves it to database, and sends back to user

// Load environment variables (like secret keys or settings)
require('dotenv').config();

// Import necessary tools:
// - FootballMarket model (for database operations)
// - processLiveMatchMarket (the main processing function)
// - Default football event IDs (in case none are specified)
const FootballMarket = require('../../models/LiveMatchMarket');
const { processLiveMatchMarket } = require('../../market-processors/Football/LiveMatchMarketProcessor');
const { FOOTBALL_DEFAULT_EVENT_IDS } = require('../../constants/bookmakers');

// The main function that runs when this API endpoint is called
exports.LiveMatchMarket = async (req, res) => {
  try {
    // Step 1: Get which matches we need data for
    // Check if specific match IDs were requested in the URL
    // If not, use our default list of important matches
    const eventIds = req.query.evIds
      ? req.query.evIds.split(',')  // If IDs provided, split them into an array
      : FOOTBALL_DEFAULT_EVENT_IDS; // Otherwise use defaults

    // Step 2: Process the market data for these matches
    const result = await processLiveMatchMarket(eventIds);

    // Step 3: Save the processed data to our database
    const savedMarket = await FootballMarket.create(result);

    

    // Step 4: Send back a clean, organized response to the user
    res.json([{
      id: savedMarket.sportId,  // What sport this is (football)
      name: savedMarket.name,   // Name/description of the data
      count: savedMarket.count, // How many markets we're returning
      markets: savedMarket.markets  // The actual betting market data
    }]);

  } catch (error) {
    // If anything goes wrong above, we'll end up here
    
    // First, log the error details for developers to see
    console.error('Controller Error:', {
      message: error.message,  // What went wrong
      stack: error.stack      // Where in the code it happened
    });

    // Then send a response that:
    // - Tells the user there was an error (500 = server error)
    // - In development, includes more details to help debug
    res.status(500).json({
      error: 'Internal server error',  // Simple error message
      
    });
  }
};