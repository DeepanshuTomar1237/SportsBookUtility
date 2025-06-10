// tests/Market-Processors/LiveMatchMarketProcessor.test.js

// Import the function we want to test
const { processLiveMatchMarket } = require('../../market-processors/Common/LiveMatchMarketProcessor');

// Import 'nock' to fake/mock API requests — useful to test without calling the real server
const nock = require('nock');

// Load environment settings from .env file (like API base URL)
require('dotenv').config();

// Get the base API URL from environment variables
const API_BASE_URL = process.env.API_BASE_URL;

// Describe the group of tests for the function `processLiveMatchMarket`
describe('processLiveMatchMarket', () => {
  // This function runs after each test to reset all the mocks
  afterEach(() => {
    nock.cleanAll(); // Clears all mocked API calls to prevent test interference
  });

  // Test case 1: Check if it correctly counts and collects markets for multiple events
  it('should return correct market count and market list for multiple events', async () => {
    const eventIds = ['event1', 'event2']; // We want to test two event IDs

    // For each event, mock the API response as if the server returned two market items
    eventIds.forEach((eventId) => {
      nock(API_BASE_URL)
        .get('/event') // Fake a GET request to /event
        .query({ evId: eventId }) // With query param evId = eventId
        .reply(200, { // Respond with success and some mock market data
          success: true,
          eventData: {
            markets: [
              { name: 'Match Winner', market: `mkt-${eventId}-1` },
              { name: 'Total Goals', id: `mkt-${eventId}-2` },
            ],
          },
        });
    });

    // Call the actual function we are testing
    const result = await processLiveMatchMarket(eventIds);

    // We expect the result to have 2 unique markets
    expect(result.count).toBe(2);

    // And the list should include specific market items (no duplicates)
    expect(result.markets).toEqual(
      expect.arrayContaining([
        { name: 'Match Winner', id: 'mkt-event1-1' },
        { name: 'Total Goals', id: 'mkt-event1-2' },
      ])
    );
  });

  // Test case 2: It should ignore markets that have no name or are duplicates
  it('should skip markets without name and avoid duplicates', async () => {
    const eventIds = ['event3'];

    // Mock API response for event3
    nock(API_BASE_URL)
      .get('/event')
      .query({ evId: 'event3' })
      .reply(200, {
        success: true,
        eventData: {
          markets: [
            { name: 'Match Winner', id: 'mkt-1' }, // Valid market
            { id: 'mkt-2' }, // Invalid: missing name
            { name: 'Match Winner', id: 'mkt-duplicate' }, // Duplicate: same name
          ],
        },
      });

    const result = await processLiveMatchMarket(eventIds);

    // Only the first valid and unique market should be counted
    expect(result.count).toBe(1);
    expect(result.markets).toEqual([
      { name: 'Match Winner', id: 'mkt-1' },
    ]);
  });

  // Test case 3: When the API fails (responds with success: false), function should return empty results
  it('should handle API failure gracefully and return empty result', async () => {
    const eventIds = ['event4'];

    // Simulate API saying "not successful"
    nock(API_BASE_URL)
      .get('/event')
      .query({ evId: 'event4' })
      .reply(200, {
        success: false,
      });

    const result = await processLiveMatchMarket(eventIds);

    // Expect no markets and zero count
    expect(result.count).toBe(0);
    expect(result.markets).toEqual([]);
  });

  // Test case 4: If the API request itself fails (network error, etc.), log the error and continue
  it('should log error and continue if API call fails', async () => {
    const eventIds = ['event5'];

    // Simulate a network error for event5
    nock(API_BASE_URL)
      .get('/event')
      .query({ evId: 'event5' })
      .replyWithError('Service unavailable');

    // Spy on console.error to make sure the error is logged
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await processLiveMatchMarket(eventIds);

    // Expect the error to be logged properly
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching event event5:',
      expect.stringContaining('Service unavailable')
    );

    // Still return an empty result so the system doesn't crash
    expect(result.count).toBe(0);
    expect(result.markets).toEqual([]);

    // Restore the original console.error
    consoleSpy.mockRestore();
  });
});
