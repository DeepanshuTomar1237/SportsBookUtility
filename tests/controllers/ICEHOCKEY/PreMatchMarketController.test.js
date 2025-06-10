// This is a test file for the Ice Hockey Pre-Match Market Controller
// It checks if the controller works correctly for ice hockey betting markets before games start

// Import necessary tools for testing
const request = require('supertest'); // Tool for testing HTTP requests
const app = require('../../../server'); // Our main application
const IceHockeyPreMatchMarket = require('../../../models/ICE_HOCKEY/PreMatchMarket'); // Database model for ice hockey markets
const { fetchBet365Data } = require('../../../utils/api'); // Function to get betting data from external API
const { TARGET_FIS_HOCKEY } = require('../../../constants/bookmakers'); // List of hockey events we're interested in

// Set up fake versions of our dependencies for testing (we don't want to use real ones)
jest.mock('../../../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true) // Fake database connection
}));
jest.mock('../../../utils/api'); // Fake API calls
jest.mock('../../../models/ICE_HOCKEY/PreMatchMarket'); // Fake database model

// Create a fake processor that simulates how we handle betting market data
jest.mock('../../../market-processors/Common/PreMatchMarketProcessor', () => ({
    processMarkets: jest.fn().mockImplementation((events) => {
        const markets = {}; // This will store all the betting options
        events.forEach(event => {
          // We look at different types of bets: Asian lines, main bets, totals, period bets
          const sections = ['asian_lines', 'main', 'totals', 'period'];
          sections.forEach(section => {
            if (event[section]?.sp) {
              // Add each betting option to our collection
              Object.values(event[section].sp).forEach(market => {
                markets[market.id] = market;
              });
            }
          });
        });
        return markets; // Return all the betting options we found
      })
}));

// Start describing our tests for the Ice Hockey PreMatchMarket Controller
describe('Ice Hockey PreMatchMarket Controller', () => {
  // Before each test, clear any previous mock data
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  // After each test, clean up
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test 1: Check if the controller correctly returns ice hockey betting markets
  it('should return ice hockey prematch markets', async () => {
    // Create fake API response with sample betting markets
    const mockApiResponse = {
      results: [
        {
          FI: TARGET_FIS_HOCKEY[0], // The hockey event we're interested in
          asian_lines: { sp: { '1': { id: '1', name: 'Asian Handicap' } } }, // Asian handicap bet
          main: { sp: { '2': { id: '2', name: 'Moneyline' } } }, // Moneyline (who will win)
          totals: { sp: { '3': { id: '3', name: 'Total Goals' } } }, // Total goals in game
          period: { sp: { '4': { id: '4', name: 'Period Betting' } } } // Bets on specific periods
        }
      ]
    };

    // What we expect to get back from our controller
    const expectedMarkets = [
      { id: '1', name: 'Asian Handicap' },
      { id: '2', name: 'Moneyline' },
      { id: '3', name: 'Total Goals' }, 
      { id: '4', name: 'Period Betting' }
    ];

    // Tell our fake API to return the mock data when called
    fetchBet365Data.mockResolvedValue(mockApiResponse);
    // Tell our fake database to return this data
    IceHockeyPreMatchMarket.findOneAndUpdate.mockResolvedValue({
      id: 17,
      name: 'IceHockey',
      markets: expectedMarkets
    });

    // Make a fake HTTP request to our endpoint
    const res = await request(app)
      .get('/api/ICE_HOCKEY/pre-match/market/list')
      .expect(200); // We expect a 200 (OK) status code

    // Check if we got back what we expected
    expect(res.body).toEqual([{
      id: 17,
      name: 'IceHockey',
      count: expectedMarkets.length, // Should have 4 markets
      markets: expectedMarkets
    }]);

    // Verify that we tried to fetch data for the correct hockey events
    expect(fetchBet365Data).toHaveBeenCalledWith(TARGET_FIS_HOCKEY);
  });

  // Test 2: Check what happens when no hockey events are found
  it('should handle no events found', async () => {
    // Tell our fake API to return empty results
    fetchBet365Data.mockResolvedValue({ results: [] });

    // Make the request and expect a 404 (Not Found) status
    const res = await request(app)
      .get('/api/ICE_HOCKEY/pre-match/market/list')
      .expect(404);

    // Check we got the right error message
    expect(res.body).toEqual({ error: 'No events found' });
  });

  // Test 3: Check how we handle API errors
  it('should handle API errors', async () => {
    // Make our fake API throw an error
    fetchBet365Data.mockRejectedValue(new Error('API error'));

    // Make the request and expect a 500 (Server Error) status
    const res = await request(app)
      .get('/api/ICE_HOCKEY/pre-match/market/list')
      .expect(500);

    // Check we got the right error details
    expect(res.body).toEqual({ 
      error: 'Failed to process Ice Hockey markets',
      details: 'API error'
    });
  });

  // Test 4: Check how we handle database problems
  it('should handle database errors', async () => {
    // Create some fake API data
    const mockApiResponse = {
      results: [
        {
          FI: TARGET_FIS_HOCKEY[0],
          main: { sp: { '1': { id: '1', name: 'Moneyline' } } }
        }
      ]
    };

    // Tell our fake API to return this data
    fetchBet365Data.mockResolvedValue(mockApiResponse);
    // Make our fake database throw an error
    IceHockeyPreMatchMarket.findOneAndUpdate.mockRejectedValue(new Error('DB error'));

    // Make the request and expect a 500 (Server Error) status
    const res = await request(app)
      .get('/api/ICE_HOCKEY/pre-match/market/list')
      .expect(500);

    // Check we got the right error details
    expect(res.body).toEqual({ 
      error: 'Database operation failed',
      details: 'DB error'
    });
  });
});