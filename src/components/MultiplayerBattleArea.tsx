import { RoomState, Choice } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Grab, Hand, Scissors, Timer } from 'lucide-react';
import { ChoiceButton } from './ChoiceButton';
import { useEffect, useState } from 'react';

const ICONS = {
  rock: <Grab size={48} />,
  paper: <Hand size={48} />,
  scissors: <Scissors size={48} />
};

export function MultiplayerBattleArea({
  roomState,
  clientId,
  countdown,
  revealedChoices,
  onPick
}: {
  roomState: RoomState;
  clientId: string;
  countdown: number | null;
  revealedChoices: Record<string, Choice> | null;
  onPick: (choice: Choice) => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (countdown) {
      const update = () => {
        const remaining = Math.max(0, Math.ceil((countdown - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining > 0) timerId = setTimeout(update, 100);
      };
      update();
    } else if (roomState.state === 'PICKING' && roomState.pickDeadline) {
      const update = () => {
        const remaining = Math.max(0, Math.ceil((roomState.pickDeadline! - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining > 0) timerId = setTimeout(update, 100);
      };
      update();
    } else {
      setTimeLeft(null);
    }

    return () => clearTimeout(timerId);
  }, [countdown, roomState.state, roomState.pickDeadline]);

  const activePlayers = roomState.players.filter(p => p.status === 'alive');
  const me = roomState.players.find(p => p.clientId === clientId);
  const myPick = roomState.currentRoundChoices[clientId];

  const lastRound = roomState.history[roomState.history.length - 1];
  let amIWinner = false;
  let amILoser = false;
  
  if (roomState.state === 'ROUND_RESULT' && lastRound) {
    amIWinner = lastRound.winners.includes(clientId);
    amILoser = lastRound.losers.includes(clientId);
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* HUD: Scores & Status */}
      <div className="w-full flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl mb-8 shadow-sm">
        <div className="font-bold text-slate-700 dark:text-slate-200">
          Round {roomState.history.length + 1}
        </div>
        
        {roomState.state === 'COUNTDOWN' && (
          <div className="text-xl font-black text-indigo-600 animate-pulse">
            Starting in {timeLeft}
          </div>
        )}
        
        {roomState.state === 'PICKING' && (
          <div className="flex items-center gap-2 text-amber-600 font-bold">
            <Timer size={20} />
            {timeLeft}s
          </div>
        )}

        {roomState.state === 'ROUND_RESULT' && lastRound && (
          <div className={`text-xl font-black ${
            lastRound.outcome === 'draw' ? 'text-slate-500' :
            amIWinner ? 'text-green-500' : 
            amILoser ? 'text-red-500' : 'text-slate-500'
          }`}>
            {lastRound.outcome === 'draw' ? 'DRAW!' : amIWinner ? 'WIN!' : amILoser ? 'ELIMINATED!' : 'WAITING...'}
          </div>
        )}
      </div>

      {/* Players Arena */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12 w-full">
        <AnimatePresence>
          {activePlayers.map((p, i) => {
            const pick = revealedChoices ? revealedChoices[p.clientId] : null;
            const hasPicked = roomState.state === 'PICKING' && roomState.currentRoundChoices[p.clientId];
            
            let resultBorder = 'border-slate-200 dark:border-slate-700';
            let glow = '';

            if (roomState.state === 'ROUND_RESULT' && lastRound) {
              if (lastRound.winners.includes(p.clientId)) {
                resultBorder = 'border-green-500';
                glow = 'shadow-[0_0_30px_rgba(34,197,94,0.3)]';
              } else if (lastRound.losers.includes(p.clientId)) {
                resultBorder = 'border-red-500 opacity-50';
              }
            }

            return (
              <motion.div 
                key={p.clientId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
              >
                <p className="text-xs font-semibold text-slate-500 mb-2 truncate max-w-full">
                  {p.displayName} {p.clientId === clientId && '(You)'}
                </p>
                <div 
                  className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white dark:bg-slate-900 border-4 flex flex-col items-center justify-center relative transition-all duration-500 ${resultBorder} ${glow}`}
                  style={{ borderBottomColor: p.avatarColor }}
                >
                  {pick ? (
                    <div className="text-slate-800 dark:text-slate-200 [&>svg]:w-10 [&>svg]:h-10 md:[&>svg]:w-14 md:[&>svg]:h-14">
                      {ICONS[pick]}
                    </div>
                  ) : hasPicked ? (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  ) : (
                    <div className="text-4xl opacity-20">?</div>
                  )}
                  {roomState.mode === 'points' && (
                    <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm">
                      {p.score}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Controls */}
      {me && me.status === 'alive' && roomState.state === 'PICKING' && (
        <div className="flex gap-4">
          {(['rock', 'paper', 'scissors'] as Choice[]).map(c => (
            <ChoiceButton
              key={c}
              icon={ICONS[c]}
              label={c}
              onClick={() => onPick(c)}
              disabled={!!myPick}
              active={myPick === c}
            />
          ))}
        </div>
      )}

      {me && me.status === 'eliminated' && (
        <div className="text-slate-400 font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-6 py-3 rounded-xl">
          You are eliminated. Spectating...
        </div>
      )}
    </div>
  );
}
