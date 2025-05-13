// controllers/Football/PreMatchMarket.js
const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const TARGET_FIS = [
  '174229112', '174187790', '174277015',
  '173889141', '174217277', '173889464'
];

const DB_NAME = 'sportbook';
const COLLECTION_NAME = 'prematch_football';

exports.PreMatchMarket = async (req, res) => {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log(' Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Fetch from Bet365 API
    const response = await axios.get(process.env.BET365_API_URL, {
      params: {
        token: process.env.BET365_API_TOKEN,
        FI: TARGET_FIS.join(','),
      },
      timeout: 10000,
      paramsSerializer: (params) =>
        Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&'),
    });

    if (!response.data?.results?.length) {
      return res.status(404).json({
        error: 'No events found',
        request: { FIs: TARGET_FIS },
      });
    }

    const consolidatedMarkets = processEventsByEvent(response.data.results);

    // Count total markets
    const totalMarkets = consolidatedMarkets.reduce((sum, event) => {
      return sum + (event.markets?.length || 0);
    }, 0);

    const result = {
      events: consolidatedMarkets,
      meta: {
        total_events: consolidatedMarkets.length,
        total_markets: totalMarkets,
      },
    };

    // Insert into MongoDB
    const document = {
      data: result,
      originalEventIds: TARGET_FIS,
      fetchedAt: new Date(), // timestamp
    };

    const insertResult = await collection.insertOne(document);

    if (insertResult.insertedId) {
      console.log(` Data inserted with _id: ${insertResult.insertedId}`);
      return res.json(result);
    } else {
      console.error(' Failed to insert data');
      return res.status(500).json({ error: 'Failed to store data in MongoDB' });
    }

  } catch (error) {
    console.error('⚠️ API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
    });

    res.status(500).json({
      error: 'Failed to fetch or store data',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack,
      }),
    });

  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
};


// --- Helpers ---

function processEventsByEvent(events) {
  const targetFiSet = new Set(TARGET_FIS);
  const result = [];

  for (const event of events) {
    if (!targetFiSet.has(event.FI?.toString())) continue;

    const eventMarkets = {};
    const sections = [
      event.asian_lines,
      event.goals,
      event.main,
      event.half,
      event.minutes,
      event.specials,
      event.corners,
      ...(Array.isArray(event.others) ? event.others : []),
    ];

    for (const section of sections) {
      processSection(section, eventMarkets);
    }

    const deduplicatedMarkets = Object.values(deduplicateMarkets(eventMarkets));

    if (deduplicatedMarkets.length > 0) {
      result.push({
        eventId: event.FI,
        eventName: event.NA || '',
        markets: deduplicatedMarkets,
      });
    }
  }

  return result;
}

function processSection(sectionData, consolidatedMarkets) {
  if (!sectionData?.sp) return;

  for (const marketData of Object.values(sectionData.sp)) {
    if (!marketData) continue;

    if (marketData.id && marketData.name) {
      addMarket(marketData, consolidatedMarkets);
    } else {
      for (const subMarketData of Object.values(marketData)) {
        if (subMarketData?.id && subMarketData?.name) {
          addMarket(subMarketData, consolidatedMarkets);
        }
      }
    }
  }
}

function addMarket(marketData, consolidatedMarkets) {
  const marketId = marketData.id.toString();
  const marketName = marketData.name;
  const marketKey = `${marketId}_${marketName}`;

  if (!consolidatedMarkets[marketKey]) {
    consolidatedMarkets[marketKey] = {
      id: marketId,
      name: marketName,
      odds: [],
    };
  }

  if (Array.isArray(marketData.odds) && marketData.odds.length > 0) {
    consolidatedMarkets[marketKey].odds.push(
      ...marketData.odds.map((odd) => ({
        id: odd.id,
        odds: odd.odds,
        header: odd.header,
        name: odd.name,
        handicap: odd.handicap,
      }))
    );
  }
}

function deduplicateMarkets(markets) {
  const result = {};

  for (const [key, market] of Object.entries(markets)) {
    const seenOdds = new Set();

    market.odds = market.odds.filter((odd) => {
      if (!odd.id || seenOdds.has(odd.id)) return false;
      seenOdds.add(odd.id);
      return true;
    });

    if (market.odds.length > 0) {
      result[key] = market;
    }
  }

  return result;
}
