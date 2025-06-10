// This is the test file for the LiveMatchMarket controller in the Football section

// Import required libraries
const request = require('supertest'); // Used to simulate API requests
const { MongoMemoryServer } = require('mongodb-memory-server'); // Used to create a temporary in-memory MongoDB for testing
const mongoose = require('mongoose'); // Used to connect to MongoDB
const app = require('../../../server'); // This is the Express app (main server)
const FootballMarket = require('../../../models/Football/LiveMatchMarket'); // The MongoDB model for football market data

let mongoServer; // This will hold our in-memory MongoDB server

// Fake/mock the processor function to avoid calling the real external service
jest.mock('../../../market-processors/Football/LiveMatchMarketProcessor', () => ({
  processLiveMatchMarket: jest.fn() // Create a fake function
}));

// Import the mocked processor
const { processLiveMatchMarket } = require('../../../market-processors/Common/LiveMatchMarketProcessor');

// Runs before all tests begin
beforeAll(async () => {
    // Step 1: Start a temporary MongoDB server in memory (not a real installed MongoDB)
    // This is used only for testing so we don't touch or need a real database
    mongoServer = await MongoMemoryServer.create();
  
    // Step 2: Get the connection URL (URI) of the in-memory database
    // This will look like: mongodb://127.0.0.1:xxxxx/test
    const uri = mongoServer.getUri();
  
    // Step 3: Connect Mongoose (our MongoDB library) to this test database
    // This allows us to read/write to the in-memory DB during tests
    await mongoose.connect(uri);
  });
  

// Runs after all tests are finished
afterAll(async () => {
  await mongoose.disconnect(); // Disconnect from the test database
  await mongoServer.stop(); // Stop the test database
});

// Runs after each test case
afterEach(async () => {
  await FootballMarket.deleteMany({}); // Clear the test data
  jest.clearAllMocks(); // Reset any fake/mock functions
});

// Group of tests for the LiveMatchMarket API
describe('LiveMatchMarket Controller', () => {
  const mockEventIds = ['174762095']; // Sample match/event ID
  const mockMarketData = {
    count: 2,
    markets: [
      { id: '1', name: 'Match Winner' },
      { id: '2', name: 'Total Goals' }
    ]
  };

  //  Test: API should return market data successfully
  it('should return live football markets successfully', async () => {
    processLiveMatchMarket.mockResolvedValue(mockMarketData); // Tell the fake function to return mock data

    const response = await request(app)
      .get('/api/football/live-match/market/list') // Send request to this API endpoint
      .expect(200); // Expect HTTP status 200 OK

    // Check that the response body matches our expected structure
    expect(response.body).toEqual([{
      count: mockMarketData.count,
      markets: mockMarketData.markets
    }]);

    // Check that the data is also saved correctly in the database
    const dbRecord = await FootballMarket.findOne();
    expect(dbRecord.marketKey).toMatch(/football_174762095_\d+/); // Pattern check
    expect(dbRecord.sportId).toBe(1); // Sport ID should be 1 for Football
    expect(dbRecord.sportName).toBe("Football");
    expect(dbRecord.name).toBe("Football Markets");
  });

  //  Test: API should handle the case when there is no market data
  it('should handle empty market data', async () => {
    processLiveMatchMarket.mockResolvedValue({ count: 0, markets: [] });

    const response = await request(app)
      .get('/api/football/live-match/market/list')
      .expect(200);

    // Expect empty list in response
    expect(response.body).toEqual([{ count: 0, markets: [] }]);
  });

  //  Test: API should respond with error if processor fails
  it('should handle processor errors gracefully', async () => {
    processLiveMatchMarket.mockRejectedValue(new Error('API Error')); // Simulate failure

    const response = await request(app)
      .get('/api/football/live-match/market/list')
      .expect(500); // Expect HTTP 500 (Server Error)

    // Even in case of error, return an empty list (fail-safe)
    expect(response.body).toEqual([{ count: 0, markets: [] }]);
  });

  //  Test: API response should not include MongoDB _id field
  it('should exclude _id from response', async () => {
    processLiveMatchMarket.mockResolvedValue(mockMarketData);

    const response = await request(app)
      .get('/api/football/live-match/market/list')
      .expect(200);

    // Loop through each market and check that _id is not there
    response.body[0].markets.forEach(market => {
      expect(market._id).toBeUndefined();
    });
  });
});
