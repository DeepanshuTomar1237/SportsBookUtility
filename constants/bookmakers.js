// constants\bookmakers.js
const TENNIS_EVENTS = {
  '174726738': { home: 'Laia Petretic', away: 'Valeria Bhunu', leagueId: 'ITF M15 Heraklion', id: "13829" },
  '174736958': { home: 'Yunchaokete Bu', away: 'Francesco Passaro', leagueId: 'Challenger Turin', id:"28962" },
  '174733915': { home: 'Santamaria/Tang', away: 'Cavalle-Reimers/Salden', leagueId: 'WTA Parma WD', id:"25866" },
  '174733310': { home: 'Sean Hodkin', away: 'Santiago Franchini', leagueId: 'UTR Pro Carvoeiro', id:"40171" },
  '174737535': { home: 'Anastasija Arsic', away: 'Sara Gvozdenovic', leagueId: 'UTR Pro Carvoeiro Women', id:"40172" },
  '174625098': { home: 'Hageman/Yesypchuk', away: 'SantiSara GvozdenovicKrook/Mol', leagueId: 'ITF W15 Kotka WD' },
  '174726734': { home: 'Ella Mcdonald', away: 'Ekaterina Khayrutdinova', leagueId: 'ITF W15 ,Monastir', id: "40172" },
  '174726762': { home: 'Lucy Murphy', away: 'Aneta Novakova', leagueId: 'WTA 1000, Madrid', id: '40200' },
  '174726761': { home: 'Brooklyn Price', away: 'Amina Sadiq', leagueId: 'ITF W15, Lagos', id: '40199' },

};



// const TENNIS_LIVE_EVENT_IDS = {
//   '174726738': { home: 'Laia Petretic', away: 'Valeria Bhunu', leagueId: 'ITF M15 Heraklion', id: "13829" },
//   '174736958': { home: 'Yunchaokete Bu', away: 'Francesco Passaro', leagueId: 'Challenger Turin', id:"28962" },

// };

module.exports = {
  // Tennis event IDs with metadata
  TENNIS_EVENTS,
  
  // Tennis event IDs array
  TARGET_FIS_TENNIS: Object.keys(TENNIS_EVENTS),

  TENNIS_LIVE_EVENT_IDS: [
    '175159945', '174371853'
  ],
  
  // Other sport IDs
  TARGET_FIS: [
    '174229112', '174187790', '174277015', '173889141',
    '174217277', '173889464', '173447755', '174570394'
  ],
  
  ICE_HOCKEY_DEFAULT_EVENT_IDS: [
    '174494261', '174494264'
  ],
  
  FOOTBALL_DEFAULT_EVENT_IDS: [
    '174653447', '175097520', '174371107', '174371109', 
    '174371857', '174694844', '174373701', '174371111', 
    '174371113', '174373737', '174374268', '174374281', 
    '174648255', '174753948', '174371187', '174622687',
    '174621228', '174648461', '174564892', '174621220'
  ],

  TARGET_FIS_HOCKEY: [
    // '173452579', '173452585', '173452576',
    '173452579', '173452585', '173452576', '173452593', '174209613'
  ],

  TARGET_FIS_CRICKET : [
    '175236983', '175248350','175248351','175211124','175214371','174883835','175160896','174882668'
  ]
};




                                                                                                                                                                                                                                                                                    