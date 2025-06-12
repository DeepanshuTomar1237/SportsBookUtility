const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const CommonOdds = require('../../models/CommonFootballandIceHockeyOdds');
const { add } = require('lodash');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await CommonOdds.deleteMany({});
});

describe('CommonFootballandIceHockeyOdds Model', () => {
  const sampleData = {
    football_market_id: 'f123',
    ice_hockey_market_id: 'h456',
    name: '1X2',
    Football: {
      odds: [
        {
          id: '1',
          odds: 1.5,
          name: 'Team A to Win',
          handicap: '0',
          header: 'Full Time',
          team: 'A',
        }
      ]
    },
    'ice-hockey': {
      odds: [
        {
          id: '2',
          odds: '2.3',
          name: 'Team B to Win',
          corner: 'Yes'
        }
      ]
    }
  };

  it('should create and save successfully', async () => {
    const doc = new CommonOdds(sampleData);
    const saved = await doc.save();

    expect(saved._id).toBeDefined();
    expect(saved.name).toBe('1X2');
    expect(saved.Football.odds.length).toBe(1);
    expect(saved['ice-hockey'].odds.length).toBe(1);
    expect(saved.updatedAt).toBeDefined();
  });

  it('should not allow duplicate football & ice hockey market ids', async () => {
    await CommonOdds.create(sampleData);
    await expect(CommonOdds.create(sampleData)).rejects.toThrow(/duplicate key error/);
  });

  it('should require football_market_id, ice_hockey_market_id, and name', async () => {
    const invalid = new CommonOdds({});
    let err;
    try {
      await invalid.validate();
    } catch (e) {
      err = e;
    }
    expect(err.errors.football_market_id).toBeDefined();
    expect(err.errors.ice_hockey_market_id).toBeDefined();
    expect(err.errors.name).toBeDefined();
  });

  it('should support odds with different types (number or string)', async () => {
    const customData = JSON.parse(JSON.stringify(sampleData));
    customData.Football.odds[0].odds = '1.75'; // string
    const doc = new CommonOdds(customData);
    const saved = await doc.save();
    expect(saved.Football.odds[0].odds).toBe('1.75');
  });

  it('should update `updatedAt` field on save', async () => {
    const doc = await CommonOdds.create(sampleData);
    const initialUpdatedAt = doc.updatedAt;

    // Wait 1 second to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 1000));

    doc.name = 'Updated Market';
    await doc.save();

    expect(doc.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
  });
});

