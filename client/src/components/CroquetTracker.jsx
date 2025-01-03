import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Plus, User, Trophy, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CroquetTracker = () => {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [games, setGames] = useState([]);
  const [isRecordingGame, setIsRecordingGame] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [currentGame, setCurrentGame] = useState({
    playerScores: [],
    location: '',
    gameDate: new Date().toISOString().split('T')[0],
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

      setPlayers(playersData);
      setGames(gamesData.map(game => ({
        ...game,
        gameDate: new Date(game.gameDate).toISOString().split('T')[0],
        timestamp: new Date(game.timestamp)
      })));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPlayer = async () => {
    if (newPlayerName.trim() && !players.some(p => p.name === newPlayerName.trim()) && players.length < 4) {
      try {
        const response = await fetch(`${API_URL}/players`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newPlayerName.trim() }),
        });

        if (response.ok) {
          const newPlayer = await response.json();
          setPlayers([...players, newPlayer]);
          setNewPlayerName('');
        }
      } catch (error) {
        console.error('Error adding player:', error);
      }
    }
  };

  const cancelGame = () => {
    setIsRecordingGame(false);
    setCurrentGame({
      playerScores: [],
      location: '',
      gameDate: new Date().toISOString().split('T')[0],
      timestamp: null,
    });
  };

  const recordGame = async () => {
    if (currentGame.playerScores.length === 4 && currentGame.location && currentGame.gameDate) {
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
          setGames(prev => [...prev, {
            ...savedGame,
            gameDate: new Date(savedGame.gameDate).toISOString().split('T')[0]
          }]);
          cancelGame();
        }
      } catch (error) {
        console.error('Error recording game:', error);
      }
    }
  };

  const addPlayerPoints = (player, points) => {
    if (points >= 1 && points <= 4) {
      const filteredScores = currentGame.playerScores.filter(ps => ps.player !== player);
      setCurrentGame(prev => ({
        ...prev,
        playerScores: [...filteredScores, { player, points }],
      }));
    }
  };

  const getCurrentPlayerPoints = (player) => {
    const playerScore = currentGame.playerScores.find(ps => ps.player === player);
    return playerScore ? playerScore.points : '';
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50">
      <div className="p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-center">Kroket Tracker</h1>
      </div>

      <Tabs defaultValue="games" className="w-full">
        <TabsList className="fixed bottom-0 w-full h-16 grid grid-cols-3 bg-white border-t">
          <TabsTrigger value="games" className="flex flex-col items-center gap-1">
            <Plus size={20} />
            <span className="text-xs">Games</span>
          </TabsTrigger>
          <TabsTrigger value="players" className="flex flex-col items-center gap-1">
            <User size={20} />
            <span className="text-xs">Players</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex flex-col items-center gap-1">
            <Trophy size={20} />
            <span className="text-xs">Stats</span>
          </TabsTrigger>
        </TabsList>

        <div className="pb-20 px-4">
          <TabsContent value="games" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {!isRecordingGame ? (
                  <Button
                    className="w-full h-12 text-lg mb-6"
                    onClick={() => setIsRecordingGame(true)}
                    disabled={players.length < 4}
                  >
                    Record a Game
                  </Button>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">Record Game</h2>
                      <Button variant="ghost" size="icon" onClick={cancelGame}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Game Date</h3>
                      <Input
                        type="date"
                        value={currentGame.gameDate}
                        onChange={(e) => setCurrentGame(prev => ({
                          ...prev,
                          gameDate: e.target.value,
                        }))}
                        className="h-12 text-lg"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Enter Points (1-4)</h3>
                      {players.map(player => (
                        <div key={player.name} className="mb-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{player.name}</span>
                            <Input
                              type="number"
                              min="1"
                              max="4"
                              value={getCurrentPlayerPoints(player.name)}
                              onChange={(e) => addPlayerPoints(player.name, parseInt(e.target.value))}
                              className="w-20 h-12 text-lg"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Location</h3>
                      <Input
                        value={currentGame.location}
                        onChange={(e) => setCurrentGame(prev => ({
                          ...prev,
                          location: e.target.value,
                        }))}
                        placeholder="Enter location"
                        className="h-12 text-lg"
                      />
                    </div>

                    <Button
                      className="w-full h-12"
                      onClick={recordGame}
                      disabled={currentGame.playerScores.length !== 4 || !currentGame.location}
                    >
                      Save Game
                    </Button>
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <h3 className="font-semibold">Recent Games</h3>
                  {games.slice().reverse().map((game, index) => (
                    <Card key={game._id || index} className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-500">
                          {game.location} - {new Date(game.gameDate).toLocaleDateString()}
                        </div>
                      </div>
                      {game.playerScores.map(ps => (
                        <div key={ps.player} className="flex justify-between">
                          <span>{ps.player}</span>
                          <span className="font-medium">{ps.points} points</span>
                        </div>
                      ))}
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Players and Stats tabs remain the same */}
        </div>
      </Tabs>
    </div>
  );
};

export default CroquetTracker;
