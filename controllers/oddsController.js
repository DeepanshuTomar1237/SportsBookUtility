const axios = require('axios');

// Utility to deduplicate odds by ID
const deduplicateOdds = (oddsArray) => {
  const seen = new Set();
  return oddsArray.filter(odd => {
    if (!odd?.id || seen.has(odd.id)) return false;
    seen.add(odd.id);
    return true;
  });
};

// Main processing function
exports.getOddsData = async (req, res) => {
  try {
    const response = await axios.get('https://api.b365api.com/v3/bet365/prematch', {
      params: {
        token: '72339-5QJh8lscw8VTIY',
        FI: ['174229112', '174187790', '174277015'].join(',')
      },
      paramsSerializer: params =>
        Object.entries(params)
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
    });

    // Object to hold consolidated markets across all events
    const consolidatedMarkets = {};

    for (const event of response.data.results) {
      const allSections = {
        asian_lines: event.asian_lines,
        goals: event.goals,
        main: event.main,
        half: event.half,
        others: event.others,
        minutes: event.minutes,
        specials: event.specials
      };

      // Process each section and market
      for (const section of Object.values(allSections)) {
        if (!section?.sp) continue;
        
        for (const marketData of Object.values(section.sp)) {
          if (!marketData?.id || !marketData?.name) continue;
          
          const marketId = marketData.id.toString();
          const marketName = marketData.name;
          const marketKey = `${marketId}_${marketName}`;
          
          // Initialize market if not exists
          if (!consolidatedMarkets[marketKey]) {
            consolidatedMarkets[marketKey] = {
              id: marketId,
              name: marketName,
              odds: []
            };
          }
          
          // Add new odds (deduplicated)
          if (marketData.odds && marketData.odds.length) {
            const newOdds = marketData.odds.map(odd => ({
              id: odd.id,
              odds: odd.odds,
              header: odd.header || '',
              name: odd.name || '',
              handicap: odd.handicap || ''
            }));
            
            consolidatedMarkets[marketKey].odds = deduplicateOdds([
              ...consolidatedMarkets[marketKey].odds,
              ...newOdds
            ]);
          }
        }
      }
    }

    // Group by market type (you may need to adjust this based on your categorization needs)
    const result = {
      PRE_MATCH_MARKETS: Object.values(consolidatedMarkets)
    };

    res.json([result]);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Bet365 API' });
  }
};