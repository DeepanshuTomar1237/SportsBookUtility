const axios = require('axios');

// Helper function to extract market details based on market name
const extractMarketIdsByName = (sections, targetNames) => {
  const foundIds = {};

  for (const section of Object.values(sections)) {
    if (!section?.sp) continue;

    for (const [marketName, marketData] of Object.entries(section.sp)) {
      if (marketData?.name) {
        const name = marketData.name.toLowerCase();

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

    // Extract market IDs and names dynamically for pre-match
    const dynamicPrematch = extractMarketIdsByName(allSections, preMatchTargetNames);
    const filteredPrematch = extractMarketsByIds(allSections, dynamicPrematch);

    // Extract market IDs and names dynamically for live markets
    const dynamicLive = extractMarketIdsByName(allSections, liveTargetNames);
    const filteredLive = extractMarketsByIds(allSections, dynamicLive);

    // Dynamically create the PRE_MATCH_MARKETS object
    const PRE_MATCH_MARKETS = {};
    const LIVE_MARKETS = {};

    // Define keys for pre-match markets
    const preMatchRequiredMarkets = ['FULL_TIME', 'TOTAL_GOALS', 'ASIAN_HANDICAP'];
    
    // Define keys for live markets
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

    // Populate PRE_MATCH_MARKETS
    for (const key of preMatchRequiredMarkets) {
      if (filteredPrematch[key]) {
        PRE_MATCH_MARKETS[key] = filteredPrematch[key];
      }
    }

    // Populate LIVE_MARKETS
    for (const key of liveRequiredMarkets) {
      if (filteredLive[key]) {
        LIVE_MARKETS[key] = filteredLive[key];
      }
    }

    res.json({
      PRE_MATCH_MARKETS,
      LIVE_MARKETS
    });
  } catch (error) {
    console.error('Error fetching odds:', error.message);
    res.status(500).json({ error: 'Failed to fetch odds data' });
  }
};