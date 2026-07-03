import { RoomState, Player, Choice, RoundRecord } from '../../src/types';
import { resolveRound } from './resolveRound';

const COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
];

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  createRoom(mode: 'elimination' | 'points', pointsTarget?: number): string {
    let roomId: string;
    do {
      roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.rooms.has(roomId));

    this.rooms.set(roomId, {
      roomId,
      mode,
      pointsTarget: mode === 'points' ? pointsTarget || 5 : undefined,
      state: 'LOBBY',
      players: [],
      currentRoundChoices: {},
      history: [],
      pickDeadline: null,
      createdAt: Date.now(),
    });

    return roomId;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId: string, clientId: string, displayName: string): { room: RoomState, player: Player } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    let player = room.players.find(p => p.clientId === clientId);
    
    if (player) {
      player.connected = true;
      player.displayName = displayName;
    } else {
      if (room.state !== 'LOBBY') return null; // Can't join mid-game as a new player
      if (room.players.length >= 5) return null; // Room full

      const usedColors = new Set(room.players.map(p => p.avatarColor));
      const availableColors = COLORS.filter(c => !usedColors.has(c));
      
      player = {
        clientId,
        displayName,
        avatarColor: availableColors[0] || COLORS[0],
        isHost: room.players.length === 0,
        isReady: false,
        connected: true,
        status: 'alive',
        score: 0,
      };
      room.players.push(player);
    }

    return { room, player };
  }

  leaveRoom(roomId: string, clientId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.state === 'LOBBY') {
      room.players = room.players.filter(p => p.clientId !== clientId);
      this.reassignHost(room);
    } else {
      const player = room.players.find(p => p.clientId === clientId);
      if (player) {
        player.connected = false;
        // In real-time matches, wait for 30s grace period. For simplicity here, if they disconnect, 
        // they just remain in state. The round will timeout them out if they don't reconnect and pick.
      }
    }
  }

  setReady(roomId: string, clientId: string, isReady: boolean) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'LOBBY') return;
    const player = room.players.find(p => p.clientId === clientId);
    if (player) player.isReady = isReady;
  }

  reassignHost(room: RoomState) {
    if (room.players.length > 0 && !room.players.some(p => p.isHost && p.connected)) {
      const firstConnected = room.players.find(p => p.connected);
      if (firstConnected) {
        room.players.forEach(p => p.isHost = false);
        firstConnected.isHost = true;
      }
    }
  }

  startCountdown(roomId: string, broadcastCountdown: (startsAt: number) => void, onCountdownComplete: () => void) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'LOBBY') return;
    
    // Check if 3-5 players and all ready
    if (room.players.length < 3 || room.players.length > 5) return;
    if (!room.players.every(p => p.isReady)) return;

    room.state = 'COUNTDOWN';
    const startsAt = Date.now() + 3000;
    broadcastCountdown(startsAt);

    setTimeout(() => {
      onCountdownComplete();
    }, 3000);
  }

  startPicking(roomId: string, broadcastDeadline: (deadline: number) => void, onTimeout: () => void) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.state = 'PICKING';
    room.currentRoundChoices = {};
    const deadline = Date.now() + 15000;
    room.pickDeadline = deadline;
    broadcastDeadline(deadline);

    const timer = setTimeout(() => {
      onTimeout();
    }, 15000);
    this.timers.set(roomId, timer);
  }

  submitPick(roomId: string, clientId: string, choice: Choice): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'PICKING') return false;

    const player = room.players.find(p => p.clientId === clientId);
    if (!player || player.status === 'eliminated') return false;

    room.currentRoundChoices[clientId] = choice;

    const activePlayers = room.players.filter(p => p.status === 'alive');
    const allPicked = activePlayers.every(p => room.currentRoundChoices[p.clientId]);

    if (allPicked) {
      const timer = this.timers.get(roomId);
      if (timer) clearTimeout(timer);
      this.timers.delete(roomId);
      return true; // Indicates early completion
    }
    return false;
  }

  resolveRoundAction(roomId: string): { room: RoomState, record: RoundRecord, gameOver: boolean } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.state = 'REVEALING';
    const activePlayers = room.players.filter(p => p.status === 'alive').map(p => p.clientId);
    const result = resolveRound(activePlayers, room.currentRoundChoices);

    let gameOver = false;

    if (room.mode === 'elimination') {
      if (result.outcome === 'resolved') {
        // Eliminate losers
        result.losers.forEach(id => {
          const p = room.players.find(p => p.clientId === id);
          if (p) p.status = 'eliminated';
        });

        const activeCount = room.players.filter(p => p.status === 'alive').length;
        if (activeCount <= 1) {
          gameOver = true;
        }
      }
    } else if (room.mode === 'points') {
      if (result.outcome === 'resolved') {
        result.winners.forEach(id => {
          const p = room.players.find(p => p.clientId === id);
          if (p) p.score += 1;
        });

        // check if someone reached target
        const highestScore = Math.max(...room.players.map(p => p.score));
        if (room.pointsTarget && highestScore >= room.pointsTarget) {
          // Are there tied players at the top score?
          const leaders = room.players.filter(p => p.score === highestScore);
          if (leaders.length === 1) {
            gameOver = true;
          } else {
            // Tie-breaker: eliminate everyone else, they keep playing
            room.players.forEach(p => {
              if (p.score < highestScore) {
                p.status = 'eliminated';
              }
            });
          }
        }
      }
    }

    const record: RoundRecord = {
      roundNumber: room.history.length + 1,
      choices: { ...room.currentRoundChoices },
      outcome: result.outcome as any,
      winners: result.winners,
      losers: result.losers,
    };
    
    room.history.push(record);
    room.state = gameOver ? 'MATCH_OVER' : 'ROUND_RESULT';
    
    return { room, record, gameOver };
  }

  playAgain(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'MATCH_OVER') return;

    room.state = 'LOBBY';
    room.history = [];
    room.currentRoundChoices = {};
    room.pickDeadline = null;
    room.players.forEach(p => {
      p.score = 0;
      p.status = 'alive';
      p.isReady = false;
    });
  }

  cleanUpIdleRooms() {
    const now = Date.now();
    for (const [roomId, room] of Array.from(this.rooms.entries())) {
      if (now - room.createdAt > 30 * 60 * 1000 && room.players.every(p => !p.connected)) {
        this.rooms.delete(roomId);
      }
    }
  }
}
