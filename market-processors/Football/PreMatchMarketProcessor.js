// market-processors\Football\PreMatchMarketProcessor.js
const BaseMarketProcessor = require('../Tennis/BaseMarketProcessor');

class PreMatchMarketProcessor extends BaseMarketProcessor {
  static process(events) {
    const consolidatedMarkets = {};
    
    for (const event of events) {
      for (const section of this.getEventSections(event)) {
        this.processSection(section, consolidatedMarkets);
      }
    }
    
    return consolidatedMarkets;
  }
}

module.exports = { 
  processMarkets: (events, TARGET_FIS) => PreMatchMarketProcessor.process(events) 
};