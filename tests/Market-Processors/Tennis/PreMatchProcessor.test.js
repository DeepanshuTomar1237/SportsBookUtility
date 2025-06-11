const { processMarkets } = require('../../../market-processors/Tennis/PreMatchProcessor');

describe('TennisPreMatchMarketProcessor', () => {
  const mockEvent = {
    leagueId: 'WTA Parma WD',
    eventId: '25866',
    home: 'Santamaria/Tang',
    away: 'Cavalle-Reimers/Salden',
    main: {
      sp: {
        market1: { id: '101', name: 'Santamaria/Tang to Win' },
        market2: { id: '102', name: 'Cavalle-Reimers/Salden to Win' }
      }
    },
    other: {
      sp: {
        marketGroup: {
          sub1: { id: '103', name: 'Over 21.5 Games' },
          sub2: { id: '104', name: 'Under 21.5 Games' }
        }
      }
    }
  };

  it('should return empty array when events is empty', () => {
    expect(processMarkets([])).toEqual([]);
  });

  it('should skip events without leagueId or eventId', () => {
    expect(processMarkets([{ leagueId: '123' }, { eventId: '456' }])).toEqual([]);
  });

  it('should replace player names with Home/Away and consolidate markets', () => {
    const result = processMarkets([mockEvent]);
    const marketNames = result.map(m => m.name);
    const marketIds = result.map(m => m.id);

    expect(result.length).toBe(4);
    expect(marketNames).toEqual(
      expect.arrayContaining(['Home to Win', 'Away to Win', 'Over 21.5 Games', 'Under 21.5 Games'])
    );
    expect(marketIds).toEqual(expect.arrayContaining(['101', '102', '103', '104']));

    result.forEach(market => {
      expect(market.leagues).toContainEqual({
        id: '25866',
        name: 'WTA Parma WD'
      });
    });
  });

  it('should not duplicate league entries for same market', () => {
    const duplicateEvent = JSON.parse(JSON.stringify(mockEvent));
    const result = processMarkets([mockEvent, duplicateEvent]);
    result.forEach(m => expect(m.leagues.length).toBe(1));
  });

  it('should skip invalid section without sp (line 15 false case)', () => {
    const event = {
      leagueId: 'WTA League',
      eventId: '9999',
      home: 'Player1',
      away: 'Player2',
      dummy: { foo: 'bar' } // no `.sp` key
    };
    const result = processMarkets([event]);
    expect(result).toEqual([]);
  });

  it('should skip null marketData (line 32)', () => {
    const event = {
      leagueId: 'Test League',
      eventId: '123',
      home: 'Home',
      away: 'Away',
      main: {
        sp: {
          market1: null
        }
      }
    };
    const result = processMarkets([event]);
    expect(result).toEqual([]);
  });

  it('should process only valid nested subMarkets (line 50-53)', () => {
    const event = {
      leagueId: 'ATP League',
      eventId: '789',
      home: 'Player A',
      away: 'Player B',
      section: {
        sp: {
          nested: {
            sub1: { id: '201', name: 'Player A to Win' },
            sub2: null,
            sub3: { name: 'Missing ID' },
            sub4: { id: '202' }
          }
        }
      }
    };

    const result = processMarkets([event]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('201');
    expect(result[0].name).toBe('Home to Win');
  });
});
