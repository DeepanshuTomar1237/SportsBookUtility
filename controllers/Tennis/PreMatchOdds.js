

// controllers\PreMatchFootball.js
const axios = require('axios');

exports.getOddsData5 = async (req, res) => {
  try {
    const targetFIs = ['174515827', '174515829','174520444','174465670', '174505725', '174508102', '174508104', '174512203', '174512207'];

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

    const consolidatedMarkets = {};
    const oddsSet = new Set();

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
        processSectionWithPriority(section, consolidatedMarkets, fi, oddsSet);
      }
    }

    // Deduplicate odds by ID
    for (const market of Object.values(consolidatedMarkets)) {
      const seen = new Set();
      market.odds = market.odds.filter(odd => {
        if (!odd.id || seen.has(odd.id)) return false;
        seen.add(odd.id);
        return true;
      });
    }

    const totalMarkets = Object.keys(consolidatedMarkets).length; // Count markets

    res.json([{ 
      PRE_MATCH_MARKETS: Object.values(consolidatedMarkets),
      total_markets: totalMarkets  // Include count in response
    }]);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch data from Bet365 API',
      details: error.message
    });
  }
};

function processSectionWithPriority(sectionData, consolidatedMarkets, fi, oddsSet) {
  if (!sectionData || !sectionData.sp) return;

  for (const [marketKey, marketData] of Object.entries(sectionData.sp)) {
    if (!marketData || typeof marketData !== 'object') continue;

    if (marketData.id && marketData.name) {
      mergeMarketWithOddsPriority(marketData, consolidatedMarkets, oddsSet);
    } else {
      for (const [_, subMarketData] of Object.entries(marketData)) {
        if (subMarketData?.id && subMarketData?.name) {
          mergeMarketWithOddsPriority(subMarketData, consolidatedMarkets, oddsSet);
        }
      }
    }
  }
}

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














