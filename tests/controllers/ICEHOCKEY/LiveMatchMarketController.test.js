// tests/controllers/ICEHOCKEY/LiveMatchMarketController.test.js
// This file tests the Ice Hockey Live Match Market Controller

// Import required libraries for testing
const request = require('supertest'); // For making HTTP requests to our API
const { MongoMemoryServer } = require('mongodb-memory-server'); // Creates temporary in-memory MongoDB
const mongoose = require('mongoose'); // MongoDB object modeling tool
const app = require('../../../server'); // Our Express application
const IceHockeyLiveMarket = require('../../../models/ICE_HOCKEY/LiveMatchMarket'); // Ice Hockey market model

// Create mock for the market processor to avoid real API calls
jest.mock('../../../market-processors/Common/LiveMatchMarketProcessor', () => ({
  processLiveMatchMarket: jest.fn() // Mock function that we can control
}));

// Get our mocked processor function
const { processLiveMatchMarket } = require('../../../market-processors/Common/LiveMatchMarketProcessor');

let mongoServer; // Will hold our in-memory MongoDB instance

// Set up before all tests run
beforeAll(async () => {
  // 1. Start an in-memory MongoDB server (no installation needed)
  mongoServer = await MongoMemoryServer.create();
  
  // 2. Get the connection string for this temporary database
  const uri = mongoServer.getUri();
  
  // 3. Connect Mongoose to our in-memory database
  await mongoose.connect(uri);
});

// Clean up after all tests finish
afterAll(async () => {
  await mongoose.disconnect(); // Disconnect from database
  await mongoServer.stop(); // Stop the in-memory MongoDB
});

// Reset between tests
afterEach(async () => {
  await IceHockeyLiveMarket.deleteMany({}); // Clear all test data
  jest.clearAllMocks(); // Reset all mock functions
});

// Main test suite for Ice Hockey Live Markets
describe('Ice Hockey LiveMatchMarket Controller', () => {
  // Sample data we'll use in tests
  const mockEventIds = ['987654321']; // Example ice hockey match ID
  const mockMarketData = {
    count: 3,
    markets: [
      { id: '1', name: 'Game Winner' },
      { id: '2', name: 'Period Betting' },
      { id: '3', name: 'Total Goals' }
    ]
  };

  // Test 1: Successful API call with market data
  it('should return live ice hockey markets successfully', async () => {
    // 1. Setup mock processor to return our sample data
    processLiveMatchMarket.mockResolvedValue(mockMarketData);

    // 2. Make API request to our endpoint
    const response = await request(app)
      .get('/api/ICE_HOCKEY/live-match/market/list')
      .expect(200); // Expect HTTP 200 OK

    // 3. Verify response structure and data
    expect(response.body).toEqual([{
      count: mockMarketData.count,
      markets: mockMarketData.markets
    }]);

    // 4. Check database was updated correctly
    const dbRecord = await IceHockeyLiveMarket.findOne();
    expect(dbRecord.marketKey).toMatch(/^ice_hockey(_\d+)+$/);
    expect(dbRecord.sportId).toBe(17); // Ice Hockey sport ID
    expect(dbRecord.sportName).toBe("Ice Hockey");
    expect(dbRecord.name).toBe("Ice Hockey Markets");
  });

  // Test 2: No markets available (empty response)
  it('should handle empty market data', async () => {
    // 1. Mock empty response from processor
    processLiveMatchMarket.mockResolvedValue({ count: 0, markets: [] });

    // 2. Make API request
    const response = await request(app)
      .get('/api/ICE_HOCKEY/live-match/market/list')
      .expect(200);

    // 3. Verify empty response
    expect(response.body).toEqual([{ count: 0, markets: [] }]);
  });

  // Test 3: Error in market processor
  it('should handle processor errors gracefully', async () => {
    // 1. Mock processor throwing an error
    processLiveMatchMarket.mockRejectedValue(new Error('Service unavailable'));

    // 2. Make API request
    const response = await request(app)
      .get('/api/ICE_HOCKEY/live-match/market/list')
      .expect(500); // Expect server error

    // 3. Verify error response still follows our format
    expect(response.body).toEqual([{ count: 0, markets: [] }]);
  });

  // Test 4: Response should not include MongoDB internal fields
  it('should exclude _id from API response', async () => {
    // 1. Setup mock data
    processLiveMatchMarket.mockResolvedValue(mockMarketData);

    // 2. Make API request
    const response = await request(app)
      .get('/api/ICE_HOCKEY/live-match/market/list')
      .expect(200);

    // 3. Verify no _id fields in response
    response.body[0].markets.forEach(market => {
      expect(market._id).toBeUndefined();
    });
  });

  // Test 5: Verify correct sport-specific data
  it('should maintain ice hockey specific data', async () => {
    // 1. Setup mock data
    processLiveMatchMarket.mockResolvedValue(mockMarketData);

    // 2. Make API request
    await request(app).get('/api/ICE_HOCKEY/live-match/market/list');

    // 3. Check database record has ice hockey specific values
    const dbRecord = await IceHockeyLiveMarket.findOne();
    expect(dbRecord.sportId).toBe(17);
    expect(dbRecord.sportName).toBe("Ice Hockey");
  });
});