// models/sharedModels.js
const mongoose = require('mongoose');

const SportsbookSchema = new mongoose.Schema({
  // Your sportsbook schema definition
}, { collection: 'sportsbook' });

module.exports = {
  Sportsbook: mongoose.model('Sportsbook', SportsbookSchema)
};