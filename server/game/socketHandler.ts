import { Server, Socket } from "socket.io";
import { RoomManager } from "./roomManager";

export function setupSocketHandlers(io: Server, roomManager: RoomManager) {
  io.on("connection", (socket: Socket) => {
    socket.on("room:create", ({ displayName, mode, pointsTarget }, callback) => {
      const roomId = roomManager.createRoom(mode, pointsTarget);
      if (callback) callback(roomId);
    });

    socket.on("room:join", ({ roomId, clientId, displayName }) => {
      const result = roomManager.joinRoom(roomId, clientId, displayName);
      if (!result) {
        socket.emit("error", { code: "ROOM_NOT_FOUND", message: "Room not found or full" });
        return;
      }
      
      socket.data.clientId = clientId;
      socket.data.roomId = roomId;

      socket.join(roomId);
      io.to(roomId).emit("room:state", sanitizeRoom(result.room));
    });

    socket.on("player:ready", ({ roomId, clientId, ready }) => {
      roomManager.setReady(roomId, clientId, ready);
      const room = roomManager.getRoom(roomId);
      if (room) io.to(roomId).emit("room:state", sanitizeRoom(room));
    });

    socket.on("host:start", ({ roomId }) => {
      roomManager.startCountdown(
        roomId,
        (startsAt) => io.to(roomId).emit("round:countdown", { startsAt }),
        () => {
          roomManager.startPicking(
            roomId,
            (deadline) => {
              io.to(roomId).emit("round:pickDeadline", { deadline });
              const r = roomManager.getRoom(roomId);
              if (r) io.to(roomId).emit("room:state", sanitizeRoom(r));
            },
            () => resolveRoundTrigger(roomId)
          );
        }
      );
    });

    socket.on("round:pick", ({ roomId, clientId, choice }) => {
      const earlyComplete = roomManager.submitPick(roomId, clientId, choice);
      if (earlyComplete) {
        resolveRoundTrigger(roomId);
      }
    });

    socket.on("room:playAgain", ({ roomId }) => {
      roomManager.playAgain(roomId);
      const room = roomManager.getRoom(roomId);
      if (room) io.to(roomId).emit("room:state", sanitizeRoom(room));
    });

    socket.on("disconnect", () => {
      const { roomId, clientId } = socket.data;
      if (roomId && clientId) {
        roomManager.leaveRoom(roomId, clientId);
        const room = roomManager.getRoom(roomId);
        if (room) {
          io.to(roomId).emit("player:disconnected", { clientId });
          io.to(roomId).emit("room:state", sanitizeRoom(room));
        }
      }
    });
  });

  function resolveRoundTrigger(roomId: string) {
    const res = roomManager.resolveRoundAction(roomId);
    if (!res) return;

    io.to(roomId).emit("round:reveal", { choices: res.record.choices });
    
    setTimeout(() => {
      io.to(roomId).emit("round:result", res.record);
      
      const r = roomManager.getRoom(roomId);
      if (r) io.to(roomId).emit("room:state", sanitizeRoom(r));

      if (res.gameOver) {
        setTimeout(() => {
          io.to(roomId).emit("match:over", { history: r?.history });
        }, 3000);
      } else {
        setTimeout(() => {
          roomManager.startPicking(
            roomId,
            (deadline) => {
              io.to(roomId).emit("round:pickDeadline", { deadline });
              const r = roomManager.getRoom(roomId);
              if (r) io.to(roomId).emit("room:state", sanitizeRoom(r));
            },
            () => resolveRoundTrigger(roomId)
          );
        }, 3000);
      }
    }, 2000);
  }

  function sanitizeRoom(room: any) {
    const safeRoom = { ...room };
    if (safeRoom.state === "PICKING" || safeRoom.state === "COUNTDOWN") {
      safeRoom.currentRoundChoices = {};
    }
    return safeRoom;
  }
}
