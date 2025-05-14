// market-processors\Football\PreMatchOddsProcessor.js
const _ = require('lodash');

class PreMatchOddsProcessor {
  static process(data, TARGET_FIS) {
    if (!data?.results?.length) {
      return {
        error: 'No events found',
        request: { FIs: TARGET_FIS },
      };
    }

    const consolidatedMarkets = {};
    const oddsSet = new Set();

    // Process the event data received from the API
    for (const fi of TARGET_FIS) {
      const event = data.results.find(ev => ev.FI?.toString() === fi);
      if (!event) continue;

      const sections = [
        event.asian_lines,
        event.goals,
        event.main,
        event.half,
        event.minutes,
        event.specials,
        event.corners,
        ...(Array.isArray(event.others) ? event.others : []),
      ];

      for (const section of sections) {
        if (section?.sp) {
          this.processSectionWithPriority(section.sp, consolidatedMarkets, oddsSet);
        }
      }
    }

    // Final deduplication of odds
    for (const market of Object.values(consolidatedMarkets)) {
      const seen = new Set();
      market.odds = market.odds.filter(odd => {
        if (!odd.id || seen.has(odd.id)) return false;
        seen.add(odd.id);
        return true;
      });
    }

    const finalMarkets = Object.values(consolidatedMarkets);
    const totalMarkets = finalMarkets.length;

    return {
      PRE_MATCH_MARKETS: finalMarkets,
      total_markets: totalMarkets,
    };
  }

  static processSectionWithPriority(sectionData, consolidatedMarkets, oddsSet) {
    if (!sectionData) return;

    for (const marketGroup of Object.values(sectionData)) {
      if (!marketGroup) continue;

      if (marketGroup.id && marketGroup.name) {
        this.mergeMarket(marketGroup, consolidatedMarkets, oddsSet);
      } else {
        for (const subMarket of Object.values(marketGroup)) {
          if (subMarket?.id && subMarket?.name) {
            this.mergeMarket(subMarket, consolidatedMarkets, oddsSet);
          }
        }
      }
    }
  }

  static mergeMarket(marketData, consolidatedMarkets, oddsSet) {
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

    if (
      consolidatedMarkets[marketKey].odds.length === 0 &&
      Array.isArray(marketData.odds) &&
      marketData.odds.length > 0
    ) {
      const odds = marketData.odds.map(odd => ({
        id: odd.id,
        odds: odd.odds.toString(), // Ensure odds are stored as strings
        header: odd.header || null,
        name: odd.name || null,
        handicap: odd.handicap || null,
      }));
      consolidatedMarkets[marketKey].odds.push(...odds);
    }
  }
}

module.exports = PreMatchOddsProcessor;