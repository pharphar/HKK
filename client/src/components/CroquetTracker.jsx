import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Plus, User, Trophy, Pencil } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CroquetTracker = () => {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [games, setGames] = useState([]);
  const [isRecordingGame, setIsRecordingGame] = useState(false);
  const [editingGameIndex, setEditingGameIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentGame, setCurrentGame] = useState({
    playerScores: [],
    location: '',
    timestamp: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [playersRes, gamesRes] = await Promise.all([
        fetch(`${API_URL}/players`),
        fetch(`${API_URL}/games`)
      ]);

      const playersData = await playersRes.json();
      const gamesData = await gamesRes.json();

      setPlayers(playersData.map(p => p.name));
      setGames(gamesData.map(game => ({
        ...game,
        timestamp: new Date(game.timestamp)
      })));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPlayer = async () => {
    if (newPlayerName.trim() && !players.includes(newPlayerName.trim()) && players.length < 4) {
      try {
        const response = await fetch(`${API_URL}/players`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newPlayerName.trim() }),
        });

        if (response.ok) {
          setPlayers([...players, newPlayerName.trim()]);
          setNewPlayerName('');
        }
      } catch (error) {
        console.error('Error adding player:', error);
      }
    }
  };

  // Rest of your existing functions remain the same
  // Just update recordGame to use the new API:

  const recordGame = async () => {
    if (currentGame.playerScores.length === 4 && currentGame.location) {
      try {
        const response = await fetch(`${API_URL}/games`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentGame),
        });

        if (response.ok) {
          const savedGame = await response.json();
          if (editingGameIndex !== null) {
            setGames(prev =>
              prev.map((game, index) =>
                index === editingGameIndex ? savedGame : game
              )
            );
          } else {
            setGames(prev => [...prev, savedGame]);
          }
          setIsRecordingGame(false);
          setEditingGameIndex(null);
          setCurrentGame({
            playerScores: [],
            location: '',
            timestamp: null,
          });
        }
      } catch (error) {
        console.error('Error recording game:', error);
      }
    }
  };

  // Rest of your component remains the same

};

export default CroquetTracker;
