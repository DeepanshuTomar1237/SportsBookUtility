// controllers/PreMatchFootball.js

// Import necessary tools (like special toolboxes we need)
const axios = require('axios'); // Tool for making internet requests
require('dotenv').config(); // Tool for reading our secret configuration file

// Check if our secret website address and password are properly set up
if (!process.env.BET365_API_URL || !process.env.BET365_API_TOKEN) {
  throw new Error('Missing required API configuration in environment variables');
}

// Default list of football matches we want to track
const TARGET_FIS = [
  '174229112', '174187790', '174277015', 
  '173889141', '174217277', '173889464'
];

// The main function that gets pre-match betting data
exports.PreMatchMarket = async (req, res) => {
  try {
    // Step 1: Ask the betting website for data about our matches
    const response = await axios.get(process.env.BET365_API_URL, {
      params: {
        token: process.env.BET365_API_TOKEN, // Our secret password
        FI: TARGET_FIS.join(',') // Which matches we want (as a comma list)
      },
      timeout: 10000, // Don't wait more than 10 seconds for reply
      paramsSerializer: params => // Properly format our request
        Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&')
    });

    // Step 2: Check if we got any match data back
    if (!response.data?.results || response.data.results.length === 0) {
      return res.status(404).json({ 
        error: 'No events found', // Tell user we found nothing
        request: { // Include details about what we asked for
          FIs: TARGET_FIS,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Step 3: Organize all the betting options we received
    const consolidatedMarkets = processEvents(response.data.results);

    // Step 4: Package the final result neatly
    res.json({
      success: true, // Indicates the API request was successful
    
      data: {
        // Contains the main data being returned
        PRE_MATCH_MARKETS: Object.values(consolidatedMarkets), 
        // Converts the consolidatedMarkets object into an array of market values (betting options)
    
        meta: { 
          // Metadata about the returned data — useful for tracking and debugging
          total_markets: Object.keys(consolidatedMarkets).length, 
          // Total number of unique market keys in the consolidatedMarkets object
    
          event_count: response.data.results.length, 
          // Total number of events fetched from the external API (likely from response.data.results)
    
          // processed_at: new Date().toISOString() 
          // // Timestamp of when this response was generated, in ISO format
        }
      }
    });
    

  } catch (error) {
    // If something goes wrong, log the details
    console.error('API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Send an error message back
    res.status(500).json({
      error: 'Failed to fetch data from Bet365 API',
      ...(process.env.NODE_ENV === 'development' && { // Only show tech details to developers
        details: error.message,
        stack: error.stack
      })
    });
  }
};

// Helper function: Processes all matches and their betting options
function processEvents(events) {
  const consolidatedMarkets = {}; // Empty container for all betting options
  const targetFiSet = new Set(TARGET_FIS); // Quick lookup of matches we care about

  // Look through each match we received
  for (const event of events) {
    // Skip if it's not one of our target matches
    if (!targetFiSet.has(event.FI?.toString())) continue;

    // Collect all different types of betting options for this match
    const sections = [
      event.asian_lines, // Asian handicap bets
      event.goals,       // Over/under goals
      event.main,        // Main betting options
      event.half,        // First/second half bets
      event.minutes,     // Minute-specific bets
      event.specials,    // Special bets
      event.corners,     // Corner-related bets
      ...(Array.isArray(event.others) ? event.others : []) // Any other bets
    ];

    // Process each type of betting option
    // Loop through each 'section' in the 'sections' array
for (const section of sections) {
  // Call the 'processSection' function for each section,
  // passing the section itself and the consolidatedMarkets object for processing
  processSection(section, consolidatedMarkets);
}

  }

  // Remove any duplicate betting options before returning
  return deduplicateMarkets(consolidatedMarkets);
}

// Helper function: Processes one type of betting options
function processSection(sectionData, consolidatedMarkets) {
  if (!sectionData?.sp) return; // Skip if no betting options exist

  // Look through each betting option in this section
  for (const marketData of Object.values(sectionData.sp)) {
    if (!marketData) continue; // Skip if empty

    // Some betting options are nested, so we handle both cases:
    if (marketData.id && marketData.name) {
      // Simple case - just add this betting option
      addMarket(marketData, consolidatedMarkets);
    } else {
      // Complex case - look through sub-options
      for (const subMarketData of Object.values(marketData)) {
        if (subMarketData?.id && subMarketData?.name) {
          addMarket(subMarketData, consolidatedMarkets);
        }
      }
    }
  }
}

// Helper function: Adds a betting option to our collection
function addMarket(marketData, consolidatedMarkets) {
  const marketId = marketData.id.toString(); // Get betting option ID
  const marketName = marketData.name; // Get betting option name
  const marketKey = `${marketId}_${marketName}`; // Create unique key

  // If we haven't seen this betting option before, create a new entry
  if (!consolidatedMarkets[marketKey]) {
    consolidatedMarkets[marketKey] = {
      id: marketId,
      name: marketName,
      odds: [] // Start with empty odds list
    };
  }

  // Add the actual betting odds if they exist
  if (Array.isArray(marketData.odds) && marketData.odds.length > 0) {
    consolidatedMarkets[marketKey].odds.push(...marketData.odds.map(odd => ({
      id: odd.id,         // Odds ID
      odds: odd.odds,     // The actual odds (like 2.5)
      header: odd.header, // Category header
      name: odd.name,     // Option name
      handicap: odd.handicap // Handicap value if applicable
    })));
  }
}

// Helper function: Removes duplicate betting options
function deduplicateMarkets(markets) {
  const result = {}; // New container for unique options
  
  // Check each betting option we have
  for (const [key, market] of Object.entries(markets)) {
    const seenOdds = new Set(); // Track which odds we've seen
    
    // Filter out any duplicate odds
    market.odds = market.odds.filter(odd => {
      if (!odd.id || seenOdds.has(odd.id)) return false; // Skip duplicates
      seenOdds.add(odd.id); // Mark this odds ID as seen
      return true; // Keep this one
    });
    
    // Only keep betting options that have actual odds
    if (market.odds.length > 0) {
      result[key] = market;
    }
  }
  
  return result; // Return the cleaned-up list
}