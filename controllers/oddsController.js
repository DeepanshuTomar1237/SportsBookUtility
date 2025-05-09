const axios = require('axios');

// Function to fetch and process betting odds data from Bet365 API
exports.getOddsData = async (req, res) => {
  try {
    // Make a request to the Bet365 API to get betting data for specific matches
    const response = await axios.get('https://api.b365api.com/v3/bet365/prematch', {
      params: {
        token: '72339-5QJh8lscw8VTIY',  // Bet365 API token
        FI: ['174229112', '174187790', '174277015', '174277029', '173834534', '173889244'].join(',')  // List of match IDs
      }
    });

    // Extract the first and second events from the response data
    const firstEvent = response.data.results?.[0];
    const secondEvent = response.data.results?.[1];
    
    // If the first event does not exist, return a 404 response with an error message
    if (!firstEvent) return res.status(404).json({ error: 'No events found' });

    // Initialize an object to store consolidated betting market data
    const consolidatedMarkets = {};

    // Iterate through the sections in the first event and collect betting odds
    for (const sectionName of Object.keys(firstEvent)) {
      const section = firstEvent[sectionName];
      
      // If the section doesn't contain odds data, skip it
      if (!section?.sp) continue;

      // Iterate through the market data within each section
      for (const marketData of Object.values(section.sp)) {
        // Skip market data without an ID or name
        if (!marketData?.id || !marketData?.name) continue;

        // Construct a unique key for each market using market ID and name
        const marketId = marketData.id.toString();
        const marketName = marketData.name;
        const marketKey = `${marketId}_${marketName}`;

        // If this market has not been added yet, initialize it in the consolidatedMarkets object
        if (!consolidatedMarkets[marketKey]) {
          consolidatedMarkets[marketKey] = { id: marketId, name: marketName, odds: [] };
        }

        // Get the odds for the current market from the first event
        let odds = marketData.odds;

        // If the odds are empty, check the second event for the same market and use its odds if available
        if (odds.length === 0) {
          const secondMarketData = Object.values(secondEvent?.[sectionName]?.sp || {}).find(market => market.name === marketName);
          odds = secondMarketData?.odds || [];
        }

        // If odds are available, add them to the consolidatedMarkets object
        if (odds.length) {
          const newOdds = odds.map(odd => ({
            id: odd.id,  // Unique identifier for the odd
            odds: odd.odds,  // Betting odds value
            header: odd.header,  // Header/label for the odd
            name: odd.name,  // Name of the odd
            handicap: odd.handicap  // Handicap value (if any)
          }));

          // Push the new odds to the corresponding market's odds array
          consolidatedMarkets[marketKey].odds.push(...newOdds);
        }
      }
    }

    // Remove duplicate odds by filtering them using a Set to track unique IDs
    // for (const market of Object.values(consolidatedMarkets)) {
    //   const seen = new Set();
    //   market.odds = market.odds.filter(odd => {
    //     // If the odd has no ID or it has already been seen, remove it
    //     if (!odd.id || seen.has(odd.id)) return false;
    //     seen.add(odd.id);
    //     return true;
    //   });
    // }

    // Prepare the final result with the consolidated betting markets
    const result = { PRE_MATCH_MARKETS: Object.values(consolidatedMarkets) };

    // Send the result as the response
    res.json([result]);

  } catch (error) {
    // Handle any errors during the API call or processing
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Bet365 API' });
  }
};
