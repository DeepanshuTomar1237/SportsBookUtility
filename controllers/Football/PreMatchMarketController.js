// / controllers\Football\PreMatchmarket.js

// Import the Axios library for making HTTP requests
const axios = require('axios');
// Load environment variables from a .env file into process.env
require('dotenv').config();

// Check if the required API configuration is present in environment variables
if (!process.env.BET365_API_URL || !process.env.BET365_API_TOKEN) {
  throw new Error('Missing required API configuration in environment variables');
}

// Define a list of fixed event IDs that we want to fetch data for
const TARGET_FIS = [
  '174229112', '174187790', '174277015', 
  '173889141', '174217277', '173889464',
  '174408256'
];

// Import the model that interacts with the database
const PreMatchMarket = require('../../models/PreMatchMarket');

// Controller function to handle the API request
// PreMatchMarket
// PreMatchoods
exports.PreMatchMarket = async (req, res) => {
  try {
    // Make a request to the Bet365 API to fetch data about events
    const response = await axios.get(process.env.BET365_API_URL, {
      params: {
        token: process.env.BET365_API_TOKEN, // API Token for authentication
        FI: TARGET_FIS.join(',') // Join the event IDs into a single string for the request
      },
      timeout: 10000, // Set a timeout of 10 seconds for the request
      paramsSerializer: params =>
        Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`) // Format the request parameters
          .join('&')
    });

    // If no events are found, return an error response
    if (!response.data?.results || response.data.results.length === 0) {
      return res.status(404).json({
        error: 'No events found', // Error message
        request: {
          FIs: TARGET_FIS, // List of event IDs we searched for
          timestamp: new Date().toISOString() // The time of the request
        }
      });
    }

    // Process the event data received from the API
    const consolidatedMarkets = processEvents(response.data.results);

    // Format the data into a user-friendly format
    const sportsData = formatSportsData(consolidatedMarkets);

    // Save the processed data to the database, or update it if it already exists
    await PreMatchMarket.findOneAndUpdate(
      { id: sportsData.id }, // Find the document by ID
      sportsData, // Update or insert the new sports data
      { upsert: true, new: true } // Create a new record if it doesn't exist
    );

    // Send the processed data as a response
    res.json([sportsData]);

  } catch (error) {
    // If an error occurs during the API request, log it and send an error response
    console.error('API Error:', {
      message: error.message, // Display the error message
      url: error.config?.url, // URL where the error happened
      status: error.response?.status, // HTTP status code
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined // Only show stack trace in development
    });

    // Send a 500 error response
    res.status(500).json({
      error: 'Failed to fetch data from Bet365 API', // General error message
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message, // Show detailed error in development
        stack: error.stack // Show stack trace in development
      })
    });
  }
};

// Helper function to process the event data and extract the relevant betting information
function processEvents(events) {
  const consolidatedMarkets = {}; // Initialize an empty object to hold processed markets
  const targetFiSet = new Set(TARGET_FIS); // Convert list of event IDs into a Set for fast lookup

  // Loop through each event in the response
  for (const event of events) {
    // Only process events that match one of the TARGET_FIS IDs
    if (!targetFiSet.has(event.FI?.toString())) continue;

    // Combine all betting sections (e.g., goals, half, corners, etc.) into one array for easier processing
    const sections = [
      event.asian_lines,
      event.goals,
      event.main,
      event.half,
      event.minutes,
      event.specials,
      event.corners,
      ...(Array.isArray(event.others) ? event.others : []) // Handle any other sections dynamically
    ];

    // Process each section one by one
    for (const section of sections) {
      processSection(section, consolidatedMarkets); // Add market data from the section
    }
  }

  // Return the processed markets without the odds
  return consolidatedMarkets;
}

// Helper function to process each betting section (e.g., goals, corners)
function processSection(sectionData, consolidatedMarkets) {
  if (!sectionData?.sp) return; // Skip sections with no market data

  // Loop through each market in the section
  for (const marketData of Object.values(sectionData.sp)) {
    if (!marketData) continue;

    // If the market has an ID and name, add it to the consolidatedMarkets
    if (marketData.id && marketData.name) {
      addMarket(marketData, consolidatedMarkets);
    } else {
      // If the market is nested inside another object, process each sub-market
      for (const subMarketData of Object.values(marketData)) {
        if (subMarketData?.id && subMarketData?.name) {
          addMarket(subMarketData, consolidatedMarkets);
        }
      }
    }
  }
}

// Helper function to add a market to the consolidatedMarkets object
function addMarket(marketData, consolidatedMarkets) {
  const marketId = marketData.id.toString();
  const marketName = marketData.name;
  const marketKey = `${marketId}_${marketName}`; // Create a unique key using the market ID and name

  // If the market doesn't already exist in the map, initialize it
  if (!consolidatedMarkets[marketKey]) {
    consolidatedMarkets[marketKey] = {
      id: marketId,
      name: marketName,
    };
  }
}

// Helper function to format the final sports data object
function formatSportsData(markets) {
  return {  
    id: 1, // Static sport ID (could be dynamic)
    name: "Football", // The sport name
    count: Object.keys(markets).length, // Total number of unique markets
    markets: Object.values(markets).map(market => ({
      id: market.id, // Market ID
      name: market.name // Market name
    }))
  };
}
