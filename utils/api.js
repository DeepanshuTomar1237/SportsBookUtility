// utils/api.js

const axios = require('axios');
require('dotenv').config();

// Helper function to make API request to Bet365
async function fetchBet365Data(FIs) {
  try {
    const response = await axios.get(process.env.BET365_API_URL, {
      params: {
        token: process.env.BET365_API_TOKEN,
        FI: FIs.join(','),
      },
      timeout: 1000000,
      paramsSerializer: params =>
        Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&'),
    });

    return response.data;
  } catch (error) {
    console.error('API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
    });
    throw new Error('Failed to fetch data from Bet365 API');
  }
}

module.exports = { fetchBet365Data };
