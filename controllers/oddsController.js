const axios = require('axios');

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

    const firstEvent = response.data.results?.[0]; //  Only first FI data
    if (!firstEvent) return res.status(404).json({ error: 'No events found' });

    const consolidatedMarkets = {};
    const allSections = {
      asian_lines: firstEvent.asian_lines,
      goals: firstEvent.goals,
      main: firstEvent.main,
      half: firstEvent.half,
      others: firstEvent.others,
      minutes: firstEvent.minutes,
      specials: firstEvent.specials
    };

    for (const section of Object.values(allSections)) {
      if (!section?.sp) continue;

      for (const marketData of Object.values(section.sp)) {
        if (!marketData?.id || !marketData?.name) continue;

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

        if (marketData.odds && marketData.odds.length) {
          const newOdds = marketData.odds.map(odd => ({
            id: odd.id,
            odds: odd.odds,
            header: odd.header,
            name: odd.name ,
            handicap: odd.handicap 
          }));

          //  Keep all odds instead of only the first
          consolidatedMarkets[marketKey].odds.push(...newOdds);
        }
      }
    }

    // Optional: Deduplicate odds within each market if needed
    for (const market of Object.values(consolidatedMarkets)) {
      const seen = new Set();
      market.odds = market.odds.filter(odd => {
        if (!odd.id || seen.has(odd.id)) return false;
        seen.add(odd.id);
        return true;
      });
    }

    const result = {
      PRE_MATCH_MARKETS: Object.values(consolidatedMarkets)
    };

    res.json([result]);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Bet365 API' });
  }
};
