import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { RoomState, Choice } from '../types';

export function useRoomSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [revealedChoices, setRevealedChoices] = useState<Record<string, Choice> | null>(null);

  useEffect(() => {
    let id = sessionStorage.getItem('rps_client_id');
    if (!id) {
      id = uuidv4();
      sessionStorage.setItem('rps_client_id', id);
    }
    setClientId(id);

    const s = io({
      autoConnect: true,
      path: '/api/socket',
      transports: ['polling', 'websocket']
    });
    setSocket(s);

    s.on('room:state', (state: RoomState) => {
      setRoomState(state);
    });

    s.on('round:countdown', ({ startsAt }) => {
      // Simple implementation: just set a value we can watch
      setCountdown(startsAt);
    });

    s.on('round:pickDeadline', ({ deadline }) => {
      setCountdown(null);
      setRevealedChoices(null);
    });

    s.on('round:reveal', ({ choices }) => {
      setRevealedChoices(choices);
    });

    s.on('error', (err) => {
      setError(err.message);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomId: string, displayName: string) => {
    if (!socket || !clientId) return;
    setError(null);
    socket.emit('room:join', { roomId, clientId, displayName });
  }, [socket, clientId]);

  const createRoom = useCallback((displayName: string, mode: 'elimination' | 'points', pointsTarget?: number) => {
    if (!socket || !clientId) return;
    socket.emit('room:create', { displayName, mode, pointsTarget }, (roomId: string) => {
      joinRoom(roomId, displayName);
    });
  }, [socket, clientId, joinRoom]);

  const setReady = useCallback((ready: boolean) => {
    if (!socket || !clientId || !roomState) return;
    socket.emit('player:ready', { roomId: roomState.roomId, clientId, ready });
  }, [socket, clientId, roomState]);

  const startGame = useCallback(() => {
    if (!socket || !roomState) return;
    socket.emit('host:start', { roomId: roomState.roomId });
  }, [socket, roomState]);

  const pickChoice = useCallback((choice: Choice) => {
    if (!socket || !clientId || !roomState) return;
    socket.emit('round:pick', { roomId: roomState.roomId, clientId, choice });
  }, [socket, clientId, roomState]);

  const playAgain = useCallback(() => {
    if (!socket || !roomState) return;
    socket.emit('room:playAgain', { roomId: roomState.roomId });
  }, [socket, roomState]);

  const leaveRoom = useCallback(() => {
    setRoomState(null);
    setRevealedChoices(null);
    setError(null);
    socket?.disconnect();
    socket?.connect(); // reconnect to get a clean slate if needed
  }, [socket]);

  return {
    socket,
    clientId,
    roomState,
    error,
    countdown,
    revealedChoices,
    joinRoom,
    setReady,
    startGame,
    pickChoice,
    playAgain,
    leaveRoom
  };
}
