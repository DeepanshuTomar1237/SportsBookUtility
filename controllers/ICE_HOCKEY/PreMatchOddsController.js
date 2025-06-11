// controllers/ICE_HOCKEY/PreMatchOddsController.js
const IceHockeyPreMatchOdds = require('../../models/ICE_HOCKEY/PreMatchOdds');
const PreMatchOddsProcessor = require('../../market-processors/Common/PreMatchOddsProcessor');
const { fetchBet365Data } = require('../../utils/api');
const { TARGET_FIS_HOCKEY } = require('../../constants/bookmakers');

exports.IceHockeyPreMatchOdds = async (req, res) => {
    try {
        // Use the hockey FIs from constants
        const responseData = await fetchBet365Data(TARGET_FIS_HOCKEY);

        const processedData = PreMatchOddsProcessor.process(responseData, TARGET_FIS_HOCKEY);
        
        if (processedData.error) {
            return res.status(404).json({ error: processedData.error });
        }

        const sportsData = {
            id: 17,
            name: 'IceHockey',
            count: processedData.total_markets || 0,
            markets: processedData.PRE_MATCH_MARKETS 
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
        console.error('Controller error:', error.message);
        return res.status(500).json({
            error: error.message || 'Failed to process Ice Hockey odds',
            details: error.message
        });
    }
};