// controllers\Football\PreMatchodds.js
const axios = require('axios');
const PreMatchOdds = require('../../models/PreMatchOdds');
require('dotenv').config();

const TARGET_FIS = [
  '174229112', '174187790', '174277015',
  '173889141', '174217277', '173889464'
];

exports.PreMatchoods = async (req, res) => {
  try {
    const response = await axios.get(process.env.BET365_API_URL, {
      params: {
        token: process.env.BET365_API_TOKEN,
        FI: TARGET_FIS.join(',')
      },
      timeout: 10000,
      paramsSerializer: params =>
        Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&')
    });

    if (!response.data?.results?.length) {
      return res.status(404).json({
        error: 'No events found',
        request: { FIs: TARGET_FIS }
      });
    }

    const consolidatedMarkets = {};
    const oddsSet = new Set();

    // Process in priority order
    for (const fi of TARGET_FIS) {
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
        processSectionWithPriority(section, consolidatedMarkets, oddsSet);
      }
    }

    // Final deduplication of odds
    for (const market of Object.values(consolidatedMarkets)) {
      const seen = new Set();
      market.odds = market.odds.filter(odd => {
        if (!odd.id || seen.has(odd.id)) return false;
        seen.add(odd.id);
        return true;
      });
    }

    const finalMarkets = Object.values(consolidatedMarkets);
    const totalMarkets = finalMarkets.length;

    // Format data to match desired structure
    const dataToStore = {
      PRE_MATCH_MARKETS: finalMarkets,
      total_markets: totalMarkets
    };

    // Save to MongoDB
    const document = new PreMatchOdds(dataToStore);
    const saved = await document.save();
    
    console.log(` Data inserted with _id: ${saved._id}`);

    // Return response in array format as shown in example
    res.json([dataToStore]);

  } catch (error) {
    console.error('⚠️ API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status
    });

    res.status(500).json({
      error: 'Failed to fetch or store data',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
};

function processSectionWithPriority(sectionData, consolidatedMarkets, oddsSet) {
  if (!sectionData?.sp) return;

  for (const marketGroup of Object.values(sectionData.sp)) {
    if (!marketGroup) continue;

    if (marketGroup.id && marketGroup.name) {
      mergeMarket(marketGroup, consolidatedMarkets, oddsSet);
    } else {
      for (const subMarket of Object.values(marketGroup)) {
        if (subMarket?.id && subMarket?.name) {
          mergeMarket(subMarket, consolidatedMarkets, oddsSet);
        }
      }
    }
  }
}

function mergeMarket(marketData, consolidatedMarkets, oddsSet) {
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

  if (
    consolidatedMarkets[marketKey].odds.length === 0 &&
    Array.isArray(marketData.odds) &&
    marketData.odds.length > 0
  ) {
    const odds = marketData.odds.map(odd => ({
      id: odd.id,
      odds: odd.odds.toString(), // Ensure odds are stored as strings
      header: odd.header || null,
      name: odd.name || null,
      handicap: odd.handicap || null
    }));
    consolidatedMarkets[marketKey].odds.push(...odds);
  }
}