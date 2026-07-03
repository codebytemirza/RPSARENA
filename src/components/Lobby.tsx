import { RoomState, Player } from '../types';

export function Lobby({
  roomState,
  clientId,
  onReady,
  onStart
}: {
  roomState: RoomState;
  clientId: string;
  onReady: (ready: boolean) => void;
  onStart: () => void;
}) {
  const me = roomState.players.find(p => p.clientId === clientId);
  const isHost = me?.isHost;
  const canStart = roomState.players.length >= 3 && roomState.players.length <= 5 && roomState.players.every(p => p.isReady);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Room: {roomState.roomId}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Mode: {roomState.mode} {roomState.mode === 'points' ? `(First to ${roomState.pointsTarget})` : ''}
          </p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold px-4 py-2 rounded-full text-sm">
          {roomState.players.length}/5 Players
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {roomState.players.map(p => (
          <div key={p.clientId} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div 
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: p.avatarColor }}
              >
                {p.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {p.displayName} {p.clientId === clientId && '(You)'}
                </span>
                {p.isHost && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Host</span>}
              </div>
            </div>
            <div>
              {p.isReady ? (
                <span className="text-green-600 dark:text-green-500 font-bold uppercase tracking-wider text-sm flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Ready
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-sm flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span> Waiting
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => onReady(!me?.isReady)}
          className={`px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors ${
            me?.isReady 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {me?.isReady ? 'Cancel Ready' : 'Ready Up'}
        </button>

        {isHost && (
          <button
            onClick={onStart}
            disabled={!canStart}
            className={`px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors ${
              canStart 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            Start Game
          </button>
        )}
      </div>
      {isHost && !canStart && (
        <p className="text-center text-xs text-slate-500 mt-4">
          Need 3-5 ready players to start.
        </p>
      )}
    </div>
  );
}
