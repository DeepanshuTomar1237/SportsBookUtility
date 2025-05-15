const axios = require('axios');
const IceHockeyPreMatchOdds = require('../../models/ICE_HOCKEY/PreMatchOdds');

exports.IceHockeyPreMatchOdds = async (req, res) => {
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

        const results = response.data.results;
        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'No events found' });
        }

        const consolidatedMarkets = {};
        const oddsSet = new Set();

        // Process FIs in priority order
        for (const fi of targetFIs) {
            const event = results.find(ev => ev.FI?.toString() === fi);
            if (!event) continue;

            for (const [sectionName, sectionData] of Object.entries(event)) {
                if (typeof sectionData !== 'object' || sectionName === 'FI') continue;

                const sections = Array.isArray(sectionData) ? sectionData : [sectionData];
                for (const section of sections) {
                    processSectionWithPriority(section, consolidatedMarkets, oddsSet);
                }
            }
        }

        // Final market transformation
        const sportsData = {
            id: 17,
            name: 'IceHockey',
            count: Object.keys(consolidatedMarkets).length,
            markets: Object.values(consolidatedMarkets).map(market => ({
                id: market.id,
                name: market.name,
                odds: market.odds
            }))
        };

        // Upsert into MongoDB
        try {
            await IceHockeyPreMatchOdds.findOneAndUpdate(
                { id: 17 },
                sportsData,
                { upsert: true, new: true }
            );
            console.log(`Successfully stored ${sportsData.markets.length} Ice Hockey markets`);
        } catch (dbError) {
            console.error('MongoDB error:', dbError.message);
        }

        return res.json([sportsData]);
    } catch (error) {
        console.error('API fetch error:', error.message);
        return res.status(500).json({
            error: 'Failed to fetch data from Bet365 API',
            details: error.message
        });
    }
};

// Helper Functions
function processSectionWithPriority(sectionData, consolidatedMarkets, oddsSet) {
    if (!sectionData || !sectionData.sp) return;

    for (const market of Object.values(sectionData.sp)) {
        if (!market) continue;

        if (market.id && market.name) {
            mergeMarketWithOddsPriority(market, consolidatedMarkets, oddsSet);
        } else {
            for (const subMarket of Object.values(market)) {
                if (subMarket?.id && subMarket?.name) {
                    mergeMarketWithOddsPriority(subMarket, consolidatedMarkets, oddsSet);
                }
            }
        }
    }
}

function mergeMarketWithOddsPriority(marketData, consolidatedMarkets, oddsSet) {
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
        const odds = marketData.odds
            .filter(odd => odd?.id && !oddsSet.has(odd.id))
            .map(odd => {
                oddsSet.add(odd.id);
                return {
                    id: odd.id,
                    odds: odd.odds,
                    header: odd.header,
                    name: odd.name,
                    handicap: odd.handicap
                };
            });
        consolidatedMarkets[marketKey].odds.push(...odds);
    }
}
