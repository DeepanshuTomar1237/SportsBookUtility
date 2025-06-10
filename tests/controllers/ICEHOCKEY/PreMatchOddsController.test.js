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
    const mockRawData = [{ eventId: '123', name: 'Team A vs Team B', odds: { home: 1.8, away: 2.1 } }];
  
    const mockProcessedData = {
      PRE_MATCH_MARKETS: [
        { id: '1', name: 'Moneyline', odds: [{ id: 'odd1', odds: '1.8', header: 'Home', name: 'Team A', handicap: null, team: 'home' }] }
      ],
      total_markets: 1
    };
  
    const mockSavedData = {
      id: 17,
      name: 'IceHockey',
      count: 1,
      markets: mockProcessedData.PRE_MATCH_MARKETS
    };
  
    fetchBet365Data.mockResolvedValue(mockRawData);
    PreMatchOddsProcessor.process.mockReturnValue(mockProcessedData);
    IceHockeyPreMatchOdds.findOneAndUpdate.mockResolvedValue(mockSavedData);
  
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
  
    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);
  
    const responseData = res._getJSONData();
  
    expect(res.statusCode).toBe(200);
    expect(responseData).toEqual([mockSavedData]);
    expect(fetchBet365Data).toHaveBeenCalledWith(TARGET_FIS_HOCKEY);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully stored'));
  
    consoleSpy.mockRestore();
  });
  

  // Add this new test to cover the empty markets case
test('should handle empty markets array gracefully', async () => {
    const mockRawData = [{ eventId: '999', odds: null }];
    const mockProcessedData = {
      PRE_MATCH_MARKETS: [],
      total_markets: 0
    };
  
    fetchBet365Data.mockResolvedValue(mockRawData);
    PreMatchOddsProcessor.process.mockReturnValue(mockProcessedData);
    IceHockeyPreMatchOdds.findOneAndUpdate.mockResolvedValue({});
  
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
  
    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);
  
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual([{
      id: 17,
      name: 'IceHockey',
      count: 0,
      markets: []
    }]);
  });
  
  // Enhanced database error test to verify logging
  test('should log database errors but still return data', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockRawData = [{ eventId: '789', odds: { home: 1.9, away: 2.0 } }];
    const mockProcessedData = {
      PRE_MATCH_MARKETS: [{ id: '2', name: 'Total Goals', odds: [] }],
      total_markets: 1
    };
  
    fetchBet365Data.mockResolvedValue(mockRawData);
    PreMatchOddsProcessor.process.mockReturnValue(mockProcessedData);
    IceHockeyPreMatchOdds.findOneAndUpdate.mockRejectedValue(new Error('DB full'));
  
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
  
    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);
  
    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith('MongoDB error:', 'DB full');
    
    // Verify response still succeeds
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual([{
      id: 17,
      name: 'IceHockey',
      count: 1,
      markets: mockProcessedData.PRE_MATCH_MARKETS
    }]);
  
    consoleSpy.mockRestore();
  });
  
  // Enhanced error format test
  test('should return properly formatted error response', async () => {
    fetchBet365Data.mockRejectedValue(new Error('Network failure'));
  
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
  
    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);
  
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({
      error: 'Network failure',
      details: 'Network failure'
    });
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