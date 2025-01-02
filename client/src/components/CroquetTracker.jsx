import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Plus, User, Trophy, Pencil, LogIn } from 'lucide-react';

const DROPBOX_APP_KEY = '4pxpqtryq8n30ta';
const DROPBOX_FILE_PATH = '/croquet_tracker_data.json';

const CroquetTracker = () => {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [games, setGames] = useState([]);
  const [isRecordingGame, setIsRecordingGame] = useState(false);
  const [editingGameIndex, setEditingGameIndex] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [currentGame, setCurrentGame] = useState({
    playerScores: [],
    location: '',
    timestamp: null,
  });

  useEffect(() => {
    // Check if we're returning from Dropbox auth
    const params = new URLSearchParams(window.location.hash.substr(1));
    const accessToken = params.get('access_token');

    if (accessToken) {
      localStorage.setItem('dropboxToken', accessToken);
      setIsAuthenticated(true);
      loadDataFromDropbox(accessToken);
    } else {
      const storedToken = localStorage.getItem('dropboxToken');
      if (storedToken) {
        setIsAuthenticated(true);
        loadDataFromDropbox(storedToken);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const loadDataFromDropbox = async (accessToken) => {
    try {
      setIsLoading(true);
      const response = await fetch('https://api.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({ path: DROPBOX_FILE_PATH }),
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        setPlayers(data.players || []);
        setGames(
          (data.games || []).map((game) => ({
            ...game,
            timestamp: new Date(game.timestamp),
          }))
        );
      } else {
        const errorData = await response.text();
        console.error('Dropbox API Error:', response.status, errorData);
        // Initialize with empty data if file doesn't exist (status 409)
        if (response.status === 409) {
          setPlayers([]);
          setGames([]);
        } else {
          alert('Error loading data from Dropbox');
        }
      }
    } catch (error) {
      console.error('Error loading from Dropbox:', error);
      setPlayers([]);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToDropbox = async () => {
    const accessToken = localStorage.getItem('dropboxToken');
    if (!accessToken) return;

    try {
      const data = {
        players,
        games,
        lastUpdated: new Date().toISOString(),
      };

      await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: DROPBOX_FILE_PATH,
            mode: 'overwrite',
          }),
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error saving to Dropbox:', error);
      alert('Error saving to Dropbox');
    }
  };

  // Save to Dropbox whenever data changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      saveToDropbox();
    }
  }, [players, games, isAuthenticated, isLoading]);

  const addPlayer = () => {
    if (
      newPlayerName.trim() &&
      !players.includes(newPlayerName.trim()) &&
      players.length < 4
    ) {
      setPlayers([...players, newPlayerName.trim()]);
      setNewPlayerName('');
    }
  };

  const startNewGame = () => {
    setIsRecordingGame(true);
    setEditingGameIndex(null);
    setCurrentGame({
      playerScores: [],
      location: '',
      timestamp: new Date(),
    });
  };

  const startEditingGame = (gameIndex) => {
    setIsRecordingGame(true);
    setEditingGameIndex(gameIndex);
    setCurrentGame({
      ...games[gameIndex],
      timestamp: games[gameIndex].timestamp,
    });
  };

  const addPlayerScore = (player, score) => {
    const filteredScores = currentGame.playerScores.filter((ps) => ps.player !== player);
    const isScoreUsed = filteredScores.some((ps) => ps.score === score);

    if (!isScoreUsed) {
      setCurrentGame((prev) => ({
        ...prev,
        playerScores: [...filteredScores, { player, score }],
      }));
    }
  };

  const recordGame = () => {
    if (currentGame.playerScores.length === 4 && currentGame.location) {
      if (editingGameIndex !== null) {
        setGames((prev) =>
          prev.map((game, index) => (index === editingGameIndex ? { ...currentGame } : game))
        );
      } else {
        setGames((prev) => [...prev, { ...currentGame }]);
      }
      setIsRecordingGame(false);
      setEditingGameIndex(null);
      setCurrentGame({
        playerScores: [],
        location: '',
        timestamp: null,
      });
    }
  };

  const calculateStats = () => {
    const stats = {};
    players.forEach((player) => {
      const playerGames = games.flatMap((game) =>
        game.playerScores.filter((score) => score.player === player)
      );
      stats[player] = {
        totalGames: playerGames.length,
        averagePosition:
          playerGames.length > 0
            ? (playerGames.reduce((sum, score) => sum + score.score, 0) / playerGames.length).toFixed(
                2
              )
            : 0,
        wins: playerGames.filter((score) => score.score === 1).length,
      };
    });
    return stats;
  };

  const getAvailableScores = (currentPlayer) => {
    const usedScores = currentGame.playerScores
      .filter((ps) => ps.player !== currentPlayer)
      .map((ps) => ps.score);
    return [1, 2, 3, 4].filter((score) => !usedScores.includes(score));
  };

  const getCurrentPlayerScore = (player) => {
    const playerScore = currentGame.playerScores.find((ps) => ps.player === player);
    return playerScore ? playerScore.score : null;
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-6">Croquet Tracker</h1>
            <p className="mb-6 text-gray-600">
              Connect with Dropbox to save your games and access them from any device.
            </p>
            <Button onClick={authenticateDropbox} className="w-full h-12 text-lg">
              <LogIn className="mr-2 h-5 w-5" />
              Connect with Dropbox
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50">
      <div className="safe-top p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-center">Croquet Tracker</h1>
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
          {/* GAMES TAB */}
          <TabsContent value="games" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {!isRecordingGame ? (
                  <Button
                    className="w-full h-12 text-lg mb-6"
                    onClick={startNewGame}
                    disabled={players.length < 4}
                  >
                    Record a Game
                  </Button>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Assign Positions</h3>
                      {players.map((player) => (
                        <div key={player} className="mb-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{player}</span>
                            <div className="flex gap-2">
                              {getAvailableScores(player).map((score) => (
                                <Button
                                  key={score}
                                  variant={
                                    getCurrentPlayerScore(player) === score ? 'default' : 'outline'
                                  }
                                  className="w-12 h-12"
                                  onClick={() => addPlayerScore(player, score)}
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
                        onChange={(e) =>
                          setCurrentGame((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        placeholder="Enter location"
                        className="h-12 text-lg"
                      />
                    </div>

                    <Button
                      className="w-full h-12"
                      onClick={recordGame}
                      disabled={currentGame.playerScores.length !== 4 || !currentGame.location}
                    >
                      {editingGameIndex !== null ? 'Update Game' : 'Record Score'}
                    </Button>
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <h3 className="font-semibold">Recent Games</h3>
                  {games
                    .slice()
                    .reverse()
                    .map((game, index) => {
                      const reverseIndex = games.length - 1 - index;
                      return (
                        <Card key={index} className="p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm text-gray-500">
                              {game.location} - {game.timestamp.toLocaleString()}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingGame(reverseIndex)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil size={16} />
                            </Button>
                          </div>
                          {game.playerScores
                            .sort((a, b) => a.score - b.score)
                            .map((ps) => (
                              <div key={ps.player} className="flex justify-between">
                                <span>{ps.player}</span>
                                <span className="font-medium">{ps.score}</span>
                              </div>
                            ))}
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PLAYERS TAB */}
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
                    {players.map((player) => (
                      <Card key={player} className="p-4">
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span className="text-lg">{player}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATS TAB */}
          <TabsContent value="stats" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {Object.entries(calculateStats()).map(([player, stats]) => (
                    <Card key={player} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Trophy size={16} />
                          <h3 className="text-lg font-bold">{player}</h3>
                        </div>
                        <p>Total Games: {stats.totalGames}</p>
                        <p>Average Position: {stats.averagePosition}</p>
                        <p>Wins: {stats.wins}</p>
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
