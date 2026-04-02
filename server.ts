import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize SQLite
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT,
      app_type TEXT,
      chat_history TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // API Routes
  app.post("/api/save-request", async (req, res) => {
    const { client_name, app_type, chat_history } = req.body;
    try {
      await db.run(
        "INSERT INTO requests (client_name, app_type, chat_history) VALUES (?, ?, ?)",
        [client_name || "Anônimo", app_type, JSON.stringify(chat_history)]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving request:", error);
      res.status(500).json({ error: "Failed to save request" });
    }
  });

  app.get("/api/requests", async (req, res) => {
    try {
      const requests = await db.all("SELECT * FROM requests ORDER BY created_at DESC");
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
