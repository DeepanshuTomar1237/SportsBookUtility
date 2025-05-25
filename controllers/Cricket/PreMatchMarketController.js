// controllers\Cricket\PreMatchMarketController.js
const CricketPreMatchMarket = require('../../models/CRICKET/PreMatchMarket');
const { processMarkets } = require('../../market-processors/Football/PreMatchMarketProcessor');
const { TARGET_FIS_CRICKET } = require('../../constants/bookmakers');
const { fetchBet365Data } = require('../../utils/api');

exports.CricketPreMatchMarket = async (req, res) => {
  try {
    // Fetch data using centralized API utility
    const responseData = await fetchBet365Data(TARGET_FIS_CRICKET);

    if (!responseData.results || responseData.results.length === 0) {
      return res.status(404).json({ error: 'No events found' });
    }

    // Filter events by target FIs and process markets
    const filteredEvents = responseData.results.filter(event => 
      event.FI && TARGET_FIS_CRICKET.includes(event.FI.toString())
    );

    // Process markets using the football processor
    const processedMarkets = processMarkets(filteredEvents, TARGET_FIS_CRICKET);
    const marketsArray = Object.values(processedMarkets).map(market => ({
      id: market.id,
      name: market.name
    }));

    const sportsData = {
      id: 3, // Cricket typically has sportId 3 in many systems
      name: "Cricket",
      count: marketsArray.length,
      markets: marketsArray
    };

    try {
      const result = await CricketPreMatchMarket.findOneAndUpdate(
        { sportId: 3 },
        sportsData,
        { upsert: true, new: true }
      );
      
      console.log('Cricket prematch markets successfully stored in MongoDB');
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
      error: 'Failed to process Cricket markets',
      details: error.message
    });
  }
};