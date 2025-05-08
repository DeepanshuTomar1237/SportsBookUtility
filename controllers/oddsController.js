const axios = require('axios');

// This function now extracts both market IDs and their odds
const extractMarketIdsByName = (sections, targetNames) => {
  const foundMarkets = {}; // Changed from foundIds to foundMarkets to store more data

  for (const section of Object.values(sections)) {
    if (!section?.sp) continue;

    for (const marketData of Object.values(section.sp)) {
      if (marketData?.name && marketData?.id) {
        const name = marketData.name.toLowerCase();

        for (const label of targetNames) {
          if (name.includes(label.toLowerCase())) {
            const labelKey = label.toUpperCase().replace(/ /g, '_');

            if (!foundMarkets[labelKey]) {
              foundMarkets[labelKey] = {};
            }

            // Store both market info and odds if available
            if (!foundMarkets[labelKey][marketData.id]) {
              foundMarkets[labelKey][marketData.id] = {
                name: marketData.name,
                odds: marketData.odds || [] // Include odds array if it exists
              };
            }
          }
        }
      }
    }
  }

  return foundMarkets;
};

// Updated to handle odds data
const extractMarketsByIds = (sections, targetMarkets) => {
  const foundMarkets = {};
  const seenIds = new Set();

  for (const section of Object.values(sections)) {
    if (!section?.sp) continue;

    for (const marketData of Object.values(section.sp)) {
      if (marketData?.id) {
        const marketId = marketData.id.toString();

        if (seenIds.has(marketId)) continue;

        for (const [label, idMarketMap] of Object.entries(targetMarkets)) {
          if (idMarketMap[marketId]) {
            if (!foundMarkets[label]) {
              foundMarkets[label] = {};
            }

            // Include both name and odds in the result
            foundMarkets[label][marketId] = {
              name: marketData.name,
              odds: marketData.odds || []
            };
            seenIds.add(marketId);
          }
        }
      }
    }
  }

  return foundMarkets;
};

const organizeMarkets = (filteredMarkets, requiredMarkets) => {
  const organized = {};

  for (const key of requiredMarkets) {
    organized[key] = filteredMarkets[key] || {};
  }

  return organized;
};

// Main function updated to handle odds data
exports.getOddsData = async (req, res) => {
  try {
    const response = await axios.get('https://api.b365api.com/v3/bet365/prematch', {
      params: {
        token: '72339-5QJh8lscw8VTIY',
        FI: '174229112'
      }
    });

    const event = response.data.results[0];

    const allSections = {
      asian_lines: event.asian_lines,
      goals: event.goals,
      main: event.main,
      half: event.half,
      others: event.others,
      minutes: event.minutes,
      specials: event.specials
    };

    const getAllMarketNames = (sections) => {
      const names = new Set();
      for (const section of Object.values(sections)) {
        if (!section?.sp) continue;
        for (const market of Object.values(section.sp)) {
          if (market?.name) {
            names.add(market.name);
          }
        }
      }
      return Array.from(names);
    };

    const dynamicMarketNames = getAllMarketNames(allSections);
    const dynamicPrematch = extractMarketIdsByName(allSections, dynamicMarketNames);
    const filteredPrematch = extractMarketsByIds(allSections, dynamicPrematch);
    const preMatchRequiredMarkets = Object.keys(dynamicPrematch);
    const PRE_MATCH_MARKETS = organizeMarkets(filteredPrematch, preMatchRequiredMarkets);

    // Format the response to include both market info and odds
    const formattedResponse = {
      PRE_MATCH_MARKETS: Object.entries(PRE_MATCH_MARKETS).reduce((acc, [marketType, markets]) => {
        acc[marketType] = Object.entries(markets).map(([marketId, marketData]) => ({
          id: marketId,
          name: marketData.name,
          odds: marketData.odds.map(odd => ({
            id: odd.id,
            odds: odd.odds,
            header: odd.header || '',
            name: odd.name || '',
            handicap: odd.handicap || ''
          }))
        }));
        return acc;
      }, {})
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Bet365 API' });
  }
};