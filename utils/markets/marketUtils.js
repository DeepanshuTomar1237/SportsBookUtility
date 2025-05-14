// common/marketUtils.js

/**
 * Extract and normalize market data from a section (e.g. goals, corners)
 * @param {Object} sectionData - The betting section with potential market data
 * @param {Function} callback - Function to call for each market found
 */
function extractMarketsFromSection(sectionData, callback) {
    if (!sectionData?.sp) return;
  
    for (const marketGroup of Object.values(sectionData.sp)) {
      if (!marketGroup) continue;
  
      if (marketGroup.id && marketGroup.name) {
        callback(marketGroup);
      } else {
        for (const subMarket of Object.values(marketGroup)) {
          if (subMarket?.id && subMarket?.name) {
            callback(subMarket);
          }
        }
      }
    }
  }
  
  /**
   * Generate a unique key for a market using its ID and name
   * @param {Object} market
   * @returns {string}
   */
  function getMarketKey(market) {
    return `${market.id}_${market.name}`;
  }
  
  module.exports = {
    extractMarketsFromSection,
    getMarketKey,
  };
  