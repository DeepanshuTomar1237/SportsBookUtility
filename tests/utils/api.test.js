// tests\utils\api.test.js

// Import the function we want to test from our code
const { update } = require('lodash');
const { fetchBet365Data } = require('../../utils/api');
// Import axios - a tool for making internet requests
const axios = require('axios');

// Tell Jest to pretend these are the real tools (so we don't actually call real APIs)
// 1. Mock axios (the internet request tool)
jest.mock('axios');
// 2. Mock dotenv (the tool that reads secret keys)
jest.mock('dotenv', () => ({
  config: jest.fn() // This is a pretend version that does nothing
}));

// Start describing what we're testing - the fetchBet365Data function
describe('fetchBet365Data', () => {
  // These are fake values we'll use in our tests
  const mockFIs = [1, 2, 3]; // Fake sport IDs
  const mockApiUrl = 'https://api.bet365.com/v1'; // Fake website address
  const mockToken = 'test-token-123'; // Fake security key

  // This runs before each test to set up a clean environment
  beforeEach(() => {
    // Clear any previous test data
    jest.clearAllMocks();
    
    // Set up our fake environment variables
    process.env.BET365_API_URL = mockApiUrl;
    process.env.BET365_API_TOKEN = mockToken;
    
    // Set up a way to track error messages without showing them
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // Clean up after all tests are done
  afterAll(() => {
    console.error.mockRestore(); // Put the real console.error back
  });

  // Test 1: Check if the function makes the right internet request
  it('should make a GET request with correct parameters', async () => {
    // Create fake successful response data
    const mockResponse = {
      data: {
        results: ['match1', 'match2'] // Fake match data
      }
    };
    // Tell our mock axios to return this fake response
    axios.get.mockResolvedValue(mockResponse);

    // Actually call our function with fake sport IDs
    const result = await fetchBet365Data(mockFIs);

    // Check if axios was called with the right website address and parameters
    expect(axios.get).toHaveBeenCalledWith(mockApiUrl, {
      params: {
        token: mockToken, // Should use our fake security key
        FI: '1,2,3' // Should combine the IDs with commas
      },
      paramsSerializer: expect.any(Function) // Should include the special formatting function
    });

    // Check if we got back the fake data we expected
    expect(result).toEqual(mockResponse.data);
  });

  // Test 2: Check how the function handles errors
  it('should handle API errors properly', async () => {
    // Create a fake network error
    const mockError = new Error('Network error');
    // Tell axios to pretend there was an error
    axios.get.mockRejectedValue(mockError);

    // Check that our function throws the right error message
    await expect(fetchBet365Data(mockFIs)).rejects.toThrow('Failed to fetch data from Bet365 API');

    // Check that the error was properly logged (but not shown)
    expect(console.error).toHaveBeenCalledWith('API Error:', {
      message: 'Network error', // Should show the error message
      url: undefined, // No URL because it's a network error
      status: undefined // No status because it's a network error
    });
  });

  // Test 3: Check if the function formats parameters correctly
  it('should properly serialize parameters', async () => {
    // Create empty fake response
    const mockResponse = { data: {} };
    axios.get.mockResolvedValue(mockResponse);

    // Call our function
    await fetchBet365Data(mockFIs);

    // Get the special formatting function that was used
    // Get all the mock calls made to axios.get
// axios.get.mock.calls is an array containing all calls made to the mocked axios.get
// Each call is represented as an array of arguments that were passed

// For example: 
// First call: axios.get('https://api.url', { params: {...}, paramsSerializer: fn })
// Would be stored as:
// [
//   ['https://api.url', { params: {...}, paramsSerializer: fn }]
// ]

// So axios.get.mock.calls[0] gets the first call
// And [1] gets the second argument (the config object) of that first call
const callArgs = axios.get.mock.calls[0][1]; 

// Now we extract just the paramsSerializer function from the config object
// This is the function our code provides to format/encode the URL parameters
const paramsSerializer = callArgs.paramsSerializer;

// We can now test this function directly by calling it with test data

    // Test the formatting function with sample data
    const testParams = { key1: 'value 1', key2: 'value&2' };
    const serialized = paramsSerializer(testParams);
    
    // Check if spaces became %20 and & became %26
    expect(serialized).toBe('key1=value%201&key2=value%262');
  });
});

