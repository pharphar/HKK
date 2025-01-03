const express = require('express');
const router = express.Router();
const Game = require('../models/game');
const Player = require('../models/player');

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
    location: req.body.location,
    timestamp: new Date()
  });

  try {
    const newGame = await game.save();
    
    // Update player statistics
    for (const playerScore of game.playerScores) {
      const player = await Player.findOne({ name: playerScore.player });
      if (player) {
        await player.updateStats(playerScore.score);
      }
    }
    
    res.status(201).json(newGame);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a game
router.delete('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    await game.remove();
    res.json({ message: 'Game deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a game
router.patch('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (req.body.playerScores) game.playerScores = req.body.playerScores;
    if (req.body.location) game.location = req.body.location;

    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
