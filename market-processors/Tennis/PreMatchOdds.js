// market-processors\Tennis\PreMatchOdds.js
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

module.exports = TennisPreMatchMarketProcessor;