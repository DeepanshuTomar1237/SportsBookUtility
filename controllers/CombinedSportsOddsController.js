// controllers\CombinedSportsOddsController.js
// Import database models for football and ice hockey odds
const PreMatchOdds = require('../models/Football/PreMatchOdds');
const IceHockeyPreMatchOdds = require('../models/ICE_HOCKEY/PreMatchOdds');
const CommonOdds = require('../models/CommonFootballandIceHockeyOdds');

// This function combines odds data from football and ice hockey sports
exports.getCombinedSportsOdds = async (req, res) => {
  try {
    // Fetch data from both sports at the same time for efficiency
    const [footballData, iceHockeyData] = await Promise.all([
      PreMatchOdds.findOne({}), 
      IceHockeyPreMatchOdds.findOne({})
    ]);

    // Prepare football data
    const footballProcessed = footballData ? {
      PRE_MATCH_MARKETS: footballData.PRE_MATCH_MARKETS,
      total_markets: footballData.total_markets
    } : { PRE_MATCH_MARKETS: [] };

    // Prepare ice hockey data
    const iceHockeyProcessed = iceHockeyData ? {
      PRE_MATCH_MARKETS: iceHockeyData.markets || [],
      total_markets: iceHockeyData.count || 0
    } : { PRE_MATCH_MARKETS: [] };

    // If both sports have no data, return an error
    if ((!footballProcessed.PRE_MATCH_MARKETS.length) && (!iceHockeyProcessed.PRE_MATCH_MARKETS.length)) {
      return res.status(404).json({ error: 'No odds data found for any sport in database' });
    }

    // Create a map to store and combine markets from both sports
    const combinedMarketsMap = new Map();

    // Process football markets
    footballProcessed.PRE_MATCH_MARKETS.forEach(market => {
      combinedMarketsMap.set(market.id, {
        football_market_id: market.id,
        ice_hockey_market_id: market.id, // will be confirmed if ice hockey has same ID
        name: market.name,
        Football: {
          odds: market.odds.map(odd => ({
            id: odd.id,
            odds: odd.odds,
            name: odd.name,
            ...(odd.handicap && { handicap: odd.handicap }),
            ...(odd.header && { header: odd.header }),
            ...(odd.team && { team: odd.team })
          }))
        }
      });
    });

    // Process ice hockey markets
    iceHockeyProcessed.PRE_MATCH_MARKETS.forEach(market => {
      const existingMarket = combinedMarketsMap.get(market.id);
      if (existingMarket) {
        existingMarket.ice_hockey_market_id = market.id;
        existingMarket['ice-hockey'] = {
          odds: market.odds.map(odd => ({
            id: odd.id,
            odds: odd.odds,
            name: odd.name,
            ...(odd.handicap && { handicap: odd.handicap }),
            ...(odd.header && { header: odd.header }),
            ...(odd.team && { team: odd.team }),
            ...(odd.corner && { corner: odd.corner })
          }))
        };
      }
    });

    // Create sets of market IDs that exist in each sport
    const footballMarketIds = new Set(footballProcessed.PRE_MATCH_MARKETS.map(m => m.id));
    const iceHockeyMarketIds = new Set(iceHockeyProcessed.PRE_MATCH_MARKETS.map(m => m.id));

    // Find intersection of market IDs
    const commonMarketIds = [...footballMarketIds].filter(id => iceHockeyMarketIds.has(id));

    // Filter combined markets by common market IDs
    let combinedMarkets = Array.from(combinedMarketsMap.values())
      .filter(market => commonMarketIds.includes(market.football_market_id));

    // If no combined markets found
    if (!combinedMarkets.length) {
      return res.status(404).json({
        error: 'No common markets found between football and ice hockey',
        footballMarkets: footballProcessed.PRE_MATCH_MARKETS.map(m => ({ id: m.id, name: m.name })),
        iceHockeyMarkets: iceHockeyProcessed.PRE_MATCH_MARKETS.map(m => ({ id: m.id, name: m.name }))
      });
    }

    await Promise.all(
        combinedMarkets.map(async market => {
          await CommonOdds.findOneAndUpdate(
            {
              football_market_id: market.football_market_id,
              ice_hockey_market_id: market.ice_hockey_market_id
            },
            market,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        })
      );
      
    // Return the successfully combined data
    res.json(combinedMarkets);

  } catch (error) {
    console.error('Error in getCombinedSportsOdds:', error);
    res.status(500).json({
      error: 'Failed to fetch combined sports odds from database',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
