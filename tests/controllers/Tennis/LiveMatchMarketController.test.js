// tests/controllers/Tennis/LiveMatchMarketController.test.js
const { TennisLiveMatchMarket } = require('../../../controllers/Tennis/LiveMatchMarketController');
const TennisLiveMarket = require('../../../models/Tennis/LiveMatchMarket');
const { processLiveMatchMarket } = require('../../../market-processors/Common/LiveMatchMarketProcessor');
const { TENNIS_LIVE_EVENT_IDS } = require('../../../constants/bookmakers');

jest.mock('../../../models/Tennis/LiveMatchMarket');
jest.mock('../../../market-processors/Common/LiveMatchMarketProcessor');

describe('TennisLiveMatchMarket Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    console.error = jest.fn(); // Mock console.error
  });

  describe('Successful operation', () => {
    it('should process live tennis markets and return formatted response', async () => {
      const mockProcessResult = {
        sportId: 2,
        name: 'Tennis',
        count: 3,
        markets: [
          { id: '1', name: 'Match Winner' },
          { id: '2', name: 'Total Games' }
        ]
      };

      const mockSavedMarket = {
        ...mockProcessResult,
        marketKey: `football_${TENNIS_LIVE_EVENT_IDS.join('_')}_${Date.now()}`,
        toObject: jest.fn().mockReturnThis()
      };

      processLiveMatchMarket.mockResolvedValue(mockProcessResult);
      TennisLiveMarket.findOneAndUpdate.mockResolvedValue(mockSavedMarket);

      await TennisLiveMatchMarket(req, res);

      expect(processLiveMatchMarket).toHaveBeenCalledWith(TENNIS_LIVE_EVENT_IDS);
      
      expect(TennisLiveMarket.findOneAndUpdate).toHaveBeenCalledWith(
        { marketKey: expect.stringContaining(`football_${TENNIS_LIVE_EVENT_IDS.join('_')}`) },
        expect.objectContaining({
          ...mockProcessResult,
          marketKey: expect.stringContaining(`football_${TENNIS_LIVE_EVENT_IDS.join('_')}`)
        }),
        { upsert: true, new: true }
      );

      expect(res.json).toHaveBeenCalledWith([{
        id: mockProcessResult.sportId,
        name: mockProcessResult.name,
        count: mockProcessResult.count,
        markets: mockProcessResult.markets
      }]);
    });
  });

  describe('Error handling', () => {
    it('should handle processor errors', async () => {
      const mockError = new Error('Processor failed');
      processLiveMatchMarket.mockRejectedValue(mockError);

      await TennisLiveMatchMarket(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Controller Error:', mockError);
    });

    it('should handle database errors', async () => {
      const mockProcessResult = {
        sportId: 2,
        name: 'Tennis',
        count: 3,
        markets: []
      };

      const mockError = new Error('Database failed');
      processLiveMatchMarket.mockResolvedValue(mockProcessResult);
      TennisLiveMarket.findOneAndUpdate.mockRejectedValue(mockError);

      await TennisLiveMatchMarket(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Controller Error:', mockError);
    });
  });

  describe('Market key generation', () => {
    it('should generate correct market key format', async () => {
      const mockProcessResult = {
        sportId: 2,
        name: 'Tennis',
        count: 0,
        markets: []
      };

      processLiveMatchMarket.mockResolvedValue(mockProcessResult);
      TennisLiveMarket.findOneAndUpdate.mockImplementation(async (query, data) => ({
        ...data,
        toObject: jest.fn().mockReturnThis()
      }));

      await TennisLiveMatchMarket(req, res);

      const marketKey = TennisLiveMarket.findOneAndUpdate.mock.calls[0][1].marketKey;
      expect(marketKey).toMatch(new RegExp(`^football_${TENNIS_LIVE_EVENT_IDS.join('_')}_\\d+$`));
    });
  });

  describe('Response formatting', () => {
    it('should return response in correct format even with empty markets', async () => {
      const mockProcessResult = {
        sportId: 2,
        name: 'Tennis',
        count: 0,
        markets: []
      };

      processLiveMatchMarket.mockResolvedValue(mockProcessResult);
      TennisLiveMarket.findOneAndUpdate.mockResolvedValue({
        ...mockProcessResult,
        marketKey: 'football_123_456',
        toObject: jest.fn().mockReturnThis()
      });

      await TennisLiveMatchMarket(req, res);

      expect(res.json).toHaveBeenCalledWith([{
        id: 2,
        name: 'Tennis',
        count: 0,
        markets: []
      }]);
    });
  });
});