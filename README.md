# Multiplayer Rock Paper Scissors Arena

A real-time, fully server-authoritative multiplayer Rock Paper Scissors game built with React, Vite, Express, and Socket.io.

## Features

- **No Authentication Required:** Jump straight in using an anonymous session.
- **3-5 Player Matches:** Compete in small group sizes with dynamic outcome resolution.
- **Server Authoritative:** Game state and winner resolutions are processed securely on the server.
- **Two Game Modes:**
  - **Points Mode:** Race to a target score (e.g. First to 5).
  - **Elimination Mode:** Sudden death. Lose a round and you're eliminated from the match.
- **Smart Winner Algorithm:** When multiple distinct choices are made by players, it dynamically calculates outcomes based on whether there's a dominant choice. If everyone picks a different option (Rock, Paper, and Scissors all present), it's a draw.

## How to Run

This project uses an Express server to host both the Socket.io WebSocket connections and the Vite frontend.

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run in Development:**
   ```bash
   npm run dev
   ```
   This uses `tsx` to run the TypeScript server (`server.ts`) directly and wires up the Vite middleware.

3. **Build for Production:**
   ```bash
   npm run build
   ```
   This builds the React app via Vite and bundles the server using `esbuild`.

4. **Start Production Server:**
   ```bash
   npm run start
   ```

## Deployment (Zero Config Needed)

The app is built to require **no environment variables** (`.env`). It runs entirely in-memory and uses anonymous sessions.

### Vercel Deployment

This project includes a `vercel.json` and `api/socket.ts` configuration, making it **100% ready to deploy to Vercel** with zero configuration required.

**Important Note on Vercel:** Because Vercel is a Serverless platform, it spins down idle instances and doesn't share memory between parallel instances. The match state is kept in-memory. 
- For small-scale use (playing with friends), this works perfectly as long as traffic is low enough that Vercel routes your requests to the same hot instance.
- Socket.io is configured to fallback to `polling` to accommodate Serverless Edge networks.

### Recommended Platforms for High-Scale WebSocket Apps
If you want to scale this app to thousands of concurrent users without losing state, consider platforms that support long-running Node.js containers natively (since state is in memory):

1. **Railway** (railway.app)
2. **Render** (render.com)
3. **Google Cloud Run**

## Running the Unit Tests

The core `resolveRound` logic is fully isolated and unit-testable. To execute the test suite:

```bash
npx tsx server/game/resolveRound.test.ts
```
