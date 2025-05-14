const BaseMarketProcessor = require('./BaseMarketProcessor');

class PreMatchOddsProcessor extends BaseMarketProcessor {
  static process(data, TARGET_FIS) {
    if (!data?.results?.length) return { error: 'No events found', request: { FIs: TARGET_FIS } };

    const consolidatedMarkets = {};
    const oddsSet = new Set();

    TARGET_FIS.forEach(fi => {
      const event = data.results.find(ev => ev.FI?.toString() === fi);
      if (!event) return;

      this.getEventSections(event).forEach(section => {
        section?.sp && this.processSectionWithPriority(section.sp, consolidatedMarkets, oddsSet);
      });
    });

    // Deduplicate odds
    Object.values(consolidatedMarkets).forEach(market => {
      const seen = new Set();
      market.odds = market.odds.filter(odd => odd.id && !seen.has(odd.id) && seen.add(odd.id));
    });

    const finalMarkets = Object.values(consolidatedMarkets);
    return { PRE_MATCH_MARKETS: finalMarkets, total_markets: finalMarkets.length };
  }

  static processSectionWithPriority(sectionData, consolidatedMarkets) {
    if (!sectionData) return;

    Object.values(sectionData).forEach(marketGroup => {
      if (!marketGroup) return;
      
      if (marketGroup.id && marketGroup.name) {
        this.mergeMarket(marketGroup, consolidatedMarkets);
      } else {
        Object.values(marketGroup).forEach(subMarket => {
          subMarket?.id && subMarket?.name && this.mergeMarket(subMarket, consolidatedMarkets);
        });
      }
    });
  }

  static mergeMarket(marketData, consolidatedMarkets) {
    const marketKey = `${marketData.id}_${marketData.name}`;
    
    if (!consolidatedMarkets[marketKey]) {
      consolidatedMarkets[marketKey] = {
        id: marketData.id.toString(),
        name: marketData.name,
        odds: []
      };
    }

    if (!consolidatedMarkets[marketKey].odds.length && marketData.odds?.length) {
      consolidatedMarkets[marketKey].odds = marketData.odds.map(odd => ({
        id: odd.id,
        odds: odd.odds.toString(),
        header: odd.header || null,
        name: odd.name || null,
        handicap: odd.handicap || null
      }));
    }
  }
}

module.exports = PreMatchOddsProcessor;