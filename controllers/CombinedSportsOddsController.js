// Import database models for football and ice hockey odds
const PreMatchOdds = require('../models/Football/PreMatchOdds');
const IceHockeyPreMatchOdds = require('../models/ICE_HOCKEY/PreMatchOdds');

// This function combines odds data from football and ice hockey sports
exports.getCombinedSportsOdds = async (req, res) => {
  try {
    // Fetch data from both sports at the same time for efficiency
    // Use `Promise.all` to fetch data from both sports **at the same time** (efficient parallel requests)
    const [footballData, iceHockeyData] = await Promise.all([
    //  Fetch FOOTBALL odds:
    PreMatchOdds.findOne({}), 
    //    - `findOne({})` means "get the first document (record) you find"  
    //    - Returns football odds data or `null` if none exists
  
    //  Fetch ICE HOCKEY odds:
    IceHockeyPreMatchOdds.findOne({})  
    //    - `{ id: 17 }` means "find the record where ID equals 17"  
    //    - Returns ice hockey odds for a specific match/tournament or `null`
  ]);
  
  // After both requests finish, results are stored in:
  // - footballData (football odds or null)
  // - iceHockeyData (ice hockey odds or null)

    // Prepare football data: keep only what we need
    const footballProcessed = footballData ? {
      PRE_MATCH_MARKETS: footballData.PRE_MATCH_MARKETS, // The actual betting markets
      total_markets: footballData.total_markets // Count of how many markets exist
    } : { PRE_MATCH_MARKETS: [] }; // If no data, use empty array

    // Prepare ice hockey data similarly
    const iceHockeyProcessed = iceHockeyData ? {
      PRE_MATCH_MARKETS: iceHockeyData.markets || [], // Markets data (or empty if none)
      total_markets: iceHockeyData.count || 0 // Market count
    } : { PRE_MATCH_MARKETS: [] };

    // If both sports have no data, return an error
    if ((!footballProcessed.PRE_MATCH_MARKETS.length) && (!iceHockeyProcessed.PRE_MATCH_MARKETS.length)) {
      return res.status(404).json({ error: 'No odds data found for any sport in database' });
    }

    // Create a map to store and combine markets from both sports
    const combinedMarketsMap = new Map();

    // Process football markets first
    footballProcessed.PRE_MATCH_MARKETS.forEach(market => {
      combinedMarketsMap.set(market.id, { // Use market ID as the key
        football_market_id: market.id, // Store football market ID
        ice_hockey_market_id: market.id, // Temporary value (may be updated later)
        name: market.name, // Market name (e.g., "Match Winner")
        Football: { // Football-specific odds data
          odds: market.odds.map(odd => ({ // Process each betting option
            id: odd.id, // Unique ID for this option
            odds: odd.odds, // The actual odds number (e.g., 2.5)
            name: odd.name, // Option name (e.g., "Home Team")
            ...(odd.handicap && { handicap: odd.handicap }), // Include if exists (for handicap bets)
            ...(odd.header && { header: odd.header }), // Include if exists (grouping info)
            ...(odd.team && { team: odd.team }) // Include if exists (team info)
          }))
        }
      });
    });

    // Now process ice hockey markets
    iceHockeyProcessed.PRE_MATCH_MARKETS.forEach(market => {
      const existingMarket = combinedMarketsMap.get(market.id);
      if (existingMarket) { // If this market exists in football data
        existingMarket.ice_hockey_market_id = market.id; // Update ice hockey market ID
        existingMarket['ice-hockey'] = { // Add ice hockey odds data
          odds: market.odds.map(odd => ({ // Process each ice hockey betting option
            id: odd.id,
            odds: odd.odds,
            name: odd.name,
            ...(odd.handicap && { handicap: odd.handicap }),
            ...(odd.header && { header: odd.header }),
            ...(odd.team && { team: odd.team })
          }))
        };
      }
    });

    // Filter to keep only markets that exist in BOTH sports
    let combinedMarkets = Array.from(combinedMarketsMap.values())
      .filter(market => market.Football && market['ice-hockey']);

    // Special handling for market with ID "40" (considered important)
    const priorityMarketIndex = combinedMarkets.findIndex(m => m.id === "40");
    if (priorityMarketIndex !== -1) { // If found
      const [priorityMarket] = combinedMarkets.splice(priorityMarketIndex, 1); // Remove it
      combinedMarkets.unshift(priorityMarket); // Put it at the beginning of the array
    }

    // If no combined markets found after filtering
    if (!combinedMarkets.length) {
      return res.status(404).json({
        error: 'No combined markets found with both football and ice hockey data',
        suggestion: 'The markets may not have synchronized IDs between sports'
      });
    }

    // Return the successfully combined data
    res.json(combinedMarkets);

  } catch (error) {
    // If any error occurs in the process above
    console.error('Error in getCombinedSportsOdds:', error);
    res.status(500).json({
      error: 'Failed to fetch combined sports odds from database',
      details: error.message, // Technical error details
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined // More details in development
    });
  }
};