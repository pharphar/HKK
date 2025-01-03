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

      setPlayers(playersData);
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
          setGames(prev => [...prev, savedGame]);
          setIsRecordingGame(false);
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

  const addPlayerScore = (player, score) => {
    const filteredScores = currentGame.playerScores.filter(ps => ps.player !== player);
    const isScoreUsed = filteredScores.some(ps => ps.score === score);

    if (!isScoreUsed) {
      setCurrentGame(prev => ({
        ...prev,
        playerScores: [...filteredScores, { player, score }],
      }));
    }
  };

  const getAvailableScores = (currentPlayer) => {
    const usedScores = currentGame.playerScores
      .filter(ps => ps.player !== currentPlayer)
      .map(ps => ps.score);
    return [1, 2, 3, 4].filter(score => !usedScores.includes(score));
  };

  const getCurrentPlayerScore = (player) => {
    const playerScore = currentGame.playerScores.find(ps => ps.player === player);
    return playerScore ? playerScore.score : null;
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
                    <div>
                      <h3 className="font-semibold mb-2">Assign Positions</h3>
                      {players.map(player => (
                        <div key={player.name} className="mb-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{player.name}</span>
                            <div className="flex gap-2">
                              {getAvailableScores(player.name).map(score => (
                                <Button
                                  key={score}
                                  variant={getCurrentPlayerScore(player.name) === score ? 'default' : 'outline'}
                                  className="w-12 h-12"
                                  onClick={() => addPlayerScore(player.name, score)}
                                >
                                  {score}
                                </Button>
                              ))}
                            </div>
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
                      Record Game
                    </Button>
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <h3 className="font-semibold">Recent Games</h3>
                  {games.slice().reverse().map((game, index) => (
                    <Card key={game._id || index} className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-500">
                          {game.location} - {new Date(game.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {game.playerScores.sort((a, b) => a.score - b.score).map(ps => (
                        <div key={ps.player} className="flex justify-between">
                          <span>{ps.player}</span>
                          <span className="font-medium">{ps.score}</span>
                        </div>
                      ))}
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="New player name"
                      className="h-12 text-lg"
                      disabled={players.length >= 4}
                    />
                    <Button
                      onClick={addPlayer}
                      className="h-12 px-6"
                      disabled={players.length >= 4}
                    >
                      <Plus size={20} />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {players.map(player => (
                      <Card key={player._id} className="p-4">
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span className="text-lg">{player.name}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {players.map(player => (
                    <Card key={player._id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Trophy size={16} />
                          <h3 className="text-lg font-bold">{player.name}</h3>
                        </div>
                        <p>Total Games: {player.totalGames}</p>
                        <p>Wins: {player.wins}</p>
                        <p>Average Position: {player.averagePosition?.toFixed(2)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default CroquetTracker;
