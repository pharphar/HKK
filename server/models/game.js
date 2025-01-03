const gameSchema = new mongoose.Schema({
  playerScores: [{
    player: {
      type: String,
      required: true
    },
    points: {  // Changed from 'score' to 'points'
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
  gameDate: {  // Added game date field
    type: Date,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});
