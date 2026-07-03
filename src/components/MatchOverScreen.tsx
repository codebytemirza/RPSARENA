import { RoomState } from '../types';
import { motion } from 'motion/react';
import { Trophy, RefreshCw } from 'lucide-react';

export function MatchOverScreen({
  roomState,
  clientId,
  onPlayAgain
}: {
  roomState: RoomState;
  clientId: string;
  onPlayAgain: () => void;
}) {
  const me = roomState.players.find(p => p.clientId === clientId);
  const isHost = me?.isHost;

  // Find winner(s)
  let winners: string[] = [];
  if (roomState.mode === 'elimination') {
    winners = roomState.players.filter(p => p.status === 'alive').map(p => p.displayName);
  } else {
    const highestScore = Math.max(...roomState.players.map(p => p.score));
    winners = roomState.players.filter(p => p.score === highestScore).map(p => p.displayName);
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-xl flex flex-col items-center w-full"
      >
        <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mb-6">
          <Trophy size={48} />
        </div>
        
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Match Winner</h2>
        <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 text-center mb-8">
          {winners.join(' & ')}
        </div>

        {roomState.mode === 'points' && (
          <div className="flex gap-4 mb-8 w-full justify-center">
            {roomState.players.sort((a,b) => b.score - a.score).map((p, i) => (
              <div key={p.clientId} className="flex flex-col items-center bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 mb-1">{p.displayName}</div>
                <div className="text-2xl font-bold">{p.score}</div>
              </div>
            ))}
          </div>
        )}

        <div className="w-full pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-center">
          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw size={20} /> Play Again
            </button>
          ) : (
            <p className="text-slate-500 font-semibold animate-pulse">Waiting for host to play again...</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
