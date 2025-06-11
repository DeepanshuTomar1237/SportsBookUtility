// tests/market-processors/Tennis/PreMatchOdds.test.js
const TennisPreMatchMarketProcessor = require('../../../market-processors/Tennis/PreMatchOdds');

describe('TennisPreMatchMarketProcessor', () => {
  describe('process', () => {
    it('should return empty array for empty events input', () => {
      const result = TennisPreMatchMarketProcessor.process([]);
      expect(result).toEqual([]);
    });

    // it('should skip events missing required fields', () => {
    //   const events = [
    //     { leagueId: '123', eventId: '456', home: 'A', away: 'B', main: { sp: { market1: { id: '1', name: 'A vs B', odds: { home: 1.5 } } } } },
    //     { leagueId: '123' }, // missing eventId
    //     { eventId: '456' }, // missing leagueId
    //     null,
    //     undefined
    //   ];

    //   const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    //   const result = TennisPreMatchMarketProcessor.process(events);

    //   expect(result.length).toBeGreaterThan(0);
    //   expect(consoleSpy).toHaveBeenCalledTimes(3);
    //   consoleSpy.mockRestore();
    // });

    it('should call processSection only if section?.sp is true', () => {
      const events = [{
        leagueId: '123',
        eventId: '456',
        home: 'A',
        away: 'B',
        main: { noSp: true }, // should be skipped
        specials: { sp: { market1: { id: '1', name: 'A vs B', odds: { home: 1.5 } } } }
      }];
      const result = TennisPreMatchMarketProcessor.process(events);
      expect(result.length).toBe(1); // market1 should be processed
    });

    it('should replace home/away with "Home"/"Away" in market name', () => {
      const events = [{
        leagueId: '123',
        eventId: '456',
        home: 'Nadal',
        away: 'Djokovic',
        main: {
          sp: {
            market1: {
              id: '1',
              name: 'Nadal vs Djokovic - Match Winner',
              odds: { home: 1.7, away: 2.1 }
            }
          }
        }
      }];

      const result = TennisPreMatchMarketProcessor.process(events);
      expect(result[0].name).toBe('Home vs Away - Match Winner');
    });

    it('should not add duplicate league IDs to a market', () => {
      const event = {
        leagueId: 'ATP',
        eventId: '1',
        home: 'A',
        away: 'B',
        main: {
          sp: {
            market1: {
              id: '1',
              name: 'Market A vs B',
              odds: { home: 1.5 }
            }
          }
        }
      };

      const events = [event, { ...event }]; // duplicate
      const result = TennisPreMatchMarketProcessor.process(events);
      expect(result[0].leagues).toHaveLength(1); // should not duplicate
    });
  });

  describe('getEventSections', () => {
    // it('should return empty array if no sections with sp', () => {
    //   const event = { id: '1', main: {}, others: [] };
    //   const result = TennisPreMatchMarketProcessor.getEventSections(event);
    //   expect(result).toEqual([]);
    // });
    

    it('should return combined and deduplicated sections with sp', () => {
      const section = { sp: { market: {} } };
      const event = {
        main: section,
        specials: section,
        others: [section, {}],
        games: section
      };
      const result = TennisPreMatchMarketProcessor.getEventSections(event);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('processSection', () => {
    const mockEvent = {
      leagueId: 'ATP',
      eventId: '1',
      home: 'Player A',
      away: 'Player B'
    };

    it('should skip markets without id or name', () => {
      const section = {
        sp: {
          m1: { id: '1' },
          m2: { name: 'Market' },
          m3: null
        }
      };

      const markets = {};
      TennisPreMatchMarketProcessor.processSection(section, markets, mockEvent, true);
      expect(Object.keys(markets)).toHaveLength(0);
    });

    it('should process valid market and extract odds', () => {
      const section = {
        sp: {
          market1: { id: '1', name: 'Home vs Away - Match Winner', odds: { home: 1.5, away: 2.0 } }
        }
      };

      const markets = {};
      TennisPreMatchMarketProcessor.processSection(section, markets, mockEvent, true);
      const key = '1_Home vs Away - Match Winner';
      expect(markets[key].odds).toEqual({ home: 1.5, away: 2.0 });
    });

    it('should skip odds if includeOdds is false', () => {
      const section = {
        sp: {
          market1: { id: '1', name: 'Market A', odds: { home: 1.5 } }
        }
      };
      const markets = {};
      TennisPreMatchMarketProcessor.processSection(section, markets, mockEvent, false);
      expect(markets['1_Market A'].odds).toBeNull();
    });

    it('should handle nested markets', () => {
      const section = {
        sp: {
          market1: {
            id: '1',
            name: 'Parent',
            sp: {
              child1: { id: '1.1', name: 'Child 1', odds: { yes: 1.4 } },
              child2: { id: '1.2', name: 'Child 2' }
            }
          }
        }
      };

      const markets = {};
      TennisPreMatchMarketProcessor.processSection(section, markets, mockEvent, true);
      expect(markets['1.1_Child 1'].odds).toEqual({ yes: 1.4 });
      expect(markets['1.2_Child 2'].odds).toBeNull();
    });
  });

  describe('extractOdds', () => {
    it('should return direct odds if present', () => {
      const market = { odds: { home: 1.5 } };
      const result = TennisPreMatchMarketProcessor.extractOdds(market);
      expect(result).toEqual({ home: 1.5 });
    });

    it('should extract from sp sub-markets', () => {
      const market = {
        sp: {
          home: { odds: 1.8 },
          away: { odds: 2.0 }
        }
      };
      const result = TennisPreMatchMarketProcessor.extractOdds(market);
      expect(result).toEqual({ home: 1.8, away: 2.0 });
    });

    it('should return empty if no odds found', () => {
      const market = { sp: { home: {}, away: {} } };
      const result = TennisPreMatchMarketProcessor.extractOdds(market);
      expect(result).toEqual({});
    });
  });

  describe('escapeRegExp', () => {
    it('should escape regex characters correctly', () => {
      const input = 'Player.*+?^${}()|[]\\';
      const output = TennisPreMatchMarketProcessor.escapeRegExp(input);
      expect(output).toBe('Player\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });
  });
});
