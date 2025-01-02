const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  playerScores: [{
    player: String,
    score: Number
  }],
  location: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Game', gameSchema);
