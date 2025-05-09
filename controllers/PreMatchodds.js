
// controllers\PreMatchodds.js
const axios = require('axios');

exports.getOddsData1 = async (req, res) => {
  try {
    const targetFIs = ['174229112', '174187790', '174277015','173889141', '174217277', '173889464'];

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

    const marketsMap = {};
    const seenMarketIds = new Set();

    // Process FIs in priority order
    for (const fi of targetFIs) {
      const event = response.data.results.find(ev => ev.FI?.toString() === fi);
      if (!event) continue;

      const sections = [
        event.asian_lines,
        event.goals,
        event.main,
        event.half,
        event.minutes,
        event.specials,
        event.corners,
        ...(Array.isArray(event.others) ? event.others : [])
      ];

      for (const section of sections) {
        if (!section || !section.sp) continue;
        
        for (const [_, marketData] of Object.entries(section.sp)) {
          if (!marketData) continue;
          
          // Handle nested market structures
          if (marketData.id && marketData.name) {
            addMarketToMap(marketData, marketsMap, seenMarketIds);
          } else if (typeof marketData === 'object') {
            for (const [_, subMarketData] of Object.entries(marketData)) {
              if (subMarketData?.id && subMarketData?.name) {
                addMarketToMap(subMarketData, marketsMap, seenMarketIds);
              }
            }
          }
        }
      }
    }

    // Convert to the desired output format
    const formattedMarkets = {};
    for (const [marketKey, marketId] of Object.entries(marketsMap)) {
      formattedMarkets[marketKey] = marketId;
    }

    res.json({
      markets: formattedMarkets,
      total_markets: Object.keys(formattedMarkets).length
    });

  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch data from Bet365 API',
      details: error.message
    });
  }
};

function addMarketToMap(marketData, marketsMap, seenMarketIds) {
  const marketId = marketData.id.toString();
  const marketName = marketData.name;
  
  // Skip if we've already processed this market ID
  if (seenMarketIds.has(marketId)) return;
  
  // Add to map (using name as key and ID as value)
  if (marketName && marketId) {
    marketsMap[marketName] = marketId;
    seenMarketIds.add(marketId);
  }
}

