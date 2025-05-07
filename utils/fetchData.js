// utils\fetchData.js
const axios = require('axios');

const fetchOddsData = async () => {
  const url = 'https://betsapi.com/docs/samples/bet365_prematch_odds.json';
  const response = await axios.get(url);
  return response.data;
};

module.exports = {
  fetchOddsData,
};
