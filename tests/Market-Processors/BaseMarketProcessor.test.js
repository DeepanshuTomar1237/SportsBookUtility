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