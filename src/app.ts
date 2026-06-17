import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { devTools } from "./middleware/devTools.js";
import pool from "./db/pool.js";
import workspaceRoutes from "./modules/workspaces/routes.js";
import userRoutes from "./modules/users/routes.js";
import postRoutes from "./modules/posts/routes.js";
import commentRoutes from "./modules/comments/routes.js";
import likeRoutes from "./modules/likes/routes.js";
import followRoutes from "./modules/follows/routes.js";
import feedRoutes from "./modules/feed/routes.js";
import searchRoutes from "./modules/search/routes.js";
import notificationRoutes from "./modules/notifications/routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(devTools);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from your Node server!!!");
});

app.get("/health", async (req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

app.use("/workspaces", workspaceRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/posts/:postId/comments", commentRoutes);
app.use("/posts/:postId/like", likeRoutes);
app.use("/users/:userId/follow", followRoutes);
app.use("/feed", feedRoutes);
app.use("/search", searchRoutes);
app.use("/notifications", notificationRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `route ${req.method} ${req.path} not found` });
});

app.use(errorHandler);

export default app;
