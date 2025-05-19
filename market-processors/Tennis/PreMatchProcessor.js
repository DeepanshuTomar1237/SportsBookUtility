// market-processors/Tennis/PreMatchProcessor.js
class TennisPreMatchMarketProcessor {
    static process(events) {
      const consolidatedMarkets = {};

      for (const event of events) {
        if (!event || !event.leagueId || !event.eventId) {
          console.log('Skipping event - missing required fields:', event);
          continue;
        }

        const sections = this.getEventSections(event);

        for (const section of sections) {
          if (section?.sp) {
            this.processSection(section, consolidatedMarkets, event);
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
      for (const marketData of Object.values(section.sp)) {
        if (!marketData) continue;

        if (marketData.id && marketData.name) {
          this.addMarket(marketData, markets, event);
        } else {
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

      // Always add the league info if it's not already there
      if (!markets[marketKey].leagues.some(l => l.id === leagueInfo.id)) {
        markets[marketKey].leagues.push(leagueInfo);
      }

      // Only add odds if they haven't been added for this market yet
      if (markets[marketKey].odds.length === 0 && Array.isArray(marketData.odds) && marketData.odds.length > 0) {
        for (const odd of marketData.odds) {
          markets[marketKey].odds.push({
            id: odd.id,
            odds: parseFloat(odd.odds),
            name: odd.name,
            header: odd.header,
            handicap: odd.handicap,
          });
        }
      }
    }

    static escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

module.exports = {
  processMarkets: (events) => TennisPreMatchMarketProcessor.process(events)
};