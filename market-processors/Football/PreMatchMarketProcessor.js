// utils/marketProcessor.js

// This file contains functions to process sports betting events and extract market information

/**
 * Main function that processes all events and extracts betting markets for specific bookmakers (FIs)
 * @param {Array} events - List of all betting events from different sports
 * @param {Array} TARGET_FIS - List of bookmaker IDs we're interested in (like 'Bet365', 'William Hill', etc.)
 * @returns {Object} - Consolidated list of all unique betting markets found
 */
function processMarkets(events, TARGET_FIS) {
    // This object will store all the unique markets we find
    const consolidatedMarkets = {};
    // Convert our target bookmaker IDs into a Set for faster lookup
    const targetFiSet = new Set(TARGET_FIS);
  
    // Go through each event one by one
    for (const event of events) {
    //   // Skip events that aren't from our target bookmakers
    //   if (!targetFiSet.has(event.FI?.toString())) continue;
  
      // Gather all possible betting sections where markets might be found
      const sections = [
        event.asian_lines,  // Asian handicap markets
        event.goals,        // Over/Under goals markets
        event.main,         // Main markets (like Match Winner)
        event.half,         // Markets specific to halves (1st half, 2nd half)
        event.minutes,      // Minute-specific markets (like "Next 10 minutes")
        event.specials,     // Special bets
        event.corners,      // Corner-related markets
        ...(Array.isArray(event.others) ? event.others : []), // Any other miscellaneous markets
      ];
  
      // Process each section to find betting markets
      for (const section of sections) {
        processSection(section, consolidatedMarkets);
      }
    }
  
    // Return the complete list of unique markets we found
    return consolidatedMarkets;
  }
  
  /**
   * Processes a single section of betting markets (like "goals" or "main")
   * @param {Object} sectionData - The betting section to process
   * @param {Object} consolidatedMarkets - The object where we store found markets
   */
  function processSection(sectionData, consolidatedMarkets) {
    // Skip if this section doesn't contain any betting markets
    if (!sectionData?.sp) return;
  
    // Look through all markets in this section
    for (const marketData of Object.values(sectionData.sp)) {
      if (!marketData) continue; // Skip if empty
      
      // If this is a simple market with ID and name, add it directly
      if (marketData.id && marketData.name) {
        addMarket(marketData, consolidatedMarkets);
      } else {
        // Otherwise, it might contain sub-markets - look through those
        for (const subMarketData of Object.values(marketData)) {
          if (subMarketData?.id && subMarketData?.name) {
            addMarket(subMarketData, consolidatedMarkets);
          }
        }
      }
    }
  }
  
  /**
   * Adds a betting market to our consolidated list if it's not already there
   * @param {Object} marketData - The market to add (contains id and name)
   * @param {Object} consolidatedMarkets - The object storing all unique markets
   */
  function addMarket(marketData, consolidatedMarkets) {
    // Create a unique key combining market ID and name
    const marketId = marketData.id.toString();
    const marketName = marketData.name;
    const marketKey = `${marketId}_${marketName}`;
  
    // Only add if we haven't seen this market before
    if (!consolidatedMarkets[marketKey]) {
      consolidatedMarkets[marketKey] = {
        id: marketId,     // The unique identifier for this market
        name: marketName, // The display name (like "Over/Under 2.5 Goals")
      };
    }
  }
  
  // Make the main function available for other files to use
  module.exports = { processMarkets };