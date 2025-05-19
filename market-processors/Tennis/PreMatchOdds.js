class TennisPreMatchMarketProcessor {
    static process(events) {
      const consolidatedMarkets = {};
      let hasCollectedOdds = false;
  
      for (const event of events) {
        if (hasCollectedOdds) break;
  
        if (!event || !event.leagueId || !event.eventId) {
          console.warn('Skipping event - missing required fields:', event?.FI);
          continue;
        }
  
        const sections = this.getEventSections(event);
  
        for (const section of sections) {
          if (section?.sp) {
            const oddsAdded = this.processSection(section, consolidatedMarkets, event);
            if (oddsAdded) {
              hasCollectedOdds = true;
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
      try {
        const marketId = marketData.id.toString();
        let marketName = marketData.name;
  
        // Standardize team names
        if (event.home) {
          marketName = marketName.replace(new RegExp(this.escapeRegExp(event.home), 'gi'), 'Home');
        }
        if (event.away) {
          marketName = marketName.replace(new RegExp(this.escapeRegExp(event.away), 'gi'), 'Away');
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
  
        // Add league info if not exists
        const leagueInfo = {
          id: event.eventId,
          name: event.leagueId
        };
  
        if (!markets[marketKey].leagues.some(l => l.id === leagueInfo.id)) {
          markets[marketKey].leagues.push(leagueInfo);
        }
  
        // Only add odds if none exist yet
        if (markets[marketKey].odds.length === 0 && Array.isArray(marketData.odds)) {
          markets[marketKey].odds = marketData.odds.map(odd => ({
            id: odd.id,
            odds: parseFloat(odd.odds) || 0,
            name: odd.name || '',
            header: odd.header || '',
            handicap: odd.handicap || ''
          }));
          return true;
        }
  
        return false;
      } catch (error) {
        console.error('Error processing market:', error);
        return false;
      }
    }
  
    static escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  
  module.exports = {
    processOdds: (events) => TennisPreMatchMarketProcessor.process(events)
  };