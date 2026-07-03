import { Choice } from '../../src/types';

export function resolveRound(activePlayers: string[], choices: Record<string, Choice | null>) {
  // Timeout/no-pick = automatic loss, not a valid choice
  const timedOut = activePlayers.filter(id => choices[id] == null);
  const validPlayers = activePlayers.filter(id => choices[id] != null);
  const distinctChoices = new Set(validPlayers.map(id => choices[id] as Choice));

  // Everyone picked the same thing -> draw, replay same active players
  if (distinctChoices.size === 1) {
    return { outcome: 'draw', winners: [], losers: timedOut };
  }

  // All three choices present simultaneously -> draw, replay (cyclical, no dominant choice)
  if (distinctChoices.size === 3) {
    return { outcome: 'draw', winners: [], losers: timedOut };
  }

  // Exactly two distinct choices -> normal beats-logic decides the WINNING CHOICE,
  // then every player who picked that choice wins
  if (distinctChoices.size === 2) {
    const [a, b] = Array.from(distinctChoices);
    const beats = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
    const winningChoice = beats[a as keyof typeof beats] === b ? a : b;

    const winners = validPlayers.filter(id => choices[id] === winningChoice);
    const losers = [...validPlayers.filter(id => choices[id] !== winningChoice), ...timedOut];

    return { outcome: 'resolved', winners, losers };
  }

  // distinctChoices.size === 0 (everyone timed out)
  return { outcome: 'draw', winners: [], losers: timedOut };
}
