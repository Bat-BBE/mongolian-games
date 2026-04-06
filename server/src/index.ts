import cors from "cors";
import express from "express";
import { env } from "./config.js";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";
import { gamesPublicRouter } from "./routes/games.js";
import { adminRouter } from "./routes/admin.js";
import { contentRouter } from "./routes/content.js";
import { leaderboardRouter } from "./routes/leaderboard.js";

const app = express();
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json());

app.use(healthRouter);
app.use("/api", gamesPublicRouter);
app.use("/api/content", contentRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", usersRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});
