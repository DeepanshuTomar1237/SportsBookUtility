const axios = require('axios');

// Extract market IDs by name
const extractMarketIdsByName = (sections, targetNames) => {
  const foundIds = {};

  for (const section of Object.values(sections)) {
    if (!section?.sp) continue;

    for (const marketData of Object.values(section.sp)) {
      if (marketData?.name && marketData?.id) {
        const name = marketData.name.toLowerCase();

        for (const label of targetNames) {
          if (name.includes(label.toLowerCase())) {
            const labelKey = label.toUpperCase().replace(/ /g, '_');

            if (!foundIds[labelKey]) {
              foundIds[labelKey] = {};
            }

            if (!foundIds[labelKey][marketData.id]) {
              foundIds[labelKey][marketData.id] = marketData.name;
            }
          }
        }
      }
    }
  }

  return foundIds;
};

// Filter markets by ID
const extractMarketsByIds = (sections, targetIds) => {
  const foundMarkets = {};
  const seenIds = new Set();

  for (const section of Object.values(sections)) {
    if (!section?.sp) continue;

    for (const marketData of Object.values(section.sp)) {
      if (marketData?.id) {
        const marketId = marketData.id.toString();

        if (seenIds.has(marketId)) continue;

        for (const [label, idNameMap] of Object.entries(targetIds)) {
          if (idNameMap[marketId]) {
            if (!foundMarkets[label]) {
              foundMarkets[label] = {};
            }

            foundMarkets[label][marketId] = marketData.name;
            seenIds.add(marketId);
          }
        }
      }
    }
  }

  return foundMarkets;
};

// Organize into required structure
const organizeMarkets = (filteredMarkets, requiredMarkets) => {
  const organized = {};

  for (const key of requiredMarkets) {
    organized[key] = filteredMarkets[key] || {};
  }

  return organized;
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
      minutes: event.minutes,
      specials: event.specials
    };

    // Create a flat name-to-id mapping
    const createFlatMarketMapping = (sections) => {
      const flatMap = {};
      const seenNames = new Set();
      let totalMarkets = 0;

      for (const section of Object.values(sections)) {
        if (!section?.sp) continue;

        for (const marketData of Object.values(section.sp)) {
          if (marketData?.name && marketData?.id) {
            const name = marketData.name.trim();
            
            // Only add if we haven't seen this exact name before
            if (!seenNames.has(name)) {
              flatMap[name] = marketData.id.toString();
              seenNames.add(name);
              totalMarkets++;
            }
          }
        }
      }

      return {
        markets: flatMap,
        total_markets: totalMarkets
      };
    };

    const marketData = createFlatMarketMapping(allSections);

    res.json(marketData);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};