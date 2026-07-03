import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import { createServer } from "http";
import { RoomManager } from "./server/game/roomManager";
import { setupSocketHandlers } from "./server/game/socketHandler";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
    path: "/api/socket"
  });

  const roomManager = new RoomManager();
  setupSocketHandlers(io, roomManager);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
