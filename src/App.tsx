import { useState } from 'react';
import { Moon, Sun, ArrowRight, User } from 'lucide-react';
import { useRoomSocket } from './hooks/useRoomSocket';
import { Lobby } from './components/Lobby';
import { MultiplayerBattleArea } from './components/MultiplayerBattleArea';
import { MatchOverScreen } from './components/MatchOverScreen';

export default function App() {
  const { 
    socket, clientId, roomState, error, countdown, revealedChoices,
    joinRoom, setReady, startGame, pickChoice, playAgain, leaveRoom 
  } = useRoomSocket();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [createMode, setCreateMode] = useState<'elimination' | 'points'>('points');
  const [pointsTarget, setPointsTarget] = useState(5);

  const handleCreate = () => {
    if (!displayName) return;
    socket?.emit('room:create', { displayName, mode: createMode, pointsTarget }, (roomId: string) => {
      joinRoom(roomId, displayName);
    });
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col overflow-hidden transition-colors">
      <header className="p-6 md:p-8 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm z-10 transition-colors">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="m-0 text-xl md:text-2xl font-extrabold tracking-tight">RPS<span className="text-indigo-600">ARENA</span></h1>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
        {roomState && (
          <button onClick={leaveRoom} className="text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            Leave Room
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
        {!roomState ? (
          <div className="w-full max-w-md bg-white dark:bg-slate-950 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-6 text-center">Join the Arena</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Join Existing Room</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="6-CHAR CODE"
                    maxLength={6}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase dark:text-white"
                  />
                  <button 
                    onClick={() => joinRoom(joinCode, displayName)}
                    disabled={!joinCode || !displayName}
                    className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Or Create New Room</label>
                <div className="flex gap-2 mb-4">
                  <select 
                    value={createMode} 
                    onChange={e => setCreateMode(e.target.value as 'points' | 'elimination')}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    <option value="points">Points Mode</option>
                    <option value="elimination">Elimination Mode</option>
                  </select>
                  {createMode === 'points' && (
                    <select 
                      value={pointsTarget} 
                      onChange={e => setPointsTarget(Number(e.target.value))}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    >
                      <option value="3">First to 3</option>
                      <option value="5">First to 5</option>
                      <option value="10">First to 10</option>
                    </select>
                  )}
                </div>
                <button 
                  onClick={handleCreate}
                  disabled={!displayName}
                  className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Create Room <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : roomState.state === 'LOBBY' ? (
          <Lobby 
            roomState={roomState} 
            clientId={clientId} 
            onReady={setReady} 
            onStart={startGame} 
          />
        ) : roomState.state === 'MATCH_OVER' ? (
          <MatchOverScreen roomState={roomState} clientId={clientId} onPlayAgain={playAgain} />
        ) : (
          <MultiplayerBattleArea 
            roomState={roomState} 
            clientId={clientId} 
            countdown={countdown}
            revealedChoices={revealedChoices}
            onPick={pickChoice}
          />
        )}
      </main>
    </div>
  );
}
