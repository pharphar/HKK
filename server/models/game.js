const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  playerScores: [{
    player: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    }
  }],
  location: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Validate that there are exactly 4 players
gameSchema.pre('save', function(next) {
  if (this.playerScores.length !== 4) {
    next(new Error('A game must have exactly 4 players'));
  }
  next();
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
