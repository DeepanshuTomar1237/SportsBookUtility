// controllers\Football\LiveMatchMarket.js

// Import necessary tools (like special toolboxes we need)
const axios = require('axios'); // Tool for making internet requests
require('dotenv').config(); // Tool for reading our secret configuration file

// Check if our secret website address is properly set up
if (!process.env.API_BASE_URL) {
  throw new Error('API_BASE_URL is not defined in environment variables');
}

// Our main website address for getting football data
const API_BASE_URL = process.env.API_BASE_URL;

// Default list of football matches to track if none are specified
const DEFAULT_EVENT_IDS = [
  '174408207', '174398330', '174503298', '174293212', 
  '174402920', '174393237', '173835338', '173832526', 
  '174409469', '174407976', '174539252', '174553013'
];

// The main function that handles requests for live football match data
exports.LiveMatchMarket = async (req, res) => {
  try {
    // Decide which football matches to get data for:
const eventIds = req.query.evIds
? [...new Set(req.query.evIds.split(','))] // If specific matches were requested
: DEFAULT_EVENT_IDS; // Otherwise use our default matches

/* 
What this does:
1. First checks if someone asked for specific matches (using 'evIds' in the web address)
 - Example web address might look like: website.com?evIds=123,456,789

2. If specific matches WERE requested (req.query.evIds exists):
 a) Split the comma-separated string into individual IDs
    - "123,456,789" becomes ["123", "456", "789"]
 b) Remove any duplicate IDs using 'new Set()'
    - If someone accidentally put "123,456,123", it becomes just "123,456"
 c) Convert back to an array with [... ] (the spread operator)

3. If NO specific matches were requested:
 - Use our default list of matches (DEFAULT_EVENT_IDS)
 - These are matches we've pre-selected as important to track

Why this is useful:
- Gives flexibility to get data for either specific matches or our defaults
- Automatically cleans up the input by removing duplicates
- Makes sure we always have a list of matches to check, even if none were specified
*/

    // Create a storage space to keep track of all betting options
    const marketMap = new Map();

    // Step 2: Define how to get data for one football match
    const fetchMarketData = async (eventId) => {
      try {
        // Ask the website for data about this specific match
        const response = await axios.get(`${API_BASE_URL}/event`, {
          params: { evId: eventId }, // Tell them which match we want
          timeout: 5000 // Don't wait more than 5 seconds for a reply
        });

        // If the website says there's a problem with this match, skip it
        if (!response.data?.success) {
          console.warn(`API returned non-success for event ${eventId}`);
          return;
        }

        // Get all the different betting options for this match
        const markets = response.data?.eventData?.markets || [];
        
        // Step 3: Process each betting option
        markets.forEach((market) => {
          if (!market?.name) return; // Skip if no name

          // Figure out the ID for this betting option:
          // 1. First try the main ID
          // 2. If not found, check the first odds item
          // 3. If still not found, use '1778' as a backup
          let marketId = market.market || 
                        (market.Odds?.[0]?.market);
          
          // Store this betting option if we haven't seen it before
          if (!marketMap.has(market.name)) {
            marketMap.set(market.name, marketId);
          }
        });
      } catch (err) {
        // If something goes wrong with this match, just log it and continue
        console.error(`Error fetching event ${eventId}:`, err.message);
      }
    };

    // Step 4: Get data for ALL matches at the same time (for speed)
    await Promise.all(eventIds.map(fetchMarketData));

    // Step 5: Prepare the final result in the right format
    const result = [{
      id: 1, // Football sport ID
      name: "Football", // Sport name
      count: marketMap.size, // How many different betting options we found
      markets: Array.from(marketMap, ([name, id]) => ({ id, name })) // List of all options
    }];

    // Step 6: Send the result back to whoever asked for it
    res.json(result);

  } catch (error) {
    // If something goes REALLY wrong, handle it here
    console.error('Controller Error:', {
      message: error.message,
      stack: error.stack
    });

    // Send an error message back
    res.status(500).json({
      error: 'Internal server error', // Simple message for everyone
      // Only show technical details if we're in development mode
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
};