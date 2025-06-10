// market-processors\Football\BaseMarketProcessor.js
const _ = require('lodash');

class BaseMarketProcessor {
  static processSection(sectionData, consolidatedMarkets) {
    if (!sectionData?.sp) return;

    for (const marketData of Object.values(sectionData.sp)) {
      if (!marketData) continue;
      
      if (marketData.id && marketData.name) {
        this.addMarket(marketData, consolidatedMarkets);
      } else {
        for (const subMarketData of Object.values(marketData)) {
          if (subMarketData?.id && subMarketData?.name) {
            this.addMarket(subMarketData, consolidatedMarkets);
          }
        }
      }
    }
  }

  static addMarket(marketData, consolidatedMarkets) {
    const marketId = marketData.id.toString();
    const marketName = marketData.name;
    const marketKey = `${marketId}_${marketName}`;

    if (!consolidatedMarkets[marketKey]) {
      consolidatedMarkets[marketKey] = {
        id: marketId,
        name: marketName,
        odds: [],
      };
    }
  }

  static getEventSections(event) {
    return [
      event.asian_lines,
      event.goals,
      event.main,
      event.half,
      event.minutes,
      event.specials,
      event.corners,
      ...(Array.isArray(event.others) ? event.others : []),
    ];
  }
}

module.exports = BaseMarketProcessor;