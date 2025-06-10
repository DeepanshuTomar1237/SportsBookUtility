// controllers\Football\PreMatchoddsController.js
// Import necessary tools and files needed for this function to work
const { fetchBet365Data } = require('../../utils/api'); // Tool to get data from Bet365 website
const PreMatchOdds = require('../../models/Football/PreMatchOdds'); // Database model for storing match odds
const PreMatchOddsProcessor = require('../../market-processors/Common/PreMatchOddsProcessor'); // Tool to process the raw data
const { TARGET_FIS } = require('../../constants/bookmakers'); // Constant value for the bookmaker we're using
require('dotenv').config(); // Tool to read environment variables (secret settings)

// This is the main function that handles getting and saving match odds
exports.PreMatchOdds = async (req, res) => {
  try {
    // Step 1: Get the raw betting data from Bet365
    const data = await fetchBet365Data(TARGET_FIS);
    
    // Step 2: Clean up and organize the raw data into a better format
    const processedData = PreMatchOddsProcessor.process(data, TARGET_FIS);

    // If there was an error processing the data, send that error back
    if (processedData.error) {
      return res.status(404).json(processedData);
    }

    // Step 3: Prepare the data to be saved in the database
    const update = {
      $set: {
        PRE_MATCH_MARKETS: processedData.PRE_MATCH_MARKETS, // The actual betting odds
        total_markets: processedData.total_markets // How many betting options there are
      }
    };

    // Settings for how we want to save the data:
    const options = { 
      new: true, // Return the updated data after saving
      upsert: true // If no record exists, create a new one
    };

    // Step 4: Save the data to the database
    // This either updates an existing record or creates a new one
    const result = await PreMatchOdds.findOneAndUpdate({}, update, options);

    // Step 5: Prepare the data to send back to whoever asked for it
    const response = {
      PRE_MATCH_MARKETS: result.PRE_MATCH_MARKETS,
      total_markets: result.total_markets
    };

    // Step 6: Send the data back as a response
    res.json([response]);

  } catch (error) {
    // If anything goes wrong in the steps above, this part runs
    
    // Print the error in the server console so developers can see it
    console.error('API Error:', error.message);
    
    // Prepare a simple error message to send back
    const response = {
      error: 'Failed to fetch or store data'
    };

    // Send the error response with a 500 status code (means server error)
    res.status(500).json(response);
  }
};