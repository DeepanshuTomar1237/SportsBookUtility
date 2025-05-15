const axios = require('axios');
const IceHockeyPreMatchMarket = require('../../models/ICE_HOCKEY/PreMatchMarket');

exports.IceHockeyPreMatchMarket = async (req, res) => {
  try {
    const targetFIs = ['173452579', '173452585', '173452576', '173452593', '174209613'];

    const response = await axios.get('https://api.b365api.com/v3/bet365/prematch', {
      params: {
        token: '72339-5QJh8lscw8VTIY',
        FI: targetFIs.join(',')
      },
      paramsSerializer: params =>
        Object.entries(params)
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
    });

    if (!response.data.results || response.data.results.length === 0) {
      return res.status(404).json({ error: 'No events found' });
    }

    const marketMap = new Map();

    for (const event of response.data.results) {
      if (!event.FI || !targetFIs.includes(event.FI.toString())) continue;

      for (const [sectionName, sectionData] of Object.entries(event)) {
        if (typeof sectionData !== 'object' || sectionName === 'FI') continue;

        const sections = Array.isArray(sectionData) ? sectionData : [sectionData];
        
        for (const section of sections) {
          if (!section?.sp) continue;
          
          for (const marketData of Object.values(section.sp)) {
            if (!marketData) continue;

            const marketsToProcess = marketData.id ? [marketData] : Object.values(marketData);
            
            for (const market of marketsToProcess) {
              if (market?.id && market?.name) {
                const marketId = market.id.toString();
                if (!marketMap.has(marketId)) {
                  marketMap.set(marketId, {
                    id: marketId,
                    name: market.name
                  });
                }
              }
            }
          }
        }
      }
    }

    const sportsData = {
      id: 17,
      name: "IceHockey",
      count: marketMap.size,
      markets: Array.from(marketMap.values())
    };

    try {
      const result = await IceHockeyPreMatchMarket.findOneAndUpdate(
        { sportId: 17 },
        sportsData,
        { upsert: true, new: true }
      );
      
      console.log('Ice Hockey prematch markets successfully stored in MongoDB');
      console.log(`Stored ${result.markets.length} markets`);
      res.json([sportsData]);
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({ 
        error: 'Database operation failed',
        details: dbError.message
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch data from Bet365 API',
      details: error.message
    });
  }
};
function mergeMarketWithOddsPriority(marketData, consolidatedMarkets, oddsSet) {
  const marketId = marketData.id.toString();
  const marketName = marketData.name;
  const marketKey = `${marketId}_${marketName}`;

  // Create market entry if it doesn't exist
  if (!consolidatedMarkets[marketKey]) {
    consolidatedMarkets[marketKey] = {
      id: marketId,
      name: marketName,
      odds: []
    };
  }

  // Add odds only if none added before and current has odds
  if (consolidatedMarkets[marketKey].odds.length === 0 && Array.isArray(marketData.odds) && marketData.odds.length > 0) {
    const odds = marketData.odds.map(odd => ({
      id: odd.id,
      odds: odd.odds,
      header: odd.header,
      name: odd.name,
      handicap: odd.handicap 
    }));
    consolidatedMarkets[marketKey].odds.push(...odds);
  }
}