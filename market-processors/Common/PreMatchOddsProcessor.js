// market-processors\Common\PreMatchOddsProcessor.js
// Import the base processor class which contains common market processing logic
const BaseMarketProcessor = require('./BaseMarketProcessor');

// Create a new class that extends common behavior from BaseMarketProcessor
class PreMatchOddsProcessor extends BaseMarketProcessor {
  /**
   * Main function to process pre-match odds data.
   * @param {Object} data - The raw data containing multiple events and markets.
   * @param {Array} TARGET_FIS - List of event IDs (called FIs) to process.
   * @returns {Object} - Processed market data with odds and total count.
   */
  static process(data, TARGET_FIS) {
    // If there are no results/events in the data, return an error
    if (!data?.results?.length) {
      return { error: 'No events found', request: { FIs: TARGET_FIS } };
    }

    // Object to store combined market data
    const consolidatedMarkets = {};

    // Set to track unique odds (used later to remove duplicates)
    const oddsSet = new Set();

    // Loop through each target event ID (FI)
    TARGET_FIS.forEach(fi => {
      // Find the event in the data that matches the current FI
      const event = data.results.find(ev => ev.FI?.toString() === fi);
      if (!event) return;

      // Get all the sections from the event and process their "sp" (starting price) data
      // Loop through all sections (like betting categories) of the current event
      this.getEventSections(event).forEach(section => {

  // If the section has an "sp" property (which stands for "starting price" or pre-match odds),
  // then process it using our custom logic to extract and merge markets.
      section?.sp && this.processSectionWithPriority(section.sp, consolidatedMarkets, oddsSet);
  });
    });

    // Remove duplicate odds based on their ID
    Object.values(consolidatedMarkets).forEach(market => {
      const seen = new Set();
      market.odds = market.odds.filter(odd => odd.id && !seen.has(odd.id) && seen.add(odd.id));
    });

    // Convert the final result into an array and return it
    const finalMarkets = Object.values(consolidatedMarkets);
    return { PRE_MATCH_MARKETS: finalMarkets, total_markets: finalMarkets.length };
  }

  /**
   * Handles the merging of section data into the final result.
   * @param {Object} sectionData - Contains market groups or individual markets.
   * @param {Object} consolidatedMarkets - Object to store processed market data.
   */
  static processSectionWithPriority(sectionData, consolidatedMarkets) {
    if (!sectionData) return;

    // Loop through all market groups inside the section
    Object.values(sectionData).forEach(marketGroup => {
      if (!marketGroup) return;

      // If it's a single market (has id and name)
      if (marketGroup.id && marketGroup.name) {
        this.mergeMarket(marketGroup, consolidatedMarkets);
      } else {
        // Otherwise, it's a group of sub-markets
        Object.values(marketGroup).forEach(subMarket => {
          subMarket?.id && subMarket?.name && this.mergeMarket(subMarket, consolidatedMarkets);
        });
      }
    });
  }

  /**
   * Adds or merges a single market into the consolidated result.
   * @param {Object} marketData - Market info like id, name, and odds.
   * @param {Object} consolidatedMarkets - Object that holds all processed markets.
   */
  static mergeMarket(marketData, consolidatedMarkets) {
    // Create a unique key using id and name (e.g., "101_Asian Handicap")
    const marketKey = `${marketData.id}_${marketData.name}`;
    
    // If this market doesn't exist yet, initialize it
    if (!consolidatedMarkets[marketKey]) {
      consolidatedMarkets[marketKey] = {
        id: marketData.id.toString(),
        name: marketData.name,
        odds: []
      };
    }

    // Only assign odds if they haven’t already been set for this market
    if (!consolidatedMarkets[marketKey].odds.length && marketData.odds?.length) {
      consolidatedMarkets[marketKey].odds = marketData.odds.map(odd => ({
        id: odd.id,
        odds: odd.odds.toString(),
        header: odd.header,
        name: odd.name,
        handicap: odd.handicap,
        team: odd.team,
      }));
    }
  }
}

// Export the processor class so it can be used in other parts of the app
module.exports = PreMatchOddsProcessor;
