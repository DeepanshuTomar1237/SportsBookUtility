require('dotenv').config();
const IceHockeyMarket = require('../../models/ICE_HOCKEY/LiveMatchMarket');
const { processLiveMatchMarket } = require('../../market-processors/Football/LiveMatchMarketProcessor');
const { ICE_HOCKEY_DEFAULT_EVENT_IDS } = require('../../constants/bookmakers');

exports.LiveICEMatchMarket = async (req, res) => {
    try {
        const eventIds = req.query.evIds?.split(',') || ICE_HOCKEY_DEFAULT_EVENT_IDS;

        const processedData = await processLiveMatchMarket(eventIds);

        const iceHockeyData = {
            ...processedData,
            sportId: 4,
            sportName: "Ice Hockey",
            name: "Ice Hockey Markets",
            marketKey: `ice_hockey_${eventIds.join('_')}_${Date.now()}`
        };

        const savedMarket = await IceHockeyMarket.findOneAndUpdate(
            { marketKey: iceHockeyData.marketKey },
            iceHockeyData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        res.json([
            {
                count: savedMarket.count || 0,
                markets: savedMarket.markets || []
            }
        ]);

    } catch (error) {
        console.error('[IceHockeyController] Error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date()
        });

        res.status(500).json([
            {
                count: 0,
                markets: []
            }
        ]);
    }
};
