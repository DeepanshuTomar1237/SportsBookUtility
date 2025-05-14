// utils/dataFormatter.js

// Helper function to format the final sports data object
function formatSportsData(markets) {
    return {
      id: 1, // Static sport ID (could be dynamic)
      name: 'Football',
      count: Object.keys(markets).length,
      markets: Object.values(markets).map(market => ({
        id: market.id,
        name: market.name,
      })),
    };
  }
  
  module.exports = { formatSportsData };
  