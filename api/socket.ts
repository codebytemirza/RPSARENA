import { Server } from "socket.io";
import { RoomManager } from "../server/game/roomManager";
import { setupSocketHandlers } from "../server/game/socketHandler";

// We use a global variable to persist the RoomManager across hot-reloads 
// and instance re-invocations in Vercel Serverless environment.
// Note: This only persists state for a single Vercel instance. If traffic
// requires multiple instances, state will not be shared across them.
const globalAny: any = global;
if (!globalAny.roomManager) {
  globalAny.roomManager = new RoomManager();
}
const roomManager = globalAny.roomManager;

export default function handler(req: any, res: any) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io server on Vercel...");
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      transports: ["polling"], // Force polling to improve reliability on Serverless
    });

    res.socket.server.io = io;
    setupSocketHandlers(io, roomManager);
  }

  res.end();
}
