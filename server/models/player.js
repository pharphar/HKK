const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  totalGames: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  },
  averagePosition: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add method to update player statistics
playerSchema.methods.updateStats = async function(position) {
  this.totalGames += 1;
  if (position === 1) this.wins += 1;
  
  // Update average position
  const oldTotal = (this.totalGames - 1) * this.averagePosition;
  this.averagePosition = (oldTotal + position) / this.totalGames;
  
  await this.save();
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
