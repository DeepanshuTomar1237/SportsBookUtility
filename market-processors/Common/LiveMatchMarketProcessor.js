// market-processors\Common\LiveMatchMarketProcessor.js
// Import the axios library for making HTTP requests
const axios = require('axios');

// Load environment variables from a .env file into process.env
require('dotenv').config();

// Read the base API URL from environment variables
const API_BASE_URL = process.env.API_BASE_URL;

// If API_BASE_URL is not defined, throw an error to prevent the code from running incorrectly
if (!API_BASE_URL) {
  throw new Error('API_BASE_URL is not defined in environment variables');
}

/**
 * Fetches market data for a specific event from the external API
 * and stores unique market name-to-id pairs in the marketMap.
 *
 * @param {string} eventId - The event ID for which data is to be fetched
 * @param {Map} marketMap - A map that stores unique market names and their IDs
 */
const fetchMarketData = async (eventId, marketMap) => {
  try {
    // Make a GET request to fetch event data by event ID
    const response = await axios.get(`${API_BASE_URL}/event`, {
      params: { evId: eventId }, // Send event ID as query parameter
    });

    // Check if the API response is marked as successful
    if (!response.data?.success) {
      console.warn(`API returned non-success for event ${eventId}`);
      return; // Exit if the event was not fetched successfully
    }

    // Extract markets array from the response, or use an empty array if undefined
    const markets = response.data?.eventData?.markets || [];

    // Loop through each market in the response
    markets.forEach((market) => {
      // If market name is missing, skip it
      if (!market?.name) return;

      // Extract market ID. Use either 'market' or 'id' depending on availability
      const marketId = market.market || market.id;

      // Only add the market if it hasn't already been added (to avoid duplicates)
      if (!marketMap.has(market.name)) {
        marketMap.set(market.name, marketId);
      }
    });

  } catch (err) {
    // If any error occurs during the API call, log it
    console.error(`Error fetching event ${eventId}:`, err.message);
  }
};

/**
 * Processes live match markets for multiple events.
 * Calls fetchMarketData for each event and collects unique market info.
 *
 * @param {string[]} eventIds - Array of event IDs to process
 * @returns {Object} - Processed market information including count and market details
 */
const processLiveMatchMarket = async (eventIds) => {
  // Create a Map to store unique market names and their corresponding market IDs
  const marketMap = new Map();

  // For all event IDs, fetch their market data concurrently using Promise.all
  await Promise.all(
    eventIds.map((id) => fetchMarketData(id, marketMap))
  );

  // Return final structured result
  return {
    // Total number of unique markets found
    count: marketMap.size,

    // Convert the Map into an array of objects with { id, name }
    markets: Array.from(marketMap, ([name, id]) => ({ id, name })),

    // You could include eventIds, sport name, or sportId here if needed (currently commented)
    // sportId: 1,
    // name: "Football",
    // eventIds,
  };
};

// Export the processor so it can be used in other parts of the application
module.exports = { processLiveMatchMarket };
