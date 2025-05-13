// Import the Axios library for making HTTP requests
const axios = require('axios');
// Load environment variables from a .env file into process.env
require('dotenv').config();

// Check if the required API configuration is present in environment variables
if (!process.env.BET365_API_URL || !process.env.BET365_API_TOKEN) {
  throw new Error('Missing required API configuration in environment variables');
}

// Define a fixed list of event IDs (FIs) that we want to fetch data for
const TARGET_FIS = [
  '174229112', '174187790', '174277015', 
  '173889141', '174217277', '173889464',
  '174408256'
];

// Controller function to handle the API request
exports.PreMatchoods = async (req, res) => {
  try {
    // Make a GET request to the Bet365 API with the required token and event IDs (FIs)
    const response = await axios.get(process.env.BET365_API_URL, {
      params: {
        token: process.env.BET365_API_TOKEN,
        FI: TARGET_FIS.join(',') // Join FIs into a comma-separated string
      },
      timeout: 10000, // Timeout after 10 seconds
      paramsSerializer: params => 
        Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&')
    });

    // Check if API response contains data
    if (!response.data?.results || response.data.results.length === 0) {
      // If no results, return a 404 response with some debugging info
      return res.status(404).json({ 
        error: 'No events found',
        request: {
          FIs: TARGET_FIS,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Process the list of events and consolidate the market data
    const consolidatedMarkets = processEvents(response.data.results);
    // Format the consolidated data into a final structure
    const sportsData = formatSportsData(consolidatedMarkets);

    // Send the formatted sports data as a JSON response
    res.json([sportsData]);

  } catch (error) {
    // Log error details for debugging
    console.error('API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Send a 500 response with error details
    res.status(500).json({
      error: 'Failed to fetch data from Bet365 API',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
};

//////////////////////////////////////////////////////
// =============== Helper Functions ================
//////////////////////////////////////////////////////

// Process the list of events and extract betting market data
function processEvents(events) {
  const consolidatedMarkets = {};
  const targetFiSet = new Set(TARGET_FIS); // Convert list to Set for fast lookup

  for (const event of events) {
    // Only process events that match one of the TARGET_FIS IDs
    if (!targetFiSet.has(event.FI?.toString())) continue;

    // Combine all betting sections into one array
    const sections = [
      event.asian_lines,
      event.goals,
      event.main,
      event.half,
      event.minutes,
      event.specials,
      event.corners,
      ...(Array.isArray(event.others) ? event.others : [])
    ];

    // Process each section one by one
    for (const section of sections) {
      processSection(section, consolidatedMarkets);
    }
  }

  // Remove duplicate odds before returning
  return deduplicateMarkets(consolidatedMarkets);
}

// Process one section and add markets to the consolidatedMarkets object
function processSection(sectionData, consolidatedMarkets) {
  if (!sectionData?.sp) return; // Skip if section has no market data

  // Loop through each market in the section
  for (const marketData of Object.values(sectionData.sp)) {
    if (!marketData) continue;

    // Some markets are nested inside objects, others are direct
    if (marketData.id && marketData.name) {
      // If it's a direct market with id and name
      addMarket(marketData, consolidatedMarkets);
    } else {
      // If it's a nested object, loop through and add each sub-market
      for (const subMarketData of Object.values(marketData)) {
        if (subMarketData?.id && subMarketData?.name) {
          addMarket(subMarketData, consolidatedMarkets);
        }
      }
    }
  }
}

// Add a market and its odds to the consolidated object
function addMarket(marketData, consolidatedMarkets) {
  const marketId = marketData.id.toString();
  const marketName = marketData.name;
  const marketKey = `${marketId}_${marketName}`; // Unique key using id and name

  // If market doesn't already exist in the map, initialize it
  if (!consolidatedMarkets[marketKey]) {
    consolidatedMarkets[marketKey] = {
      id: marketId,
      name: marketName,
      odds: []
    };
  }

  // Add each odd from this market to the list
  if (Array.isArray(marketData.odds) && marketData.odds.length > 0) {
    consolidatedMarkets[marketKey].odds.push(...marketData.odds.map(odd => ({
      id: odd.id,
      odds: odd.odds,
      header: odd.header,
      name: odd.name,
      handicap: odd.handicap
    })));
  }
}

// Remove duplicate odds from each market
function deduplicateMarkets(markets) {
  const result = {};

  for (const [key, market] of Object.entries(markets)) {
    const seenOdds = new Set();

    // Filter out odds with duplicate IDs
    market.odds = market.odds.filter(odd => {
      if (!odd.id || seenOdds.has(odd.id)) return false;
      seenOdds.add(odd.id);
      return true;
    });

    // Only include market if it has any odds left
    if (market.odds.length > 0) {
      result[key] = market;
    }
  }

  return result;
}

// Format the final sports data object to return
function formatSportsData(markets) {
  return {
    id: 1, // static sport ID (could be dynamic)
    name: "Football",
    count: Object.keys(markets).length, // total number of unique markets
    markets: Object.values(markets).map(market => ({
      id: market.id,
      name: market.name
    }))
  };
}
