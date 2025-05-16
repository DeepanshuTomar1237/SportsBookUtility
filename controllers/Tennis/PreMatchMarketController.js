// Import required helper functions and database model
const { fetchBet365Data } = require('../../utils/api');
const { formatSportsData } = require('../../utils/dataFormatter');
const { PreMatchMarket } = require('../../models/Tennis/PreMatchmarket');
const { processMarkets } = require('../../market-processors/Football/PreMatchMarketProcessor');
const { TARGET_FIS_TENNIS } = require('../../constants/bookmakers');

// Tennis-specific configuration
const TENNIS_CONFIG = {
  id: 13,
  name: 'Tennis'
};

// Controller function to handle Tennis Pre-Match Market data
exports.TennisPreMatchMarket = async (req, res) => {
  try {
    // Step 1: Fetch Tennis data from Bet365 API
    const response = await fetchBet365Data(TARGET_FIS_TENNIS);
    
    // Step 2: If no data is found, return an error response
    if (!response?.results?.length) {
      return res.status(404).json({ 
        error: 'No tennis events found',
        request: {
          FIs: TARGET_FIS_TENNIS
        }
      });
    }

    // Step 3: Process the market data
    const filteredEvents = TARGET_FIS_TENNIS
      .map(fi => response.results.find(ev => ev.FI?.toString() === fi))
      .filter(Boolean);
    
    const processedMarkets = processMarkets(filteredEvents);

    // Step 4: Format the data using the generic formatter
    const sportsData = formatSportsData(processedMarkets, TENNIS_CONFIG);

    // Step 5: Save to database
    await PreMatchMarket.findOneAndUpdate(
      { id: TENNIS_CONFIG.id }, // Use config constant
      sportsData,
      { upsert: true, new: true }
    );
    
    // Step 6: Send response
    res.json([sportsData]);
    
  } catch (error) {
    console.error('Tennis data processing error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process tennis prematch data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};