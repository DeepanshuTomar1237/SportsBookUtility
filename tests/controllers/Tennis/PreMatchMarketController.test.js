// tests\controllers\Tennis\PreMatchMarketController.test.js
const { TennisPreMatchMarket } = require('../../../controllers/Tennis/PreMatchMarketController');
const PreMatchMarket = require('../../../models/Tennis/PreMatchmarket');
const { fetchBet365Data } = require('../../../utils/api');
const { processMarkets } = require('../../../market-processors/Tennis/PreMatchProcessor');
const { TARGET_FIS_TENNIS, TENNIS_EVENTS } = require('../../../constants/bookmakers'); // Import TENNIS_EVENTS

jest.mock('../../../utils/api');
jest.mock('../../../models/Tennis/PreMatchmarket');
jest.mock('../../../market-processors/Tennis/PreMatchProcessor');

describe('TennisPreMatchMarket Controller', () => {
  let req, res;
  let originalNodeEnv; // Declare a variable to store the original NODE_ENV

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  
    jest.spyOn(console, 'log').mockImplementation(() => {}); // ⬅ Clear console.log output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    jest.clearAllMocks();
  });
  

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    console.log.mockRestore();  // ⬅ Restore console.log
    console.error.mockRestore();
  });
  

  describe('Successful data processing', () => {
    it('should process tennis prematch markets successfully', async () => {
      // Find an FI that has an ID in TENNIS_EVENTS for realistic mocking
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
        { id: '1', name: 'Match Winner', leagues: [] }
      ];
      processMarkets.mockReturnValue(mockProcessedMarkets);
      
      const mockDbResponse = {
        id: 13,
        name: 'Tennis',
        count: 1,
        markets: mockProcessedMarkets
      };
      PreMatchMarket.findOneAndUpdate.mockResolvedValue(mockDbResponse);
      
      await TennisPreMatchMarket(req, res);
      
      expect(fetchBet365Data).toHaveBeenCalledWith(TARGET_FIS_TENNIS);
      expect(processMarkets).toHaveBeenCalled();
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
    });
  });

  describe('Error handling', () => {
    it('should handle no events found', async () => {
      fetchBet365Data.mockResolvedValue({ results: [] });
      
      await TennisPreMatchMarket(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tennis events found',
        request: { FIs: TARGET_FIS_TENNIS }
      });
    });
    
    it('should handle API errors', async () => {
      const mockError = new Error('API failed');
      fetchBet365Data.mockRejectedValue(mockError);
      
      await TennisPreMatchMarket(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to process tennis prematch data',
        details: mockError.message
      });
    });
    
    it('should handle database errors', async () => {
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
      
      const mockProcessedMarkets = [{ id: '1', name: 'Match Winner', leagues: [] }];
      processMarkets.mockReturnValue(mockProcessedMarkets);
      
      const mockError = new Error('Database failed');
      PreMatchMarket.findOneAndUpdate.mockRejectedValue(mockError);
      
      await TennisPreMatchMarket(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to process tennis prematch data',
        details: mockError.message
      });
    });

    it('should not expose error details in production environment', async () => {
      // Temporarily set NODE_ENV to production for this specific test
      process.env.NODE_ENV = 'production'; 
      const mockError = new Error('API failed');
      fetchBet365Data.mockRejectedValue(mockError);
      
      await TennisPreMatchMarket(req, res);
      
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
        { id: '1', name: 'Match Winner', leagues: [] }
      ];
      processMarkets.mockReturnValue(mockProcessedMarkets);
      
      await TennisPreMatchMarket(req, res);
      
      expect(processMarkets).toHaveBeenCalledWith(
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
    
    it('should pass events with undefined eventId to processor, and filter out non-matching FIs', async () => {
      const fiWithoutId = Object.keys(TENNIS_EVENTS).find(key => !TENNIS_EVENTS[key].id);
      const eventInfoWithoutId = TENNIS_EVENTS[fiWithoutId];

      const mockApiResponse = {
        results: [
          {
            FI: '999', // This FI is not in TENNIS_EVENTS and should be filtered out
            market1: { sp: { id: 101, name: 'Market A' } }
          },
          {
            FI: fiWithoutId.toString(), // This FI is in TENNIS_EVENTS but has no `id` property
            market2: { sp: { id: 102, name: 'Market B' } }
          }
        ]
      };
      
      fetchBet365Data.mockResolvedValue(mockApiResponse);
      processMarkets.mockReturnValue([]);
      
      await TennisPreMatchMarket(req, res);
      
      expect(processMarkets).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            FI: fiWithoutId.toString(),
            home: eventInfoWithoutId.home,
            away: eventInfoWithoutId.away,
            leagueId: eventInfoWithoutId.leagueId,
            eventId: undefined // Expect eventId to be undefined for this case
          })
        ])
      );
      // Ensure the non-matching FI was not passed to processMarkets
      expect(processMarkets).not.toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ FI: '999' })
        ])
      );
    });

    

    it('should handle empty enrichedEvents array', async () => {
      // Mock an API response with events that won't match any TARGET_FIS_TENNIS,
      // resulting in an empty `enrichedEvents` array after filtering.
      const mockApiResponse = {
        results: [{
          FI: '999', // Not in TARGET_FIS_TENNIS
          market1: { sp: { id: 1, name: 'Market' } }
        }]
      };
      
      fetchBet365Data.mockResolvedValue(mockApiResponse);
      processMarkets.mockReturnValue([]); // processMarkets will be called with an empty array
      PreMatchMarket.findOneAndUpdate.mockResolvedValue({
        id: 13,
        name: 'Tennis',
        count: 0,
        markets: []
      });
      
      await TennisPreMatchMarket(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 13,
          name: 'Tennis',
          count: 0,
          markets: []
        })
      );
    });
  });
});