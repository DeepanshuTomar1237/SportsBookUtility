// market id target hai aur jo value hai id:value value section hai



const axios = require('axios'); // axios helps us get data from other websites using internet calls

// This function looks for betting options (called markets) that match certain names
const extractMarketIdsByName = (sections, targetNames) => {
  const foundIds = {}; // We'll store matching market IDs here

  // Go through each section of betting data (like goals, half-time, full-time)
  for (const section of Object.values(sections)) {
    if (!section?.sp) continue; // If this section has no market data, skip it

    // Go through each individual betting option in this section
    for (const marketData of Object.values(section.sp)) {
      if (marketData?.name && marketData?.id) {
        const name = marketData.name.toLowerCase(); // Make name lowercase to compare easily

        // Check if this market name matches any of our target names
        for (const label of targetNames) {
          if (name.includes(label.toLowerCase())) {
            const labelKey = label.toUpperCase().replace(/ /g, '_'); // Format label nicely, e.g. "Full Time" → "FULL_TIME"

            // If we haven't created a section for this label yet, do it now
            if (!foundIds[labelKey]) {
              foundIds[labelKey] = {};
            }

            // Add this market ID and name to our list (if not already added)
            if (!foundIds[labelKey][marketData.id]) {
              foundIds[labelKey][marketData.id] = marketData.name;
            }
          }
        }
      }
    }
  }

  return foundIds; // Return all matching market IDs grouped by name label
};

// This function picks only the market data we want, using the IDs we found earlier
const extractMarketsByIds = (sections, targetIds) => {
  const foundMarkets = {};
  const seenIds = new Set(); // Keeps track of IDs we've already added to avoid duplicates

  for (const section of Object.values(sections)) {
    if (!section?.sp) continue;

    for (const marketData of Object.values(section.sp)) {
      if (marketData?.id) {
        const marketId = marketData.id.toString();

        if (seenIds.has(marketId)) continue; // Skip if we already used this ID

        for (const [label, idNameMap] of Object.entries(targetIds)) {
          if (idNameMap[marketId]) {
            if (!foundMarkets[label]) {
              foundMarkets[label] = {};
            }

            // Save the market under the correct label
            foundMarkets[label][marketId] = marketData.name;
            seenIds.add(marketId); // Mark as added
          }
        }
      }
    }
  }

  return foundMarkets; // Return only the filtered markets we care about
};

// This function makes sure we return the markets in a consistent format, even if some are missing
const organizeMarkets = (filteredMarkets, requiredMarkets) => {
  const organized = {};

  for (const key of requiredMarkets) {
    // If we have data for this label, use it; otherwise use an empty object
    organized[key] = filteredMarkets[key] || {};
  }

  return organized;
};

// Main function that handles the web request to get odds data
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

    res.json({ PRE_MATCH_MARKETS });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Bet365 API' });
  }
};

