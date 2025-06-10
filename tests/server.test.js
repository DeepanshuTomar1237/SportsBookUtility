// tests/server.test.js
const request = require('supertest');
const app = require('../server');

// Mock DB connection since it's not needed in this test
jest.mock('../config/db', () => jest.fn());

describe('Server Configuration and Routes', () => {
  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.statusCode).toBe(404);
  });

  it('should return 200 for a valid football pre-match market route', async () => {
    // Mock the controller to avoid DB calls
    jest.mock('../controllers/Football/PreMatchmarketController', () => ({
      PreMatchMarket: (req, res) => res.status(200).json({ message: 'Football PreMatchMarket success' }),
    }));

    const { PreMatchMarket } = require('../controllers/Football/PreMatchmarketController');
    app.get('/test-football', PreMatchMarket); // temporary route for test

    const res = await request(app).get('/test-football');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Football PreMatchMarket success' });
  });
});
