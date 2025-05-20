class TennisPreMatchMarketProcessor {
  static process(events) {
    const consolidatedMarkets = {};
    
    for (const event of events) {
      if (!event || !event.leagueId || !event.eventId) {
        console.log('Skipping event - missing required fields:', event);
        continue;
      }
      
      // Get all market sections from the event
      const sections = this.getEventSections(event);
      
      for (const section of sections) {
        if (section && section.sp) {
          this.processSection(section, consolidatedMarkets, event);
        }
      }
    }
    
    return Object.values(consolidatedMarkets);
  }

  static getEventSections(event) {
    return [
      event.main,
      event.specials,
      event.games,
      event.sets,
      ...(Array.isArray(event.others) ? event.others : [])
    ].filter(Boolean);
  }

  static processSection(section, markets, event) {
    for (const marketData of Object.values(section.sp)) {
      if (!marketData) continue;
      
      if (marketData.id && marketData.name) {
        this.addMarket(marketData, markets, event);
      } else {
        // Handle nested markets
        for (const subMarket of Object.values(marketData)) {
          if (subMarket?.id && subMarket?.name) {
            this.addMarket(subMarket, markets, event);
          }
        }
      }
    }
  }

  static addMarket(marketData, markets, event) {
    const marketId = marketData.id.toString();
    let marketName = marketData.name;
    
    // Replace player names with Home/Away
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
        leagues: []
      };
    }

    // Add league info if not already present
    const leagueInfo = {
      id: event.eventId,
      name: event.leagueId
    };
    
    if (!markets[marketKey].leagues.some(l => l.id === leagueInfo.id)) {
      markets[marketKey].leagues.push(leagueInfo);
    }
  }

  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = { 
  processOdds: (events) => TennisPreMatchMarketProcessor.process(events) 
};
