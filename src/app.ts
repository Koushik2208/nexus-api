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
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta property="og:title" content="Nexus API" />
  <meta property="og:description" content="A social-media-style backend API for frontend development. Ready to use, no setup required." />
  <title>Nexus API</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0a0a0a;
      color: #e4e4e7;
      min-height: 100vh;
      padding: 48px 24px;
    }

    .container {
      max-width: 860px;
      margin: 0 auto;
    }

    /* Header */
    .header {
      margin-bottom: 56px;
    }

    .badge {
      display: inline-block;
      background: #18181b;
      border: 1px solid #27272a;
      color: #a1a1aa;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 20px;
    }

    h1 {
      font-size: clamp(36px, 6vw, 56px);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.1;
      color: #ffffff;
      margin-bottom: 16px;
    }

    h1 span {
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .tagline {
      font-size: 18px;
      color: #71717a;
      line-height: 1.6;
      max-width: 520px;
      margin-bottom: 32px;
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: opacity 0.15s;
    }
    .btn:hover { opacity: 0.85; }

    .btn-primary {
      background: #6366f1;
      color: #fff;
    }

    .btn-secondary {
      background: #18181b;
      border: 1px solid #27272a;
      color: #e4e4e7;
    }

    /* Stats */
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      margin-bottom: 48px;
    }

    .stat {
      background: #111111;
      border: 1px solid #1f1f1f;
      border-radius: 12px;
      padding: 20px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .stat-label {
      font-size: 13px;
      color: #52525b;
      margin-top: 4px;
    }

    /* Sections */
    .section-title {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #52525b;
      margin-bottom: 16px;
    }

    /* Endpoint groups */
    .groups {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 48px;
    }

    .group {
      background: #111111;
      border: 1px solid #1f1f1f;
      border-radius: 12px;
      padding: 20px;
    }

    .group-name {
      font-size: 13px;
      font-weight: 600;
      color: #a1a1aa;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .endpoint {
      display: flex;
      align-items: baseline;
      gap: 10px;
      padding: 5px 0;
      font-size: 13px;
      border-bottom: 1px solid #1a1a1a;
    }
    .endpoint:last-child { border-bottom: none; }

    .method {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
      width: 48px;
      text-align: center;
    }
    .get    { background: #0f2a1a; color: #34d399; }
    .post   { background: #1a1f3a; color: #818cf8; }
    .delete { background: #2a0f0f; color: #f87171; }
    .patch  { background: #1a2a1a; color: #86efac; }

    .path {
      color: #d4d4d8;
      font-family: "SF Mono", "Fira Code", monospace;
      font-size: 12px;
    }

    /* Features */
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 48px;
    }

    .feature {
      background: #111111;
      border: 1px solid #1f1f1f;
      border-radius: 10px;
      padding: 16px;
    }

    .feature-icon {
      font-size: 20px;
      margin-bottom: 8px;
    }

    .feature-title {
      font-size: 14px;
      font-weight: 600;
      color: #e4e4e7;
      margin-bottom: 4px;
    }

    .feature-desc {
      font-size: 12px;
      color: #52525b;
      line-height: 1.5;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #1a1a1a;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .footer-text {
      font-size: 13px;
      color: #3f3f46;
    }

    .footer-links {
      display: flex;
      gap: 16px;
    }

    .footer-links a {
      font-size: 13px;
      color: #52525b;
      text-decoration: none;
    }
    .footer-links a:hover { color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <div class="badge">REST API &nbsp;·&nbsp; v1.0</div>
      <h1>Nexus <span>API</span></h1>
      <p class="tagline">
        A social-media-style backend built for frontend development.
        Realistic data, zero setup — just create a workspace and start building.
      </p>
      <div class="actions">
        <a class="btn btn-primary" href="/health">Check Health</a>
        <a class="btn btn-secondary" href="https://github.com/Koushik2208/nexus-api#readme" target="_blank">Documentation</a>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-value">25</div>
        <div class="stat-label">Endpoints</div>
      </div>
      <div class="stat">
        <div class="stat-value">8</div>
        <div class="stat-label">DB Tables</div>
      </div>
      <div class="stat">
        <div class="stat-value">∞</div>
        <div class="stat-label">Workspaces</div>
      </div>
      <div class="stat">
        <div class="stat-value">0</div>
        <div class="stat-label">Config needed</div>
      </div>
    </div>

    <p class="section-title">Endpoints</p>
    <div class="groups">

      <div class="group">
        <div class="group-name">Workspaces</div>
        <div class="endpoint"><span class="method post">POST</span><span class="path">/workspaces</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/workspaces</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/workspaces/:id</span></div>
        <div class="endpoint"><span class="method post">POST</span><span class="path">/workspaces/:id/reset</span></div>
        <div class="endpoint"><span class="method post">POST</span><span class="path">/workspaces/:id/import</span></div>
      </div>

      <div class="group">
        <div class="group-name">Users</div>
        <div class="endpoint"><span class="method post">POST</span><span class="path">/users</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/users</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/users/:id</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/users/:id/posts</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/users/:id/stats</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/users/:id/followers</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/users/:id/following</span></div>
      </div>

      <div class="group">
        <div class="group-name">Posts</div>
        <div class="endpoint"><span class="method post">POST</span><span class="path">/posts</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/posts/:id</span></div>
        <div class="endpoint"><span class="method delete">DEL</span><span class="path">/posts/:id</span></div>
        <div class="endpoint"><span class="method post">POST</span><span class="path">/posts/:id/comments</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/posts/:id/comments</span></div>
        <div class="endpoint"><span class="method post">POST</span><span class="path">/posts/:id/like</span></div>
        <div class="endpoint"><span class="method delete">DEL</span><span class="path">/posts/:id/like</span></div>
      </div>

      <div class="group">
        <div class="group-name">Social</div>
        <div class="endpoint"><span class="method post">POST</span><span class="path">/users/:id/follow</span></div>
        <div class="endpoint"><span class="method delete">DEL</span><span class="path">/users/:id/follow</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/feed</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/search</span></div>
        <div class="endpoint"><span class="method get">GET</span><span class="path">/notifications</span></div>
        <div class="endpoint"><span class="method patch">PATCH</span><span class="path">/notifications/:id/read</span></div>
      </div>

    </div>

    <p class="section-title">Features</p>
    <div class="features">
      <div class="feature">
        <div class="feature-icon">🔑</div>
        <div class="feature-title">Workspace Isolation</div>
        <div class="feature-desc">Every project gets its own private space. Data never leaks between workspaces.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">📄</div>
        <div class="feature-title">Bulk Import</div>
        <div class="feature-desc">Upload a CSV or Excel file to seed your workspace with realistic data instantly.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">📜</div>
        <div class="feature-title">Cursor Pagination</div>
        <div class="feature-desc">All list endpoints support fast, stable cursor-based pagination.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🧪</div>
        <div class="feature-title">Frontend Testing</div>
        <div class="feature-desc">Simulate loading, errors, empty states, and partial data with a single query param.</div>
      </div>
    </div>

    <div class="footer">
      <span class="footer-text">Built by Koushik · Node.js · TypeScript · PostgreSQL</span>
      <div class="footer-links">
        <a href="/health">Health</a>
        <a href="https://github.com/Koushik2208/nexus-api" target="_blank">GitHub</a>
      </div>
    </div>

  </div>
</body>
</html>`);
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
