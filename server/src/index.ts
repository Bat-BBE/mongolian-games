import cors from "cors";
import express from "express";
import { mkdirSync } from "node:fs";
import {
  createServer,
  type IncomingMessage,
  type ServerOptions,
} from "node:http";
import { join } from "node:path";
import { env } from "./config.js";
import { MatchRoomManager } from "./realtime/matchRooms.js";
import { createMatchWebSocketServer } from "./realtime/matchWs.js";
import { createMapPresenceWebSocketServer } from "./realtime/mapPresenceWs.js";
import { MapPresenceShardRouter } from "./realtime/mapPresenceRouter.js";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";
import { gamesPublicRouter } from "./routes/games.js";
import { adminRouter } from "./routes/admin.js";
import { contentRouter } from "./routes/content.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { gameRouter } from "./routes/game.js";

const app = express();
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(express.json());

const uploadsDir = join(process.cwd(), "uploads");
mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.use(healthRouter);
app.use("/api", gamesPublicRouter);
app.use("/api/content", contentRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/game", gameRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", usersRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

function upgradePathname(req: IncomingMessage): string {
  const raw = req.url ?? "/";
  const q = raw.indexOf("?");
  return q === -1 ? raw : raw.slice(0, q);
}

const matchRooms = new MatchRoomManager();
const mapPresenceRouter = new MapPresenceShardRouter();

const server = createServer(
  {
    shouldUpgradeCallback(
      this: import("node:http").Server,
      req: IncomingMessage,
    ) {
      const p = upgradePathname(req);
      if (p === "/ws/match" || p === "/ws/map-presence") return true;
      return this.listenerCount("upgrade") > 0;
    },
  } as ServerOptions,
  app,
);

const wssMatch = createMatchWebSocketServer(matchRooms);
const wssPresence = createMapPresenceWebSocketServer(mapPresenceRouter);

server.on("upgrade", (req, socket, head) => {
  const path = upgradePathname(req);
  if (path === "/ws/match") {
    wssMatch.handleUpgrade(req, socket, head, (ws) => {
      wssMatch.emit("connection", ws, req);
    });
    return;
  }
  if (path === "/ws/map-presence") {
    wssPresence.handleUpgrade(req, socket, head, (ws) => {
      wssPresence.emit("connection", ws, req);
    });
    return;
  }
  socket.destroy();
});

function attachWsServerErrorHandler(
  wss: { on: (ev: "error", fn: (err: NodeJS.ErrnoException) => void) => void },
  label: string,
) {
  wss.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") return;
    console.error(`[server] ${label} WebSocket error:`, err);
  });
}
attachWsServerErrorHandler(wssMatch, "match");
attachWsServerErrorHandler(wssPresence, "map-presence");

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[server] Port ${env.PORT} is already in use. Close the other process (or set PORT in .env).`,
    );
  } else {
    console.error("[server] HTTP listen error:", err);
  }
  process.exit(1);
});

/** Cloud (Railway/Render г.м.) нь ихэвчлэн бүх интерфейс дээр сонсохыг шаарддаг */
server.listen(env.PORT, "0.0.0.0", () => {
  const nUp = server.listenerCount("upgrade");
  console.log(`API listening on http://0.0.0.0:${env.PORT}`);
  console.log(`Match WebSocket: ws://localhost:${env.PORT}/ws/match`);
  console.log(`Map presence: ws://localhost:${env.PORT}/ws/map-presence`);
  if (nUp < 1) {
    console.error(
      "[server] BUG: no HTTP 'upgrade' listeners — map-presence WebSocket will fail. Restart from repo root: npm run dev:server",
    );
  } else {
    console.log(`[server] WebSocket upgrade handler(s): ${nUp}`);
  }
});
