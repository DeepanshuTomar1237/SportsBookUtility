// controllers/Tennis/PreMatchMarketController.js
const { fetchBet365Data } = require('../../utils/api');
const PreMatchMarket = require('../../models/Tennis/PreMatchmarket');
const { TENNIS_EVENTS, TARGET_FIS_TENNIS } = require('../../constants/bookmakers');

const TENNIS_CONFIG = {
  id: 13,
  name: 'Tennis'
};

class TennisPreMatchMarketProcessor {
  static process(events) {
    const consolidatedMarkets = {};
    const firstEvent = events.length > 0 ? events[0] : null;

    for (const event of events) {
      if (!event || !event.leagueId || !event.eventId) {
        console.log('Skipping event - missing required fields:', event);
        continue;
      }

      const sections = this.getEventSections(event);

      for (const section of sections) {
        if (section?.sp) {
          this.processSection(section, consolidatedMarkets, event, event === firstEvent);
        }
      }
    }

    return Object.values(consolidatedMarkets);
  }

  static getEventSections(event) {
    // Get all possible sections dynamically
    const allSections = Object.values(event).filter(
      val => typeof val === 'object' && val !== null && val.sp
    );
    
    // Also include explicitly known sections
    const explicitSections = [
      event.main,
      event.specials,
      event.games,
      event.sets,
      ...(Array.isArray(event.others) ? event.others : [])
    ].filter(Boolean);

    // Combine and deduplicate sections
    const combined = [...new Set([...allSections, ...explicitSections])];
    return combined;
  }

  static processSection(section, markets, event, includeOdds) {
    const processMarket = (market) => {
      if (!market?.id || !market?.name) return;
      
      const marketId = market.id.toString();
      let marketName = market.name;

      if (event.home) {
        marketName = marketName.replace(new RegExp(this.escapeRegExp(event.home), 'g'), 'Home');
      }
      if (event.away) {
        marketName = marketName.replace(new RegExp(this.escapeRegExp(event.away), 'g'), 'Away');
      }

      const marketKey = `${marketId}_${marketName}`;

      if (!markets[marketKey]) {
        markets[marketKey] = {
          id: marketId,
          name: marketName,
          leagues: [],
          odds: null
        };
      }

      const leagueInfo = {
        id: event.eventId,
        name: event.leagueId
      };

      if (!markets[marketKey].leagues.some(l => l.id === leagueInfo.id)) {
        markets[marketKey].leagues.push(leagueInfo);
      }

      if (includeOdds && !markets[marketKey].odds) {
        const extracted = this.extractOdds(market);
        if (Object.keys(extracted).length > 0) {
          markets[marketKey].odds = extracted;
        }
      }
    };

    // Process top-level markets
    for (const marketData of Object.values(section.sp)) {
      if (!marketData) continue;

      // Handle container markets (with sub-markets)
      if (marketData.sp && typeof marketData.sp === 'object') {
        for (const subMarket of Object.values(marketData.sp)) {
          processMarket(subMarket);
        }
      } 
      // Handle regular markets
      else {
        processMarket(marketData);
      }
    }
  }

  static extractOdds(marketData) {
    const odds = {};

    if (marketData.odds) {
      return marketData.odds;
    } else if (marketData.sp) {
      for (const [outcome, outcomeData] of Object.entries(marketData.sp)) {
        if (outcomeData.odds) {
          odds[outcome] = outcomeData.odds;
        }
      }
    }

    return odds;
  }

  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

exports.TennisPreMatchOdds = async (req, res) => {
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
        
        const eventInfo = TENNIS_EVENTS[fi] || {};
        return {
          ...event,
          home: eventInfo.home,
          away: eventInfo.away,
          leagueId: eventInfo.leagueId,
          eventId: eventInfo.id
        };
      })
      .filter(Boolean);

    // Step 4: Process markets with debug logging
    console.log('Processing', enrichedEvents.length, 'events');
    const processedMarkets = TennisPreMatchMarketProcessor.process(enrichedEvents);
    console.log('Found', processedMarkets.length, 'markets');
    
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