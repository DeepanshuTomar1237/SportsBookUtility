// Import the processMarkets function from the PreMatchMarketProcessor module
const { processMarkets } = require('../../market-processors/Common/PreMatchMarketProcessor');

// Group related test cases using describe block
describe('PreMatchMarketProcessor', () => {
  
  // Test case 1: It should process valid event data and return expected market structure
  it('should process events and return consolidated markets', () => {
    // Sample mock event data containing valid markets under asian_lines
    const mockEvents = [
      {
        asian_lines: {
          sp: {
            market1: { id: '101', name: 'Asian Handicap' },
            market2: { id: '102', name: 'Total Goals' }
          }
        },
        // Other sections are null in this example
        goals: null,
        main: null,
        half: null,
        minutes: null,
        specials: null,
        corners: null,
        others: [] // No other custom sections
      }
    ];

    // Call the processor function with mock data
    const result = processMarkets(mockEvents);

    // We expect the processor to return a consolidated object with two markets
    expect(result).toEqual({
      '101_Asian Handicap': {
        id: '101',
        name: 'Asian Handicap',
        odds: []
      },
      '102_Total Goals': {
        id: '102',
        name: 'Total Goals',
        odds: []
      }
    });
  });

  // Test case 2: Should handle events with no valid sections and return empty object
  it('should return empty object for events with no valid market sections', () => {
    // All sections are null or empty, meaning no market data is available
    const mockEvents = [
      {
        asian_lines: null,
        goals: null,
        main: null,
        half: null,
        minutes: null,
        specials: null,
        corners: null,
        others: []
      }
    ];

    // Should return an empty object since there's no valid market
    const result = processMarkets(mockEvents);
    expect(result).toEqual({});
  });
});
