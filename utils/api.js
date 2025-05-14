// utils/api.js

// Import necessary tools:
// - axios: A tool for making internet requests (like fetching data from websites)
// - dotenv: A tool for reading sensitive information from a secure file
const axios = require('axios');
require('dotenv').config();

// This function gets sports data from the Bet365 website
// It takes a list of sport IDs (FIs) as input
async function fetchBet365Data(FIs) {
  try {
    // Try to get data from Bet365:
    // 1. Use their website address (from our secure config)
    // 2. Send our special access key (token)
    // 3. Tell them which sports we want (the FIs list)
    // 4. Wait up to 1000 seconds if they're slow to respond
    const response = await axios.get(process.env.BET365_API_URL, {
      params: {
        token: process.env.BET365_API_TOKEN,
        FI: FIs.join(','), // Combine multiple sport IDs with commas
      },
      // This part formats the request correctly for the Bet365 system
      paramsSerializer: params =>
        Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&'),
    });

    // If successful, return the data we received
    return response.data;
  } catch (error) {
    // If something goes wrong:
    // 1. Show what went wrong in our system logs
    // 2. Stop and tell our system that we couldn't get the data
    console.error('API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
    });
    throw new Error('Failed to fetch data from Bet365 API');
  }
}

// Make this function available for other parts of our system to use
module.exports = { fetchBet365Data };