const axios = require('axios');

// Helper function to extract market details based on market name
const extractMarketIdsByName = (sections, targetNames) => {
  const foundIds = {};

  // Iterate over each section of the event
  for (const section of Object.values(sections)) {
    if (!section?.sp) continue;

    // Iterate over each market in the section
    for (const [marketName, marketData] of Object.entries(section.sp)) {
      if (marketData?.name && marketData?.id) {
        const name = marketData.name.toLowerCase();

        // Check if the market name contains any of the target names
        for (const label of targetNames) {
          if (name.includes(label.toLowerCase())) {
            const labelKey = label.toUpperCase().replace(/ /g, '_');
            
            // Check if this market ID is already recorded for this label
            if (!foundIds[labelKey]) {
              foundIds[labelKey] = [];
            }
            
            // Avoid duplicates by checking if this ID is already present
            const existing = foundIds[labelKey].find(m => m.id === marketData.id);
            if (!existing) {
              foundIds[labelKey].push({
                id: marketData.id,
                name: marketData.name
              });
            }
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
  const seenIds = new Set(); // Track seen market IDs to avoid duplicates

  // Iterate over each section of the event
  for (const section of Object.values(sections)) {
    if (!section?.sp) continue;

    // Iterate over each market in the section
    for (const [marketName, marketData] of Object.entries(section.sp)) {
      if (marketData?.id) {
        const marketId = marketData.id.toString();

        // Skip if we've already processed this market ID
        if (seenIds.has(marketId)) continue;
        
        // Compare market IDs with the target IDs
        for (const [label, targetDataArray] of Object.entries(targetIds)) {
          for (const targetData of targetDataArray) {
            if (marketId === targetData.id) {
              if (!foundMarkets[label]) {
                foundMarkets[label] = [];
              }
              
              // Only add if there are odds or if we want to keep empty markets
              if (marketData.odds?.length > 0 || true) { // Set to false if you want to skip empty markets
                foundMarkets[label].push({
                  id: marketData.id,
                  name: marketData.name,
                  odds: marketData.odds || [],
                });
                seenIds.add(marketId); // Mark this ID as processed
              }
            }
          }
        }
      }
    }
  }

  return foundMarkets;
};

// Function to clean and organize the markets data
const organizeMarkets = (filteredMarkets, requiredMarkets) => {
  const organized = {};

  for (const key of requiredMarkets) {
    if (filteredMarkets[key] && filteredMarkets[key].length > 0) {
      // Keep non-empty markets
      organized[key] = filteredMarkets[key].filter(market => 
        market.odds && market.odds.length > 0
      );

      // If all were filtered out, keep at least one
      if (organized[key].length === 0 && filteredMarkets[key].length > 0) {
        organized[key] = [filteredMarkets[key][0]];
      }
    } else {
      // Ensure the key exists even if no market was found
      organized[key] = [];
    }
  }

  return organized;
};


exports.getOddsData = async (req, res) => {
  try {
    // Fetch odds data from the external API
    const response = await axios.get('https://betsapi.com/docs/samples/bet365_prematch_odds.json');
    const event = response.data.results[0];

    // Define all sections from the event
    const allSections = {
      asian_lines: event.asian_lines,
      goals: event.goals,
      main: event.main,
      half: event.half,
      others: event.others,
      minutes: event.minutes,
      specials: event.specials
    };

    // Define target market names for pre-match
    const preMatchTargetNames = ['Full Time', 'Total Goals', 'Asian Handicap'];
    
    // Define target market names for live markets
    const liveTargetNames = [
      'Full Time', 
      'Total Goals', 
      'Asian Goal Line',
      'Asian Handicap',
      'Match Corners',
      'Two Way Corners',
      'Asian Corners',
      'Corners Race'
    ];

    // Extract market IDs dynamically for pre-match
    const dynamicPrematch = extractMarketIdsByName(allSections, preMatchTargetNames);
    const filteredPrematch = extractMarketsByIds(allSections, dynamicPrematch);

    // Extract market IDs dynamically for live markets
    const dynamicLive = extractMarketIdsByName(allSections, liveTargetNames);
    const filteredLive = extractMarketsByIds(allSections, dynamicLive);

    // Define keys for required pre-match markets
    const preMatchRequiredMarkets = ['FULL_TIME', 'TOTAL_GOALS', 'ASIAN_HANDICAP'];
    
    // Define keys for required live markets
    const liveRequiredMarkets = [
      'FULL_TIME',
      'TOTAL_GOALS',
      'ASIAN_GOAL_LINE',
      'ASIAN_HANDICAP',
      'MATCH_CORNERS',
      'TWO_WAY_CORNERS',
      'ASIAN_CORNERS',
      'CORNERS_RACE'
    ];

    // Organize the markets data
    const PRE_MATCH_MARKETS = organizeMarkets(filteredPrematch, preMatchRequiredMarkets);
    const LIVE_MARKETS = organizeMarkets(filteredLive, liveRequiredMarkets);

    // Return the final response with pre-match and live markets
    res.json({
      PRE_MATCH_MARKETS,
      LIVE_MARKETS
    });
  } catch (error) {
    console.error('Error fetching odds:', error.message);
    res.status(500).json({ error: 'Failed to fetch odds data' });
  }
};