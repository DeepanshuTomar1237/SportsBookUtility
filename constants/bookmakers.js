const TENNIS_EVENTS = {
  '174724515': { home: 'Rodrigo Alujas', away: 'Lucas Poullain', leagueId: 'ITF M15 Heraklion' },
  '174730925': { home: 'Jack Loge', away: 'Andrej Nedic', leagueId: 'ITF M15 Prijedor' }

};

module.exports = {
  // Tennis event IDs with metadata
  TENNIS_EVENTS,
  
  // Tennis event IDs array
  TARGET_FIS_TENNIS: Object.keys(TENNIS_EVENTS),

  TENNIS_LIVE_EVENT_IDS: [
    '174705956', '174371853'
  ],
  
  // Other sport IDs
  TARGET_FIS: [
    '174229112', '174187790', '174277015', '173889141',
    '174217277', '173889464', '173447755', '174570394'
  ],
  
  FOOTBALL_DEFAULT_EVENT_IDS: [
    '174371853', '174371105', '174371107', '174371109', 
    '174371857', '174694844', '174373701', '174371111', 
    '174371113', '174373737', '174374268', '174374281', 
    '174648255', '174753948', '174371187', '174622687',
    '174621228', '174648461', '174564892', '174621220'
  ],
  
  TARGET_FIS_HOCKEY: [
    '173452579', '173452585', '173452576'
  ]
};


