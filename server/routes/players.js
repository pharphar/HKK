const express = require('express');
const router = express.Router();
const Player = require('../models/player');

// Get all players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find().sort({ name: 1 });
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new player
router.post('/', async (req, res) => {
  const player = new Player({
    name: req.body.name
  });

  try {
    // Check if player already exists
    const existingPlayer = await Player.findOne({ name: req.body.name });
    if (existingPlayer) {
      return res.status(400).json({ message: 'Player already exists' });
    }

    const newPlayer = await player.save();
    res.status(201).json(newPlayer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get player stats
router.get('/:id/stats', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    const stats = {
      name: player.name,
      totalGames: player.totalGames,
      wins: player.wins,
      averagePosition: player.averagePosition,
      winPercentage: player.totalGames > 0 ? (player.wins / player.totalGames * 100).toFixed(1) : 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a player
router.delete('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    await player.remove();
    res.json({ message: 'Player deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
