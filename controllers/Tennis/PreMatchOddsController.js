// const { fetchBet365Data } = require('../../utils/api');
// const PreMatchMarket = require('../../models/Tennis/PreMatchOdds');
// const { processOdds } = require('../../market-processors/Tennis/PreMatchOdds');
// const { TENNIS_EVENTS, TARGET_FIS_TENNIS } = require('../../constants/bookmakers');

// const TENNIS_CONFIG = {
//   id: 13,
//   name: 'Tennis'
// };

// /**
//  * Fetches and processes Tennis pre-match odds from Bet365 API
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  */
// const TennisPreMatchOdds = async (req, res) => {
//   try {
//     // Step 1: Fetch data from API
//     const response = await fetchBet365Data(TARGET_FIS_TENNIS);
    
//     // Step 2: Validate API response
//     if (!response?.results?.length) {
//       return res.status(404).json({ 
//         success: false,
//         error: 'No tennis events found',
//         request: { FIs: TARGET_FIS_TENNIS }
//       });
//     }

//     // Step 3: Enrich events with metadata
//     const enrichedEvents = TARGET_FIS_TENNIS
//       .map(fi => {
//         const event = response.results.find(ev => ev.FI?.toString() === fi);
//         if (!event) return null;
        
//         const eventInfo = TENNIS_EVENTS[fi] || {};
//         return {
//           ...event,
//           home: eventInfo.home,
//           away: eventInfo.away,
//           leagueId: eventInfo.leagueId,
//           eventId: eventInfo.id
//         };
//       })
//       .filter(Boolean);

//     // Step 4: Process markets if events exist
//     if (!enrichedEvents.length) {
//       return res.status(404).json({
//         success: false,
//         error: 'No valid tennis events after enrichment',
//         details: { receivedEvents: response.results.length }
//       });
//     }

//     const processedMarkets = processOdds(enrichedEvents);
    
//     // Step 5: Prepare response
//     const responseData = {
//       success: true,
//       data: {
//         id: TENNIS_CONFIG.id,
//         name: TENNIS_CONFIG.name,
//         count: processedMarkets.length,
//         markets: processedMarkets,
//         lastUpdated: new Date().toISOString()
//       }
//     };

//     // Step 6: Update database
//     try {
//       await PreMatchMarket.findOneAndUpdate(
//         { id: TENNIS_CONFIG.id },
//         responseData.data,
//         { upsert: true, new: true }
//       );
//     } catch (dbError) {
//       console.error('Database update error:', dbError);
//       // Continue even if DB update fails
//     }
    
//     // Step 7: Send response
//     res.json(responseData);
    
//   } catch (error) {
//     console.error('Tennis pre-match odds processing error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to process tennis pre-match data',
//       details: process.env.NODE_ENV === 'development' ? {
//         message: error.message,
//         stack: error.stack
//       } : undefined
//     });
//   }
// };

// module.exports = {
//   TennisPreMatchOdds
// };