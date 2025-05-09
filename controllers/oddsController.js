const axios = require('axios');

exports.getOddsData = async (req, res) => {
  try {
    const targetFIs = ['174229112', '174187790', '174277015'];
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

    // Check if we got any results
    if (!response.data.results || response.data.results.length === 0) {
      return res.status(404).json({ error: 'No events found' });
    }

    // Verify we received all requested FIs
    const receivedFIs = new Set(response.data.results.map(event => event.FI?.toString()));
    const missingFIs = targetFIs.filter(fi => !receivedFIs.has(fi));
    
    if (missingFIs.length > 0) {
      return res.status(404).json({ 
        error: 'Incomplete data received',
        details: `Missing data for FIs: ${missingFIs.join(', ')}`
      });
    }

    const consolidatedMarkets = {};
    
    // Process all events
    response.data.results.forEach(event => {
      if (!event) return;

      // Process all sections that contain market data
      processSection(event.asian_lines, consolidatedMarkets);
      processSection(event.goals, consolidatedMarkets);
      processSection(event.main, consolidatedMarkets);
      processSection(event.half, consolidatedMarkets);
      processSection(event.minutes, consolidatedMarkets);
      processSection(event.specials, consolidatedMarkets);
      
      // Process others array separately
      if (Array.isArray(event.others)) {
        event.others.forEach(otherItem => {
          processSection(otherItem, consolidatedMarkets);
        });
      }
    });

    // Deduplicate odds within each market
    for (const market of Object.values(consolidatedMarkets)) {
      const seen = new Set();
      market.odds = market.odds.filter(odd => {
        if (!odd.id || seen.has(odd.id)) return false;
        seen.add(odd.id);
        return true;
      });
    }

    res.json([{
      PRE_MATCH_MARKETS: Object.values(consolidatedMarkets)
    }]);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch data from Bet365 API',
      details: error.message
    });
  }
};

// Helper functions remain the same as in the original code
function processSection(sectionData, consolidatedMarkets) {
  if (!sectionData || !sectionData.sp) return;

  for (const [marketKey, marketData] of Object.entries(sectionData.sp)) {
    if (!marketData || typeof marketData !== 'object' || Array.isArray(marketData)) continue;
    
    if (marketData.id && marketData.name) {
      addMarketToConsolidated(marketData, consolidatedMarkets);
    } else {
      for (const [subMarketKey, subMarketData] of Object.entries(marketData)) {
        if (subMarketData?.id && subMarketData?.name) {
          addMarketToConsolidated(subMarketData, consolidatedMarkets);
        }
      }
    }
  }
}

function addMarketToConsolidated(marketData, consolidatedMarkets) {
  const marketId = marketData.id.toString();
  const marketName = marketData.name;
  const marketKey = `${marketId}_${marketName}`;

  if (!consolidatedMarkets[marketKey]) {
    consolidatedMarkets[marketKey] = {
      id: marketId,
      name: marketName,
      odds: []
    };
  }

  if (marketData.odds && Array.isArray(marketData.odds)) {
    const newOdds = marketData.odds.map(odd => ({
      id: odd.id,
      odds: odd.odds,
      header: odd.header || '',
      name: odd.name || '',
      handicap: odd.handicap || ''
    }));

    consolidatedMarkets[marketKey].odds.push(...newOdds);
  }
}