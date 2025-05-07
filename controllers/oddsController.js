const axios = require('axios');

// Helper function to extract market details based on market name
const extractMarketIdsByName = (sections, targetNames) => {
  const foundIds = {};

  for (const section of Object.values(sections)) {
    if (!section?.sp) continue;

    for (const [marketName, marketData] of Object.entries(section.sp)) {
      if (marketData?.name) {
        const name = marketData.name.toLowerCase();

        console.log(`Checking market: ${marketData.name}`); // Log each market to see if "Total Goals" is being missed

        for (const label of targetNames) {
          if (name.includes(label.toLowerCase()) && marketData?.id) {
            // Allow multiple entries for the same market name
            if (!foundIds[label.toUpperCase().replace(/ /g, '_')]) {
              foundIds[label.toUpperCase().replace(/ /g, '_')] = [];
            }
            foundIds[label.toUpperCase().replace(/ /g, '_')].push({
              id: marketData.id,
              name: marketData.name
            });
          }
        }
      }
    }
  }

  return foundIds;
};

// Extract markets data by matching market IDs
const extractMarketsByIds = (sections, targetIds) => {
  const foundMarkets = {};

  for (const section of Object.values(sections)) {
    if (!section?.sp) continue;

    for (const [marketName, marketData] of Object.entries(section.sp)) {
      if (marketData?.id) {
        const marketId = marketData.id.toString();  // Convert ID to string for comparison
        for (const [label, targetDataArray] of Object.entries(targetIds)) {
          // Compare market IDs as strings to handle both numeric and alphanumeric
          for (const targetData of targetDataArray) {
            if (marketId === targetData.id) {
              if (!foundMarkets[label]) {
                foundMarkets[label] = [];
              }
              foundMarkets[label].push({
                id: marketData.id,
                name: marketData.name,
                odds: marketData.odds,
              });
            }
          }
        }
      }
    }
  }

  return foundMarkets;
};

exports.getOddsData = async (req, res) => {
  try {
    const response = await axios.get('https://betsapi.com/docs/samples/bet365_prematch_odds.json');
    const event = response.data.results[0];

    const allSections = {
      asian_lines: event.asian_lines,
      goals: event.goals,
      main: event.main,
      half: event.half,
      others: event.others,
    };

    // Define only the target market names you want to extract
    const targetNames = ['Full Time', 'Total Goals', 'Asian Handicap'];

    // Extract market IDs and names dynamically
    const dynamicPrematch = extractMarketIdsByName(allSections, targetNames);

    console.log('Dynamic Prematch:', dynamicPrematch); // Log the dynamic markets to check if 'TOTAL_GOALS' is present

    // Extract the filtered market data based on dynamic market IDs
    const filteredPrematch = extractMarketsByIds(allSections, dynamicPrematch);

    console.log('Filtered Prematch:', filteredPrematch); // Log the filtered market data

    // Dynamically create the PRE_MATCH_MARKETS object
    const PRE_MATCH_MARKETS = {};

    // Define only the keys you want to return (Full Time, Total Goals, Asian Handicap)
    const requiredMarkets = ['FULL_TIME', 'TOTAL_GOALS', 'ASIAN_HANDICAP'];

    // Populate PRE_MATCH_MARKETS with the filtered data, but allow multiple entries for each market
    for (const key of requiredMarkets) {
      if (filteredPrematch[key]) {
        PRE_MATCH_MARKETS[key] = filteredPrematch[key];
      }
    }

    res.json({
      PRE_MATCH_MARKETS, // Return the filtered structure with only the required markets
    });
  } catch (error) {
    console.error('Error fetching odds:', error.message);
    res.status(500).json({ error: 'Failed to fetch odds data' });
  }
};
