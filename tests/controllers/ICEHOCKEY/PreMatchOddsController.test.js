// Unit tests for IceHockey PreMatchOdds Controller

const httpMocks = require('node-mocks-http');
const IceHockeyPreMatchOddsController = require('../../../controllers/ICE_HOCKEY/PreMatchOddsController');
const IceHockeyPreMatchOdds = require('../../../models/ICE_HOCKEY/PreMatchOdds');
const { fetchBet365Data } = require('../../../utils/api');
const PreMatchOddsProcessor = require('../../../market-processors/Common/PreMatchOddsProcessor');
const { TARGET_FIS_HOCKEY } = require('../../../constants/bookmakers');

// Mocks
jest.mock('../../../utils/api');
jest.mock('../../../models/ICE_HOCKEY/PreMatchOdds');
jest.mock('../../../market-processors/Common/PreMatchOddsProcessor');

describe('IceHockeyPreMatchOdds Controller', () => {
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

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

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual([mockSavedData]);
    expect(fetchBet365Data).toHaveBeenCalledWith(TARGET_FIS_HOCKEY);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully stored'));
  });

  test('should handle empty markets array gracefully', async () => {
    const mockRawData = [{ eventId: '999', odds: null }];
    const mockProcessedData = { PRE_MATCH_MARKETS: [], total_markets: 0 };

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

  test('should return 404 if processor returns error (invalid data)', async () => {
    const mockRawData = [{ eventId: '456', invalid: 'data' }];
    const mockProcessedData = { error: 'Invalid odds format' };

    fetchBet365Data.mockResolvedValue(mockRawData);
    PreMatchOddsProcessor.process.mockReturnValue(mockProcessedData);

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._getJSONData()).toEqual({ error: 'Invalid odds format' });
  });

  test('should return 500 if API call fails', async () => {
    fetchBet365Data.mockRejectedValue(new Error('API timeout'));

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({
      error: 'API timeout',
      details: 'API timeout'
    });
  });

  test('should handle API error object without message field', async () => {
    fetchBet365Data.mockRejectedValue({});

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    await IceHockeyPreMatchOddsController.IceHockeyPreMatchOdds(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({
      error: 'Failed to process Ice Hockey odds',
      details: undefined
    });
  });

  test('should log DB error and still return processed data', async () => {
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

    expect(errorSpy).toHaveBeenCalledWith('MongoDB error:', 'DB full');
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual([{
      id: 17,
      name: 'IceHockey',
      count: 1,
      markets: mockProcessedData.PRE_MATCH_MARKETS
    }]);
  });
});
