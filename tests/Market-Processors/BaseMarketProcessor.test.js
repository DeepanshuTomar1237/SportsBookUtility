// tests\Market-Processors\BaseMarketProcessor.test.js
// Import the BaseMarketProcessor module that we're testing
const BaseMarketProcessor = require('../../market-processors/Common/BaseMarketProcessor');

// Describe block for testing the BaseMarketProcessor class
describe('BaseMarketProcessor', () => {
  
  // Test suite for the processSection method
  describe('processSection', () => {
    
    // Test case: should properly add markets with their id and name
    it('should add markets with id and name', () => {
      // Mock section data with sportsbook (sp) markets
      const section = {
        sp: {
          marketA: { id: 1, name: 'Match Winner' },
          marketB: { id: 2, name: 'Correct Score' }
        }
      };
      const result = {}; // Initialize empty result object
      
      // Call the method we're testing
      BaseMarketProcessor.processSection(section, result);

      // Assert that the markets were added with the expected keys
      // Verify that the processed result contains a property with the combined key:
      // The key is formed by concatenating the market ID and market name with an underscore
      // This format ('id_name') is likely the standard key format used throughout the application
      expect(result).toHaveProperty('1_Match Winner');

      // Similarly, verify that another market was properly processed and added to the result
      // This checks for a market with ID 2 and name 'Correct Score' combined with an underscore
        expect(result).toHaveProperty('2_Correct Score');
    });

    // Test case: should handle missing sp section gracefully
    it('should skip if sectionData.sp is missing', () => {
      const section = {}; // Empty section data
      const result = {};
      BaseMarketProcessor.processSection(section, result);

      // Expect the result to remain unchanged
      expect(result).toEqual({});
    });

    // Add to the processSection describe block
it('should skip submarkets without both id and name', () => {
  const section = {
    sp: {
      marketWithoutId: {
        sub1: { id: 10 }, // missing name
        sub2: { name: 'No ID' }, // missing id
        sub3: null, // null value
        sub4: { id: 11, name: 'Valid Market' }
      }
    }
  };
  const result = {};
  BaseMarketProcessor.processSection(section, result);
  
  expect(result).toEqual({
    '11_Valid Market': {
      id: '11',
      name: 'Valid Market',
      odds: []
    }
  });
});

// Add to a new describe block for addMarket method
describe('addMarket', () => {
  it('should not overwrite existing market', () => {
    const marketData = { id: 1, name: 'Existing Market' };
    const consolidatedMarkets = {
      '1_Existing Market': {
        id: '1',
        name: 'Existing Market',
        odds: ['existing odds']
      }
    };
    
    BaseMarketProcessor.addMarket(marketData, consolidatedMarkets);
    
    expect(consolidatedMarkets['1_Existing Market'].odds).toEqual(['existing odds']);
  });
});

    it('should add submarkets when marketData does not have id and name', () => {
      const section = {
        sp: {
          marketWithoutId: {
            sub1: { id: 10, name: 'Both Teams To Score' },
            sub2: { id: 11, name: 'Clean Sheet' }
          }
        }
      };
      const result = {};
      BaseMarketProcessor.processSection(section, result);
      
      expect(result).toHaveProperty('10_Both Teams To Score');
      expect(result).toHaveProperty('11_Clean Sheet');
    });
    

    // Test case: should handle nested submarkets within the sp section
    it('should handle nested submarkets inside sp', () => {
      const section = {
        sp: {
          groupedMarkets: { // Nested submarkets
            sub1: { id: 3, name: '1st Half Winner' },
            sub2: { id: 4, name: '2nd Half Winner' }
          }
        }
      };
      const result = {};
      BaseMarketProcessor.processSection(section, result);

      // Assert that nested markets were processed correctly
      expect(result).toHaveProperty('3_1st Half Winner');
      expect(result).toHaveProperty('4_2nd Half Winner');
    });
  });

  // Test suite for the getEventSections method
  describe('getEventSections', () => {
    
    // Test case: should return all defined event sections including those in others array
    it('should return an array of all defined event sections', () => {
      // Mock event data with various sections
      const mockEvent = {
        asian_lines: {},
        goals: {},
        main: {},
        half: {},
        minutes: {},
        specials: {},
        corners: {},
        others: [{}, {}] // Others array with 2 elements
      };

      // Call the method we're testing
      const sections = BaseMarketProcessor.getEventSections(mockEvent);
      
      // Assertions
      expect(Array.isArray(sections)).toBe(true); // Should return an array
      expect(sections.length).toBe(9); // 7 direct sections + 2 from others array
    });

    it('should skip null marketData in sp', () => {
      const section = {
        sp: {
          marketA: null,
          marketB: { id: 1, name: 'Moneyline' }
        }
      };
      const result = {};
      BaseMarketProcessor.processSection(section, result);
      expect(result).toHaveProperty('1_Moneyline');
    });
    
    it('should process submarkets when parent market lacks id and name', () => {
      const section = {
        sp: {
          groupedMarkets: {
            sub1: { id: 5, name: 'Double Chance' },
            sub2: { id: 6, name: 'Draw No Bet' }
          }
        }
      };
      const result = {};
      BaseMarketProcessor.processSection(section, result);
      expect(result).toHaveProperty('5_Double Chance');
      expect(result).toHaveProperty('6_Draw No Bet');
    });
    

    // Test case: should handle cases where others is not an array
    it('should return only valid sections if others is not an array', () => {
      const mockEvent = {
        asian_lines: {},
        goals: {},
        main: {},
        half: {},
        minutes: {},
        specials: {},
        corners: {},
        others: null // others is null instead of array
      };

      const sections = BaseMarketProcessor.getEventSections(mockEvent);
      expect(sections.length).toBe(7); // Should only count the direct sections
    });
  });
});