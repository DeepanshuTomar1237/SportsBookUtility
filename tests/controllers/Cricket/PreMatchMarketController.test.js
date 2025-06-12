// tests/controllers/Cricket/PreMatchMarketController.test.js

const { CricketPreMatchMarket } = require('../../../controllers/Cricket/PreMatchMarketController');
const CricketPreMatchMarketModel = require('../../../models/CRICKET/PreMatchMarket');
const { fetchBet365Data } = require('../../../utils/api');
const { TARGET_FIS_CRICKET } = require('../../../constants/bookmakers');

jest.mock('../../../models/CRICKET/PreMatchMarket');
jest.mock('../../../utils/api');

describe('CricketPreMatchMarket Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should return 404 if no results are returned from fetchBet365Data', async () => {
    fetchBet365Data.mockResolvedValue({ results: [] });

    await CricketPreMatchMarket(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No events found' });
  });

  it('should store and return processed markets successfully', async () => {
    const mockEvent = {
      FI: TARGET_FIS_CRICKET[0],
      main: {
        sp: {
          market1: { id: '1', name: 'Match Winner' }
        }
      }
    };

    fetchBet365Data.mockResolvedValue({
      results: [mockEvent]
    });

    const mockSavedDoc = {
      sportId: 3,
      name: "Cricket",
      markets: [{ id: '1', name: 'Match Winner' }]
    };

    CricketPreMatchMarketModel.findOneAndUpdate.mockResolvedValue(mockSavedDoc);

    await CricketPreMatchMarket(req, res);

    expect(fetchBet365Data).toHaveBeenCalledWith(TARGET_FIS_CRICKET);
    expect(CricketPreMatchMarketModel.findOneAndUpdate).toHaveBeenCalledWith(
      { sportId: 3 },
      expect.objectContaining({
        id: 3,
        name: "Cricket",
        count: 1,
        markets: [{ id: '1', name: 'Match Winner' }]
      }),
      { upsert: true, new: true }
    );
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 3,
        name: 'Cricket',
        count: 1,
        markets: expect.any(Array),
      })
    ]);
  });

  it('should handle database save error', async () => {
    const mockEvent = {
      FI: TARGET_FIS_CRICKET[0],
      main: {
        sp: {
          market1: { id: '1', name: 'Match Winner' }
        }
      }
    };

    fetchBet365Data.mockResolvedValue({ results: [mockEvent] });
    CricketPreMatchMarketModel.findOneAndUpdate.mockRejectedValue(new Error('DB save failed'));

    await CricketPreMatchMarket(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Database operation failed',
      details: 'DB save failed'
    });
  });

  it('should handle unexpected API error', async () => {
    fetchBet365Data.mockRejectedValue(new Error('Fetch failed'));

    await CricketPreMatchMarket(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to process Cricket markets',
      details: 'Fetch failed'
    });
  });
});
