const BaseMarketProcessor = require('./BaseMarketProcessor');

class TennisPreMatchMarketProcessor extends BaseMarketProcessor {
  static process(events) {
    const consolidatedMarkets = {};
    
    for (const event of events) {
      if (!event || !event.league) continue;
      
      const sections = this.getTennisEventSections(event);
      
      for (const section of sections) {
        if (section) {
          this.processSection(section, consolidatedMarkets, event);
        }
      }
    }
    
    return Object.values(consolidatedMarkets);
  }

  static getTennisEventSections(event) {
    return [
      event.main,
      event.specials,
      event.games,
      event.sets,
      ...(event.others || [])
    ].filter(Boolean);
  }

  static processSection(sectionData, consolidatedMarkets, event) {
    if (!sectionData?.sp) return;

    for (const marketData of Object.values(sectionData.sp)) {
      if (!marketData) continue;
      
      if (marketData.id && marketData.name) {
        this.addMarket(marketData, consolidatedMarkets, event);
      } else {
        for (const subMarketData of Object.values(marketData)) {
          if (subMarketData?.id && subMarketData?.name) {
            this.addMarket(subMarketData, consolidatedMarkets, event);
          }
        }
      }
    }
  }

  static addMarket(marketData, consolidatedMarkets, event) {
    const marketId = marketData.id.toString();
    let marketName = marketData.name;
    
    // Safely replace player names with Home/Away
    if (event.home && typeof event.home === 'string') {
      const escapedHome = this.escapeRegExp(event.home);
      marketName = marketName.replace(new RegExp(escapedHome, 'g'), 'Home');
    }
    
    if (event.away && typeof event.away === 'string') {
      const escapedAway = this.escapeRegExp(event.away);
      marketName = marketName.replace(new RegExp(escapedAway, 'g'), 'Away');
    }
    
    const marketKey = `${marketId}_${marketName}`;

    if (!consolidatedMarkets[marketKey]) {
      consolidatedMarkets[marketKey] = {
        id: marketId,
        name: marketName,
        league: event.league || 'Unknown League'
      };
    }
  }

  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = { 
  processMarkets: (events) => TennisPreMatchMarketProcessor.process(events) 
};