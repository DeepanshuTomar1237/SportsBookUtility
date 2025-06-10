// This file tests the Ice Hockey Pre-Match Odds Controller
// It checks if the controller correctly handles ice hockey betting odds before games start

// Import tools needed for testing
const httpMocks = require('node-mocks-http'); // Creates fake HTTP requests/responses for testing
const IceHockeyPreMatchOddsController = require('../../../controllers/ICE_HOCKEY/PreMatchOddsController'); // The actual controller we're testing
const IceHockeyPreMatchOdds = require('../../../models/ICE_HOCKEY/PreMatchOdds'); // Database model for ice hockey odds
const { fetchBet365Data } = require('../../../utils/api'); // Function to get data from betting API
const PreMatchOddsProcessor = require('../../../market-processors/Common/PreMatchOddsProcessor'); // Processes raw betting data
const { TARGET_FIS_HOCKEY } = require('../../../constants/bookmakers'); // List of hockey events we want data for

// Tell Jest to create fake versions of these modules (so we don't call real API/database)
jest.mock('../../../utils/api');
jest.mock('../../../models/ICE_HOCKEY/PreMatchOdds');
jest.mock('../../../market-processors/Common/PreMatchOddsProcessor');

describe('Ice Hockey PreMatchOdds Controller', () => {
  // After each test, reset all mock data to keep tests independent
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Everything works correctly - happy path
  test('should return processed ice hockey pre-match odds', async () => {
    // 1. Setup fake data that simulates API response
    const mockRawData = [{ 
      eventId: '123', 
      name: 'Team A vs Team B',
      odds: { home: 1.8, away: 2.1 }
    }];

    // 2. Setup how we expect the data to look after processing
    const mockProcessedData = {
      PRE_MATCH_MARKETS: [
        { id: '1', name: 'Moneyline', odds: [{ home: 1.8, away: 2.1 }] }
      ],
      total_markets: 1
    };

    // 3. Setup what we expect to be saved in database
    const mockSavedData = {
      id: 17,
      name: 'IceHockey',
      count: 1,
      markets: mockProcessedData.PRE_MATCH_MARKETS
    };

    // 4. Configure our fake functions to return this data
    fetchBet365Data.mockResolvedValue(mockRawData); // Fake API returns our mock data
    PreMatchOddsProcessor.process.mockReturnValue(mockProcessedData); // Fake processing
    IceHockeyPreMatchOdds.findOneAndUpdate.mockResolvedValue(mockSavedData); // Fake DB save

    // 5. Create fake HTTP request and response objects
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    // 6. Call the actual controller function with our fake request/response
    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);

    // 7. Check the response we got back
    const responseData = res._getJSONData();
    
    // 8. Verify everything worked correctly:
    expect(res.statusCode).toBe(200); // Should return 200 (success)
    expect(responseData).toEqual([mockSavedData]); // Response should match our expected data
    expect(fetchBet365Data).toHaveBeenCalledWith(TARGET_FIS_HOCKEY); // Should have fetched hockey events
  });

  // Test 2: When the data processing fails (invalid data from API)
  test('should return 404 if processor finds invalid data', async () => {
    // 1. Setup fake API response
    const mockRawData = [{ eventId: '456', invalid: 'data' }];
    
    // 2. Simulate processor finding an error
    const mockProcessedData = { error: 'Invalid odds format' };

    // 3. Configure fake functions
    fetchBet365Data.mockResolvedValue(mockRawData);
    PreMatchOddsProcessor.process.mockReturnValue(mockProcessedData);

    // 4. Create fake request/response
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    // 5. Call controller
    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);

    // 6. Verify response
    expect(res.statusCode).toBe(404); // Should return 404 (not found/bad data)
    expect(res._getJSONData()).toEqual({ error: 'Invalid odds format' }); // Error message
  });

  // Test 3: When the API fails (network error, service down)
  test('should return 500 if API call fails', async () => {
    // 1. Make our fake API throw an error
    fetchBet365Data.mockRejectedValue(new Error('API timeout'));

    // 2. Create fake request/response
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    // 3. Call controller
    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);

    // 4. Verify response
    expect(res.statusCode).toBe(500); // Should return 500 (server error)
    expect(res._getJSONData()).toEqual({
      error: 'API timeout', // Should show the API error
      details: 'API timeout'
    });
  });

  // Test 4: When database save fails
  test('should still return data even if database save fails', async () => {
    // 1. Setup good API and processing data
    const mockRawData = [{ eventId: '789', odds: { home: 1.9, away: 2.0 } }];
    const mockProcessedData = {
      PRE_MATCH_MARKETS: [{ id: '2', name: 'Total Goals', odds: [] }],
      total_markets: 1
    };
    const expectedResponse = {
      id: 17,
      name: 'IceHockey',
      count: 1,
      markets: mockProcessedData.PRE_MATCH_MARKETS
    };

    // 2. Configure fakes - API and processor work, but DB fails
    fetchBet365Data.mockResolvedValue(mockRawData);
    PreMatchOddsProcessor.process.mockReturnValue(mockProcessedData);
    IceHockeyPreMatchOdds.findOneAndUpdate.mockRejectedValue(new Error('DB full'));

    // 3. Create fake request/response
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    // 4. Call controller
    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);

    // 5. Verify response - should still return data even if DB failed
    expect(res.statusCode).toBe(200); // Success status
    expect(res._getJSONData()).toEqual([expectedResponse]); // Should get our processed data
  });
});