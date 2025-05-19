// market-processors/Tennis/PreMatchProcessor.js
class TennisPreMatchMarketProcessor {
    static process(events) {
      const consolidatedMarkets = {};
      let hasCollectedOdds = false; // ✅ Only collect odds from the first valid event
  
      for (const event of events) {
        if (hasCollectedOdds) break; // ✅ Stop if odds already collected
  
        if (!event || !event.leagueId || !event.eventId) {
          console.log('Skipping event - missing required fields:', event);
          continue;
        }
  
        const sections = this.getEventSections(event);
  
        for (const section of sections) {
          if (section?.sp) {
            const oddsAdded = this.processSection(section, consolidatedMarkets, event);
            if (oddsAdded) {
              hasCollectedOdds = true; // ✅ Flag set if odds added
              break;
            }
          }
        }
      }
  
      return Object.values(consolidatedMarkets);
    }
  
    static getEventSections(event) {
      return Object.values(event).filter(
        val => typeof val === 'object' && val !== null && val.sp
      );
    }
  
    static processSection(section, markets, event) {
      let oddsAdded = false;
  
      for (const marketData of Object.values(section.sp)) {
        if (!marketData) continue;
  
        if (marketData.id && marketData.name) {
          const added = this.addMarket(marketData, markets, event);
          if (added) oddsAdded = true;
        } else {
          for (const subMarket of Object.values(marketData)) {
            if (subMarket?.id && subMarket?.name) {
              const added = this.addMarket(subMarket, markets, event);
              if (added) oddsAdded = true;
            }
          }
        }
      }
  
      return oddsAdded;
    }
  
    static addMarket(marketData, markets, event) {
      const marketId = marketData.id.toString();
      let marketName = marketData.name;
  
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
          odds: []
        };
      }
  
      const leagueInfo = {
        id: event.eventId,
        name: event.leagueId
      };
  
      if (!markets[marketKey].leagues.some(l => l.id === leagueInfo.id)) {
        markets[marketKey].leagues.push(leagueInfo);
      }
  
      if (markets[marketKey].odds.length > 0) {
        return false; // ✅ Odds already added from earlier event
      }
  
      if (Array.isArray(marketData.odds) && marketData.odds.length > 0) {
        for (const odd of marketData.odds) {
          markets[marketKey].odds.push({
            id: odd.id,
            odds: parseFloat(odd.odds),
            name: odd.name,
            header: odd.header,
            handicap: odd.handicap,
          });
        }
        return true; // ✅ Odds successfully added
      }
  
      return false; // ❌ No odds to add
    }
  
    static escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  
  module.exports = {
    processMarkets: (events) => TennisPreMatchMarketProcessor.process(events)
  };
  
  
