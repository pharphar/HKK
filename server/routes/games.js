const express = require('express');
const router = express.Router();
const Game = require('../models/game');

// Get all games
router.get('/', async (req, res) => {
  try {
    const games = await Game.find().sort({ timestamp: -1 });
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new game
router.post('/', async (req, res) => {
  const game = new Game({
    playerScores: req.body.playerScores,
    location: req.body.location
  });

  try {
    const newGame = await game.save();
    res.status(201).json(newGame);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
