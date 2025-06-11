// tests\controllers\FootballIceHockeyCombinedOddsController.test.js
const { getCombinedSportsOdds } = require('../../controllers/FootballIceHockeyCombinedOddsController');
const PreMatchOdds = require('../../models/Football/PreMatchOdds');
const IceHockeyPreMatchOdds = require('../../models/ICE_HOCKEY/PreMatchOdds');
const CommonOdds = require('../../models/CommonFootballandIceHockeyOdds');

jest.mock('../../models/Football/PreMatchOdds');
jest.mock('../../models/ICE_HOCKEY/PreMatchOdds');
jest.mock('../../models/CommonFootballandIceHockeyOdds');

describe('getCombinedSportsOdds', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // ... other tests remain the same ...

  it('should handle database errors', async () => {
    const error = new Error('DB Error');
    PreMatchOdds.findOne.mockRejectedValue(error);

    await getCombinedSportsOdds(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to fetch combined sports odds from database',
      details: 'DB Error',
      stack: undefined
    });
  });

  it('should include stack trace in development environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('DB Error');
    PreMatchOdds.findOne.mockRejectedValue(error);

    await getCombinedSportsOdds(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      stack: expect.any(String)
    }));

    process.env.NODE_ENV = originalEnv;
  });

  
  // Test 2: Only football data available
  it('should return only football markets when no ice hockey data', async () => {
    const footballData = {
      PRE_MATCH_MARKETS: [{
        id: '1',
        name: 'Match Winner',
        odds: [{ id: '1', name: 'Home', odds: 1.8 }]
      }],
      total_markets: 1
    };
    PreMatchOdds.findOne.mockResolvedValue(footballData);
    IceHockeyPreMatchOdds.findOne.mockResolvedValue(null);

    await getCombinedSportsOdds(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'No common markets found between football and ice hockey'
    }));
  });


  it('should return 404 if no data found for both sports', async () => {
    PreMatchOdds.findOne.mockResolvedValue(null);
    IceHockeyPreMatchOdds.findOne.mockResolvedValue(null);
  
    await getCombinedSportsOdds(req, res);
  
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No odds data found for any sport in database'
    });
  });
  

  // Test 3: Only ice hockey data available
  it('should return only ice hockey markets when no football data', async () => {
    const iceHockeyData = {
      markets: [{
        id: '2',
        name: 'Game Winner',
        odds: [{ id: '1', name: 'Home', odds: 2.0 }]
      }],
      count: 1
    };
    PreMatchOdds.findOne.mockResolvedValue(null);
    IceHockeyPreMatchOdds.findOne.mockResolvedValue(iceHockeyData);

    await getCombinedSportsOdds(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'No common markets found between football and ice hockey'
    }));
  });

  // Test 4: Common markets found
  it('should combine common markets from both sports', async () => {
    const footballData = {
      PRE_MATCH_MARKETS: [{
        id: '1',
        name: 'Match Winner',
        odds: [{ id: '1', name: 'Home', odds: 1.8, team: 'home' }]
      }],
      total_markets: 1
    };
    const iceHockeyData = {
      markets: [{
        id: '1',
        name: 'Game Winner',
        odds: [{ id: '1', name: 'Home', odds: 2.0, team: 'home' }]
      }],
      count: 1
    };
    PreMatchOdds.findOne.mockResolvedValue(footballData);
    IceHockeyPreMatchOdds.findOne.mockResolvedValue(iceHockeyData);

    await getCombinedSportsOdds(req, res);

    expect(res.json).toHaveBeenCalledWith([{
      football_market_id: '1',
      ice_hockey_market_id: '1',
      name: 'Match Winner',
      Football: {
        odds: [{
          id: '1',
          name: 'Home',
          odds: 1.8,
          team: 'home'
        }]
      },
      'ice-hockey': {
        odds: [{
          id: '1',
          name: 'Home',
          odds: 2.0,
          team: 'home'
        }]
      }
    }]);
  });

  // Test 5: Database error handling
  it('should handle database errors', async () => {
    PreMatchOdds.findOne.mockRejectedValue(new Error('DB Error'));

    await getCombinedSportsOdds(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to fetch combined sports odds from database',
      details: 'DB Error',
    //   stack: expect.anything()
    });
  });

  // Test 6: Should save combined markets to CommonOdds
  it('should save combined markets to CommonOdds collection', async () => {
    const footballData = {
      PRE_MATCH_MARKETS: [{
        id: '1',
        name: 'Match Winner',
        odds: [{ id: '1', name: 'Home', odds: 1.8 }]
      }],
      total_markets: 1
    };
    const iceHockeyData = {
      markets: [{
        id: '1',
        name: 'Game Winner',
        odds: [{ id: '1', name: 'Home', odds: 2.0 }]
      }],
      count: 1
    };
    PreMatchOdds.findOne.mockResolvedValue(footballData);
    IceHockeyPreMatchOdds.findOne.mockResolvedValue(iceHockeyData);
    CommonOdds.findOneAndUpdate.mockResolvedValue({});

    await getCombinedSportsOdds(req, res);

    expect(CommonOdds.findOneAndUpdate).toHaveBeenCalled();
  });
  

  // Test 7: Should handle optional fields correctly
  it('should handle markets with optional fields', async () => {
    const footballData = {
      PRE_MATCH_MARKETS: [{
        id: '1',
        name: 'Handicap',
        odds: [{
          id: '1',
          name: 'Home +1',
          odds: 1.5,
          handicap: '+1',
          header: 'H1'
        }]
      }],
      total_markets: 1
    };
    const iceHockeyData = {
      markets: [{
        id: '1',
        name: 'Puck Line',
        odds: [{
          id: '1',
          name: 'Home +1.5',
          odds: 1.8,
          handicap: '+1.5',
          corner: '1st'
        }]
      }],
      count: 1
    };
    PreMatchOdds.findOne.mockResolvedValue(footballData);
    IceHockeyPreMatchOdds.findOne.mockResolvedValue(iceHockeyData);

    await getCombinedSportsOdds(req, res);

    expect(res.json).toHaveBeenCalledWith([expect.objectContaining({
      Football: {
        odds: [expect.objectContaining({
          handicap: '+1',
          header: 'H1'
        })]
      },
      'ice-hockey': {
        odds: [expect.objectContaining({
          handicap: '+1.5',
          corner: '1st'
        })]
      }
    })]);
  });
});