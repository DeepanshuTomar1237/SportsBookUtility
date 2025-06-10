const CricketPreMatchOdds = require('../../models/Cricket/PreMatchOdds');
const PreMatchOddsProcessor = require('../../market-processors/Common/PreMatchOddsProcessor');
const { fetchBet365Data } = require('../../utils/api');
const { TARGET_FIS_CRICKET } = require('../../constants/bookmakers');

exports.CricketPreMatchOdds = async (req, res) => {
    try {
        // Use the cricket FIs from constants
        const responseData = await fetchBet365Data(TARGET_FIS_CRICKET);

        const processedData = PreMatchOddsProcessor.process(responseData, TARGET_FIS_CRICKET);
        
        if (processedData.error) {
            return res.status(404).json({ error: processedData.error });
        }

        const sportsData = {
            id: 3, // Cricket ID
            name: 'Cricket',
            count: processedData.total_markets || 0,
            markets: processedData.PRE_MATCH_MARKETS || []
        };

        // Upsert into MongoDB
        try {
            await CricketPreMatchOdds.findOneAndUpdate(
                { id: 3 },
                sportsData,
                { upsert: true, new: true }
            );
            console.log(`Successfully stored ${sportsData.markets.length} Cricket markets`);
        } catch (dbError) {
            console.error('MongoDB error:', dbError.message);
        }

        return res.json([sportsData]);
    } catch (error) {
        console.error('Controller error:', error.message);
        return res.status(500).json({
            error: error.message || 'Failed to process Cricket odds',
            details: error.message
        });
    }
};