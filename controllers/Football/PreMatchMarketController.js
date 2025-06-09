// Controllers\Football\PreMatchMarketController.js
// Import necessary tools and configuration:
// - Bet365 API fetcher, market processor, data formatter
// - Database model for pre-match markets
// - Default football competitions to track
// - Environment variables (secret keys/config)
const { fetchBet365Data } = require('../../utils/api');
const { processMarkets } = require('../../market-processors/Football/PreMatchMarketProcessor');
const { formatSportsData } = require('../../utils/dataFormatter');
const PreMatchMarket = require('../../models/Football/PreMatchMarket');
const { TARGET_FIS } = require('../../constants/bookmakers');
require('dotenv').config();

// Main function to handle pre-match market data
exports.PreMatchMarket = async (req, res) => {
  try {
    // STEP 1: Fetch data from Bet365 API
    // Uses our predefined list of important football competitions (TARGET_FIS)
    const data = await fetchBet365Data(TARGET_FIS);

    // STEP 2: Check if we got any matches back
    if (!data?.results?.length) {
      return res.status(404).json({ // Return "Not Found" response if no matches
        error: 'No events found',
        request: { 
          FIs: TARGET_FIS, // Show which competitions we asked for
          // timestamp: new Date().toISOString() // Include current time
        },
      });
    }

    // STEP 3: Process the raw betting market data
    // Takes the API results and organizes them into a standard format
    const consolidatedMarkets = processMarkets(data.results, TARGET_FIS);

    // STEP 4: Format for our database and frontend
    // Structures the data with consistent naming and organization
    const sportsData = formatSportsData(consolidatedMarkets);

    // STEP 5: Save to database
    // Updates existing record or creates new one if needed ("upsert")
    await PreMatchMarket.findOneAndUpdate(
      { id: sportsData.id }, // Find by competition ID
      sportsData, // New data to save
      { upsert: true, new: true } // Options: create if missing, return updated version
    );

    // STEP 6: Send formatted data back to client
    // Wrapped in array for consistency with other endpoints
    res.json([sportsData]);

  } catch (error) {
    // ERROR HANDLING: If anything fails in the try block
    
    // 1. Log technical details for developers
    console.error('API Error:', error.message);

    // 2. Prepare error response
    const response = {
      error: 'Failed to fetch data from Bet365 API' // User-friendly message
    };

    
    // 4. Send error response with 500 status (server error)
    res.status(500).json(response);
  }
};