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
    const response = await fetchBet365Data(TARGET_FIS_TENNIS);
    
    if (!response?.results?.length) {
      return res.status(404).json({ 
        error: 'No tennis events found',
        request: { FIs: TARGET_FIS_TENNIS }
      });
    }

    const eventsWithMetadata = TARGET_FIS_TENNIS
      .map(fi => {
        const event = response.results.find(ev => ev.FI?.toString() === fi);
        if (!event) return null;
        
        const eventInfo = TENNIS_EVENTS[fi] || {};
        return {
          ...event,
          home: eventInfo.home,
          away: eventInfo.away,
          league: eventInfo.leagueId
        };
      })
      .filter(Boolean);

    const processedMarkets = processMarkets(eventsWithMetadata);
    
    const responseData = {
      id: TENNIS_CONFIG.id,
      name: TENNIS_CONFIG.name,
      count: processedMarkets.length,
      markets: processedMarkets
    };

    await PreMatchMarket.findOneAndUpdate(
      { id: TENNIS_CONFIG.id },
      responseData,
      { upsert: true, new: true }
    );
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Tennis data processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process tennis prematch data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};