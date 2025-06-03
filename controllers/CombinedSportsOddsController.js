// controllers\CombinedSportsOddsController.js
const { fetchBet365Data } = require('../utils/api');
const { TARGET_FIS, TARGET_FIS_HOCKEY } = require('../constants/bookmakers');
const PreMatchOddsProcessor = require('../market-processors/Football/PreMatchOddsProcessor');

exports.getCombinedSportsOdds = async (req, res) => {
  try {
    // Fetch both football and ice hockey data directly from API
    const [footballData, iceHockeyData] = await Promise.all([
      fetchBet365Data(TARGET_FIS),
      fetchBet365Data(TARGET_FIS_HOCKEY)
    ]);

    // Process both datasets
    const footballProcessed = PreMatchOddsProcessor.process(footballData, TARGET_FIS);
    const iceHockeyProcessed = PreMatchOddsProcessor.process(iceHockeyData, TARGET_FIS_HOCKEY);

    if ((!footballProcessed.PRE_MATCH_MARKETS || !footballProcessed.PRE_MATCH_MARKETS.length) && 
        (!iceHockeyProcessed.PRE_MATCH_MARKETS || !iceHockeyProcessed.PRE_MATCH_MARKETS.length)) {
      return res.status(404).json({ error: 'No odds data found for any sport' });
    }

    const combinedMarketsMap = new Map();

    // Process football markets first
    if (footballProcessed.PRE_MATCH_MARKETS) {
      footballProcessed.PRE_MATCH_MARKETS.forEach(market => {
        combinedMarketsMap.set(market.id, {
          id: market.id,
          football_market_id: market.id,
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
    }

    // Process ice hockey markets and merge with existing football markets
    if (iceHockeyProcessed.PRE_MATCH_MARKETS) {
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
              ...(odd.team && { team: odd.team })
            }))
          };
        }
        // Only add to map if it already exists (has football data)
      });
    }

    // Convert to array and filter to only include markets that have both sports
    const combinedMarkets = Array.from(combinedMarketsMap.values())
      .filter(market => market.Football && market['ice-hockey']);

    if (!combinedMarkets.length) {
      return res.status(404).json({ error: 'No combined markets found with both football and ice hockey data' });
    }

    res.json(combinedMarkets);

  } catch (error) {
    console.error('Error in getCombinedSportsOdds:', error);
    res.status(500).json({
      error: 'Failed to fetch combined sports odds',
      details: error.message
    });
  }
};