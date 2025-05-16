// Import required helper functions and database model
const { fetchBet365Data } = require('../../utils/api'); // Function to get data from Bet365 API
const { formatSportsData } = require('../../utils/dataFormatter'); // Function to clean and structure sports data
const { PreMatchMarket } = require('../../models/Tennis/PreMatchmarket'); // Database model for Tennis Pre-Match Market
const { processMarkets } = require('../../market-processors/Football/PreMatchMarketProcessor'); // Function to process market data
const { TARGET_FIS_TENNIS } = require('../../constants/bookmakers'); // List of Tennis market IDs we care about

// Controller function to handle Tennis Pre-Match Market data
exports.TennisPreMatchMarket = async (req, res) => {
  try {
    // Step 1: Fetch Tennis data from Bet365 API
    const response = await fetchBet365Data(TARGET_FIS_TENNIS);
    
    // Step 2: If no data is found, return an error response
    if (!response?.results?.length) {
      return res.status(404).json({ error: 'No tennis events found' });
    }

    // Step 3: Process and format the Tennis data we received
    const sportsData = {
      ...formatSportsData(
        processMarkets(
          TARGET_FIS_TENNIS // List of market IDs
            .map(fi => response.results.find(ev => ev.FI?.toString() === fi)) // Find matching events by ID  event is string aur jo data array me both same hona chaiye
            .filter(Boolean) // Remove any undefined/null values
        )
      ),
      id: 13, // Unique ID for Tennis
      name: "Tennis" // Sport name
    };

    // Step 4: Save the processed Tennis data into the database
    // If it already exists, update it. If not, create a new record.
    await PreMatchMarket.findOneAndUpdate(
      { id: 13 }, // Search by Tennis ID
      sportsData,  // New data to save
      { upsert: true, new: true } // Options: insert if not found, return updated document
    );
    
    // Step 5: Send the final Tennis data as a response
    res.json([sportsData]);
    
  } catch (error) {
    // If any error happens, log it and send an error response
    console.error('Tennis data processing error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process tennis prematch data',
      details: error.message
    });
  }
};
