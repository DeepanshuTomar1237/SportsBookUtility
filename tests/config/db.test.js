// tests/config/db.test.js
const mongoose = require('mongoose');
const connectDB = require('../../config/db');

// Mock mongoose and process.env
jest.mock('mongoose');
process.env.MONGODB_URI = 'mongodb://test:test@localhost:27017/testdb';

describe('Database Connection', () => {
  let originalConsoleLog, originalConsoleError;

  beforeAll(() => {
    // Store original console functions
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    
    // Mock console
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore original console functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Successful Connection', () => {
    it('should connect to MongoDB successfully', async () => {
      // Mock successful connection
      mongoose.connect.mockResolvedValueOnce();

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URI);
      expect(console.log).toHaveBeenCalledWith('MongoDB connected');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('Connection Failure', () => {
    it('should handle connection errors', async () => {
      // Mock connection error
      const mockError = new Error('Connection failed');
      mongoose.connect.mockRejectedValueOnce(mockError);

      // Mock process.exit
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URI);
      expect(console.error).toHaveBeenCalledWith('MongoDB connection error:', mockError.message);
      expect(mockExit).toHaveBeenCalledWith(1);
      
      // Clean up
      mockExit.mockRestore();
    });
  });

  
});