// tests/controllers/Tennis/PreMatchMarketController.test.js
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
  let originalNodeEnv;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Store original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
    // Set NODE_ENV to development for tests that expect detailed errors
    process.env.NODE_ENV = 'development';

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original NODE_ENV after each test
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('Successful data processing', () => {
    it('should process tennis prematch markets successfully', async () => {
      // Mock API response - use a FI that has complete metadata
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
      
      // Mock processed markets
      const mockProcessedMarkets = [
        { id: '1', name: 'Match Winner', leagues: [] }
      ];
      processMarkets.mockReturnValue(mockProcessedMarkets);
      
      // Mock database update
      const mockDbResponse = {
        id: 13,
        name: 'Tennis',
        count: 1,
        markets: mockProcessedMarkets
      };
      PreMatchMarket.findOneAndUpdate.mockResolvedValue(mockDbResponse);
      
      await TennisPreMatchMarket(req, res);
      
      // Verify API was called with correct parameters
      expect(fetchBet365Data).toHaveBeenCalledWith(TARGET_FIS_TENNIS);
      
      // Verify markets were processed
      expect(processMarkets).toHaveBeenCalled();
      
      // Verify database was updated
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
      
      // Verify response
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
        details: mockError.message // Now expects the message due to NODE_ENV='development'
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
        details: mockError.message // Now expects the message due to NODE_ENV='development'
      });
    });
  });

  describe('Data enrichment', () => {
    it('should correctly enrich events with metadata', async () => {
      // Use a FI that has an 'id' property in TENNIS_EVENTS
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
      
      // Verify the processor was called with enriched event
      expect(processMarkets).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            FI: fiWithId.toString(),
            home: eventInfo.home,
            away: eventInfo.away,
            leagueId: eventInfo.leagueId,
            eventId: eventInfo.id // This should now be present
          })
        ])
      );
    });
    
    it('should pass events with undefined eventId to processor, and filter out non-matching FIs', async () => {
        // Find a FI that exists in TENNIS_EVENTS but DOES NOT have an 'id' property defined
        const fiWithoutId = Object.keys(TENNIS_EVENTS).find(key => !TENNIS_EVENTS[key].id);
        const eventInfoWithoutId = TENNIS_EVENTS[fiWithoutId];

        const mockApiResponse = {
            results: [
              {
                FI: '999', // This FI is NOT in TARGET_FIS_TENNIS, so the controller will filter it out (map to null -> filter(Boolean))
                market1: { sp: { id: 101, name: 'Market A' } }
              },
              {
                FI: fiWithoutId.toString(), // This FI is in TARGET_FIS_TENNIS, but TENNIS_EVENTS[fiWithoutId] has no 'id'
                market2: { sp: { id: 102, name: 'Market B' } }
              }
            ]
          };
      
      fetchBet365Data.mockResolvedValue(mockApiResponse);
      
      await TennisPreMatchMarket(req, res);
      
      // The controller will process TARGET_FIS_TENNIS.
      // For the entry corresponding to '999', it will result in `null` after the `find`, and be removed by `filter(Boolean)`.
      // For the entry corresponding to `fiWithoutId`, it will be enriched, but `eventId` will be `undefined`.
      // This enriched object (with `eventId: undefined`) IS PASSED to `processMarkets`.
      expect(processMarkets).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            FI: fiWithoutId.toString(),
            home: eventInfoWithoutId.home,
            away: eventInfoWithoutId.away,
            leagueId: eventInfoWithoutId.leagueId,
            eventId: undefined // This is the expected state for this event
          })
        ])
      );

      // Optionally, you can assert that `processMarkets` was NOT called with the '999' event
      expect(processMarkets).not.toHaveBeenCalledWith(
          expect.arrayContaining([
              expect.objectContaining({ FI: '999' })
          ])
      );
    });
  });
});
