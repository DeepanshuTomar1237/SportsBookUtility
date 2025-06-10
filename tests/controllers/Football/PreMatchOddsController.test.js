// Import tools to create fake request and response for testing
const httpMocks = require('node-mocks-http');

// Import the actual controller we want to test
const PreMatchOddsController = require('../../../controllers/Football/PreMatchoddsController');

// Import the database model (we will fake/mock this)
const PreMatchOdds = require('../../../models/Football/PreMatchOdds');

// Import the function that fetches live data from Bet365 (we will mock this too)
const { fetchBet365Data } = require('../../../utils/api');

// Import the function that processes the raw data
const PreMatchOddsProcessor = require('../../../market-processors/Football/PreMatchOddsProcessor');

// Import the list of event IDs for which we want data
const { TARGET_FIS } = require('../../../constants/bookmakers');

// Tell Jest to create fake versions of the imported files (no real API/database calls)
jest.mock('../../../utils/api');
jest.mock('../../../models/Football/PreMatchOdds');
jest.mock('../../../market-processors/Football/PreMatchOddsProcessor');

describe('Football PreMatchOdds Controller', () => {
  // After each test, clear all mock data so tests stay independent
  afterEach(() => {
    jest.clearAllMocks();
  });

  //  Test Case 1: Everything works fine
  test('should return processed pre-match odds data', async () => {
    // Fake the raw data as if it came from Bet365
    const mockRawData = [{ eventId: '123' }];

    // Fake the processed data as if it was cleaned up correctly
    const mockProcessedData = {
      PRE_MATCH_MARKETS: [{ id: '1', name: 'Full Time Result', odds: [] }],
      total_markets: 1
    };

    // Fake what we expect to be saved in the database
    const mockSavedData = {
      PRE_MATCH_MARKETS: mockProcessedData.PRE_MATCH_MARKETS,
      total_markets: mockProcessedData.total_markets
    };

    // Set up the fake/mock responses
    fetchBet365Data.mockResolvedValue(mockRawData); // Fake API call
    PreMatchOddsProcessor.process.mockReturnValue(mockProcessedData); // Fake processing
    PreMatchOdds.findOneAndUpdate.mockResolvedValue(mockSavedData); // Fake DB save

    // Create fake request and response
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    // Run the controller
    await PreMatchOddsController.PreMatchOdds(req, res);

    // Read the result sent back to the client
    const data = res._getJSONData();

    // Check that the status code and result are correct
    expect(res.statusCode).toBe(200); // 200 means success
    expect(data).toEqual([mockSavedData]); // Data should match what we saved
    expect(fetchBet365Data).toHaveBeenCalledWith(TARGET_FIS); // Make sure correct events were fetched
  });

  //  Test Case 2: Processor returns an error
  test('should return 404 if processor returns error', async () => {
    const mockRawData = [{ eventId: '123' }]; // Fake raw data
    const mockProcessedData = { error: 'Invalid data' }; // Simulate an error during processing

    fetchBet365Data.mockResolvedValue(mockRawData); // Fake API response
    PreMatchOddsProcessor.process.mockReturnValue(mockProcessedData); // Simulate failure

    const req = httpMocks.createRequest(); // Fake request
    const res = httpMocks.createResponse(); // Fake response

    await PreMatchOddsController.PreMatchOdds(req, res); // Call the controller

    // Check if it returns 404 (not found or bad data)
    expect(res.statusCode).toBe(404);
    expect(res._getJSONData()).toEqual(mockProcessedData); // Error message should match
  });

  //  Test Case 3: Something breaks (like API down)
  test('should return 500 if API throws error', async () => {
    // Make the API call throw an error
    fetchBet365Data.mockRejectedValue(new Error('API down'));

    const req = httpMocks.createRequest(); // Fake request
    const res = httpMocks.createResponse(); // Fake response

    await PreMatchOddsController.PreMatchOdds(req, res); // Call controller

    // Check if it returns 500 (server error)
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({
      error: 'Failed to fetch or store data' // Expected error response
    });
  });
});

