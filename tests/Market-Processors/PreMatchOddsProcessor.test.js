// tests\Market-Processors\PreMatchOddsProcessor.test.js
// Import the processor to be tested
const PreMatchOddsProcessor = require('../../market-processors/Common/PreMatchOddsProcessor');

describe('PreMatchOddsProcessor', () => {
  // Mock data simulating one event with one market and two odds
  const mockEvent = {
    FI: '12345', // Event ID
    main: {
      sp: {
        market1: {
          id: '101', // Market ID
          name: 'Full Time Result', // Market name
          odds: [
            { id: '1', name: 'Home', odds: 1.5, header: '1', team: 'home', handicap: null },
            { id: '2', name: 'Draw', odds: 3.0, header: 'X', team: null, handicap: null },
          ]
        }
      }
    }
  };

  // Test case 1: Handle case when data has no events
  it('should return error if no events found', () => {
    const data = { results: [] }; // Empty event list
    const TARGET_FIS = ['12345']; // Event ID we want to process

    const result = PreMatchOddsProcessor.process(data, TARGET_FIS);

    // Expect an error message with the original request
    expect(result).toEqual({
      error: 'No events found',
      request: { FIs: ['12345'] },
    });
  });

  // Test case 2: Skip any FIs (event IDs) that are not found in the data
  it('should skip unmatched FIs', () => {
    const data = { results: [mockEvent] };
    const TARGET_FIS = ['00000']; // This FI does not exist in mockEvent

    const result = PreMatchOddsProcessor.process(data, TARGET_FIS);

    // Should return empty list since event was not matched
    expect(result.PRE_MATCH_MARKETS).toEqual([]);
    expect(result.total_markets).toBe(0);
  });

  // Test case 3: Successfully process pre-match odds from a valid event
  it('should process and return pre-match markets correctly', () => {
    const data = { results: [mockEvent] };
    const TARGET_FIS = ['12345']; // Valid FI

    const result = PreMatchOddsProcessor.process(data, TARGET_FIS);

    // One market should be returned with its odds
    expect(result.total_markets).toBe(1);
    expect(result.PRE_MATCH_MARKETS[0]).toEqual({
      id: '101',
      name: 'Full Time Result',
      odds: [
        {
          id: '1',
          odds: '1.5',
          header: '1',
          name: 'Home',
          handicap: null,
          team: 'home',
        },
        {
          id: '2',
          odds: '3',
          header: 'X',
          name: 'Draw',
          handicap: null,
          team: null,
        },
      ],
    });
  });

  // Test case 4: Ensure that odds with the same ID are not duplicated
  it('should not duplicate odds', () => {
    // Clone mockEvent and add a duplicate odd (same id)
    const duplicatedMockEvent = {
      ...mockEvent,
      FI: '12345',
      main: {
        sp: {
          market1: {
            id: '101',
            name: 'Full Time Result',
            odds: [
              { id: '1', name: 'Home', odds: 1.5, header: '1', team: 'home', handicap: null },
              { id: '1', name: 'Home Duplicate', odds: 1.5, header: '1', team: 'home', handicap: null },
            ]
          }
        }
      }
    };

    const data = { results: [duplicatedMockEvent] };
    const TARGET_FIS = ['12345'];

    const result = PreMatchOddsProcessor.process(data, TARGET_FIS);

    // Only one unique odd should be returned due to deduplication
    expect(result.total_markets).toBe(1);
    expect(result.PRE_MATCH_MARKETS[0].odds.length).toBe(1);
    expect(result.PRE_MATCH_MARKETS[0].odds[0].id).toBe('1');
  });
});
