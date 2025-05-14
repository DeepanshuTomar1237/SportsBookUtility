// utils/marketProcessor.js

// Helper function to process events and extract relevant markets
function processMarkets(events, TARGET_FIS) {
    const consolidatedMarkets = {};
    const targetFiSet = new Set(TARGET_FIS);
  
    for (const event of events) {
      if (!targetFiSet.has(event.FI?.toString())) continue;
  
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
        processSection(section, consolidatedMarkets);
      }
    }
  
    return consolidatedMarkets;
  }
  
  // Helper function to process a betting section
  function processSection(sectionData, consolidatedMarkets) {
    if (!sectionData?.sp) return;
  
    for (const marketData of Object.values(sectionData.sp)) {
      if (!marketData) continue;
  
      if (marketData.id && marketData.name) {
        addMarket(marketData, consolidatedMarkets);
      } else {
        for (const subMarketData of Object.values(marketData)) {
          if (subMarketData?.id && subMarketData?.name) {
            addMarket(subMarketData, consolidatedMarkets);
          }
        }
      }
    }
  }
  
  // Helper function to add a market to the consolidated markets
  function addMarket(marketData, consolidatedMarkets) {
    const marketId = marketData.id.toString();
    const marketName = marketData.name;
    const marketKey = `${marketId}_${marketName}`;
  
    if (!consolidatedMarkets[marketKey]) {
      consolidatedMarkets[marketKey] = {
        id: marketId,
        name: marketName,
      };
    }
  }
  
  module.exports = { processMarkets };
  