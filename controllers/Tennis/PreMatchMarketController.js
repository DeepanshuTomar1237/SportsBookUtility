// controllers\Tennis\PreMatchMarketController.js
const { fetchBet365Data } = require('../../utils/api');
const PreMatchMarket = require('../../models/Tennis/PreMatchmarket');
const { processMarkets } = require('../../market-processors/Tennis/PreMatchProcessor');
const { TENNIS_EVENTS, TARGET_FIS_TENNIS } = require('../../constants/bookmakers');

const TENNIS_CONFIG = {
  id: 13,
  name: 'Tennis'
};

exports.TennisPreMatchMarket = async (req, res) => {
  try {
    // Step 1: Fetch data from API
    const response = await fetchBet365Data(TARGET_FIS_TENNIS);
    
    // Step 2: Check if data exists
    if (!response?.results?.length) {
      return res.status(404).json({ 
        error: 'No tennis events found',
        request: { FIs: TARGET_FIS_TENNIS }
      });
    }

    // Step 3: Enrich events with metadata
    const enrichedEvents = TARGET_FIS_TENNIS
      .map(fi => {
        const event = response.results.find(ev => ev.FI?.toString() === fi);
        if (!event) return null;
        
        const eventInfo = TENNIS_EVENTS[fi];
        return {
          ...event,
          home: eventInfo.home,
          away: eventInfo.away,
          leagueId: eventInfo.leagueId,
          eventId: eventInfo.id // Make sure this is included
        };
      })
      .filter(Boolean);

    // Step 4: Process markets
    const processedMarkets = processMarkets(enrichedEvents);
    
    // Step 5: Prepare response
    const responseData = {
      id: TENNIS_CONFIG.id,
      name: TENNIS_CONFIG.name,
      count: processedMarkets.length,
      markets: processedMarkets
    };

    // Step 6: Update database
    await PreMatchMarket.findOneAndUpdate(
      { id: TENNIS_CONFIG.id },
      responseData,
      { upsert: true, new: true }
    );
    
    // Step 7: Send response
    res.json(responseData);
    
  } catch (error) {
    console.error('Tennis data processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process tennis prematch data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};