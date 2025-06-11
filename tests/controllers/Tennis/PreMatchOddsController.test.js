const { TennisPreMatchOdds } = require('../../../controllers/Tennis/PreMatchOddsController');
const PreMatchMarket = require('../../../models/Tennis/PreMatchmarket');
const { fetchBet365Data } = require('../../../utils/api');
const TennisPreMatchMarketProcessor = require('../../../market-processors/Tennis/PreMatchOdds');
const { TARGET_FIS_TENNIS, TENNIS_EVENTS } = require('../../../constants/bookmakers');

jest.mock('../../../utils/api');
jest.mock('../../../models/Tennis/PreMatchmarket');
jest.mock('../../../market-processors/Tennis/PreMatchOdds');

describe('TennisPreMatchOdds Controller', () => {
  let req, res;
  let originalNodeEnv;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('Successful data processing', () => {
    it('should process tennis prematch odds successfully', async () => {
      const fiWithId = Object.keys(TENNIS_EVENTS).find(key => TENNIS_EVENTS[key].id);
      const mockEventData = TENNIS_EVENTS[fiWithId];

      const mockApiResponse = {
        results: [
          {
            FI: fiWithId.toString(),
            otherData: 'test',
            market1: { sp: { id: 1, name: 'Match Winner' } }
          }
        ]
      };
      
      fetchBet365Data.mockResolvedValue(mockApiResponse);
      
      const mockProcessedMarkets = [
        { id: '1', name: 'Match Winner', odds: [] }
      ];
      TennisPreMatchMarketProcessor.process.mockReturnValue(mockProcessedMarkets);
      
      const mockDbResponse = {
        id: 13,
        name: 'Tennis',
        count: 1,
        markets: mockProcessedMarkets
      };
      PreMatchMarket.findOneAndUpdate.mockResolvedValue(mockDbResponse);
      
      await TennisPreMatchOdds(req, res);
      
      expect(fetchBet365Data).toHaveBeenCalledWith(TARGET_FIS_TENNIS);
      expect(TennisPreMatchMarketProcessor.process).toHaveBeenCalled();
      expect(PreMatchMarket.findOneAndUpdate).toHaveBeenCalledWith(
        { id: 13 },
        expect.objectContaining({
          id: 13,
          name: 'Tennis',
          count: 1,
          markets: mockProcessedMarkets
        }),
        { upsert: true, new: true }
      );
      expect(res.json).toHaveBeenCalledWith(mockDbResponse);
      expect(console.log).toHaveBeenCalledWith('Processing', 1, 'events');
      expect(console.log).toHaveBeenCalledWith('Found', 1, 'markets');
    });
  });

  describe('Error handling', () => {
    it('should handle no events found', async () => {
      fetchBet365Data.mockResolvedValue({ results: [] });
      
      await TennisPreMatchOdds(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tennis events found',
        request: { FIs: TARGET_FIS_TENNIS }
      });
    });
    
    it('should handle API errors', async () => {
      const mockError = new Error('API failed');
      fetchBet365Data.mockRejectedValue(mockError);
      
      await TennisPreMatchOdds(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to process tennis prematch data',
        details: mockError.message
      });
    });
    
    it('should handle processor errors', async () => {
      const fiWithId = Object.keys(TENNIS_EVENTS).find(key => TENNIS_EVENTS[key].id);

      const mockApiResponse = {
        results: [
          {
            FI: fiWithId.toString(),
            otherData: 'test',
            market1: { sp: { id: 1, name: 'Match Winner' } }
          }
        ]
      };
      fetchBet365Data.mockResolvedValue(mockApiResponse);
      
      const mockError = new Error('Processor failed');
      TennisPreMatchMarketProcessor.process.mockImplementation(() => {
        throw mockError;
      });
      
      await TennisPreMatchOdds(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to process tennis prematch data',
        details: mockError.message
      });
    });

    it('should not expose error details in production environment', async () => {
      process.env.NODE_ENV = 'production';
      const mockError = new Error('API failed');
      fetchBet365Data.mockRejectedValue(mockError);
      
      await TennisPreMatchOdds(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to process tennis prematch data',
        details: undefined
      });
    });
  });

  describe('Data enrichment', () => {
    it('should correctly enrich events with metadata', async () => {
      const fiWithId = Object.keys(TENNIS_EVENTS).find(key => TENNIS_EVENTS[key].id);
      const eventInfo = TENNIS_EVENTS[fiWithId];

      const mockApiResponse = {
        results: [
          {
            FI: fiWithId.toString(),
            market1: { sp: { id: 1, name: 'Match Winner' } }
          }
        ]
      };
      
      fetchBet365Data.mockResolvedValue(mockApiResponse);
      
      const mockProcessedMarkets = [
        { id: '1', name: 'Match Winner', odds: [] }
      ];
      TennisPreMatchMarketProcessor.process.mockReturnValue(mockProcessedMarkets);
      
      await TennisPreMatchOdds(req, res);
      
      expect(TennisPreMatchMarketProcessor.process).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            FI: fiWithId.toString(),
            home: eventInfo.home,
            away: eventInfo.away,
            leagueId: eventInfo.leagueId,
            eventId: eventInfo.id
          })
        ])
      );
    });
    
    it('should filter out non-matching FIs', async () => {
      const mockApiResponse = {
        results: [
          {
            FI: '999', // Not in TARGET_FIS_TENNIS
            market1: { sp: { id: 101, name: 'Market A' } }
          }
        ]
      };
      
      fetchBet365Data.mockResolvedValue(mockApiResponse);
      TennisPreMatchMarketProcessor.process.mockReturnValue([]);
      
      await TennisPreMatchOdds(req, res);
      
      expect(TennisPreMatchMarketProcessor.process).toHaveBeenCalledWith([]);
    });
  });

  describe('Logging', () => {
    it('should log processing information', async () => {
      const fiWithId = Object.keys(TENNIS_EVENTS).find(key => TENNIS_EVENTS[key].id);
      
      const mockApiResponse = {
        results: [
          {
            FI: fiWithId.toString(),
            market1: { sp: { id: 1, name: 'Match Winner' } }
          }
        ]
      };
      
      fetchBet365Data.mockResolvedValue(mockApiResponse);
      TennisPreMatchMarketProcessor.process.mockReturnValue([{ id: '1', name: 'Market' }]);
      
      await TennisPreMatchOdds(req, res);
      
      expect(console.log).toHaveBeenCalledWith('Processing', 1, 'events');
      expect(console.log).toHaveBeenCalledWith('Found', 1, 'markets');
    });
  });
});