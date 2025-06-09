// tests\controllers\Football\PreMatchMarketController.test.js
// Import supertest to simulate HTTP requests for testing
const request = require('supertest');

// Import the Express app (backend server)
const app = require('../../../server');

// Import the Football PreMatch market model (used to save/update market data)
const PreMatchMarket = require('../../../models/Football/PreMatchmarket');

// Import the API function that fetches data from Bet365
const { fetchBet365Data } = require('../../../utils/api');

// Import a list of default football event IDs we want to fetch markets for
const { TARGET_FIS } = require('../../../constants/bookmakers');

// --------- Mock setup section ---------

// We mock the database connection so we don’t connect to the real database while testing
jest.mock('../../../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true)
}));

// We mock the external API call and model so no real network or DB calls are made
jest.mock('../../../utils/api');
jest.mock('../../../models/Football/PreMatchmarket');

// --------- Test cases start here ---------

describe('Football PreMatchMarket Controller', () => {
  // This runs before each test to reset mocks and avoid mixing data between tests
  beforeEach(() => {
    jest.clearAllMocks(); // reset all mock calls
    jest.spyOn(console, 'log').mockImplementation(() => {}); // mute console logs during test
  });

  // This runs after each test to clean up any mocked console logs
  afterEach(() => {
    jest.restoreAllMocks();
  });

  //  Test: If everything works correctly, the API should return a football market list
  it('should return football prematch markets', async () => {
    // Simulate the API response we expect from Bet365
    const mockApiResponse = {
        results: [
          {
            FI: TARGET_FIS[0],
            asian_lines: { sp: { '1': { id: '1', name: 'Asian Handicap' } } },
            goals: { sp: { '2': { id: '2', name: 'Total Goals' } } },
            main: { sp: { '3': { id: '3', name: 'Match Odds' } } },
            half: { sp: { '4': { id: '4', name: 'Half Time Result' } } },
            minutes: { sp: { '5': { id: '5', name: 'Minutes Played Market' } } },
            specials: { sp: { '6': { id: '6', name: 'Special Bets' } } },
            corners: { sp: { '7': { id: '7', name: 'Corner Kicks' } } },
            // others: { sp: { '8': { id: '8', name: 'Other Markets' } } } // This is present
          }
        ]
      };
      
      const mockMarkets = [
        { id: '1', name: 'Asian Handicap' },
        { id: '2', name: 'Total Goals' },
        { id: '3', name: 'Match Odds' },
        { id: '4', name: 'Half Time Result' },
        { id: '5', name: 'Minutes Played Market' },
        { id: '6', name: 'Special Bets' },
        { id: '7', name: 'Corner Kicks' },
        // { id: '8', name: 'Other Markets' } // This is present
      ];

    // Mocking fetchBet365Data to return the above fake response
    fetchBet365Data.mockResolvedValue(mockApiResponse);

    // Mock the database update call to return the mock market object
    PreMatchMarket.findOneAndUpdate.mockResolvedValue({
      id: 1,
      name: 'Football',
      markets: mockMarkets
    });

    // Perform a GET request to our controller endpoint
    const res = await request(app)
      .get('/api/football/pre-match/market/list')
      .expect(200); // Expect HTTP status 200 OK

    // Check if the response matches our mock data
    expect(res.body).toEqual([
      {
        id: 1,
        name: 'Football',
        count: mockMarkets.length, // count should be dynamic based on markets array
        markets: mockMarkets
      }
    ]);

    // Verify the API was called with correct event IDs
    expect(fetchBet365Data).toHaveBeenCalledWith(TARGET_FIS);
});
  //  Test: What happens if Bet365 returns no events
  it('should handle no events found', async () => {
    // Mock the API to return an empty result
    fetchBet365Data.mockResolvedValue({ results: [] });

    // Call the API and expect a 404 error with message
    const res = await request(app)
      .get('/api/football/pre-match/market/list')
      .expect(404);

    expect(res.body.error).toBe('No events found');
  });

  //  Test: What happens if the API itself fails (e.g. network error)
  it('should handle API errors', async () => {
    // Mock the API to throw an error
    fetchBet365Data.mockRejectedValue(new Error('API error'));

    // Call the API and expect a 500 internal server error
    const res = await request(app)
      .get('/api/football/pre-match/market/list')
      .expect(500);

    expect(res.body.error).toBe('Failed to fetch data from Bet365 API');
  });
});
