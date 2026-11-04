import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function runSqliteEngine(action: string, args: string[] = [], stdinPayload?: string): string {
  const scriptPath = path.resolve(process.cwd(), "server", "sqlite_engine.py");
  const result = spawnSync("python3", [scriptPath, action, ...args], {
    input: stdinPayload,
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (result.error) {
    return JSON.stringify({ ok: false, error: String(result.error) });
  }
  return (result.stdout || "").trim() || JSON.stringify({ ok: false, error: result.stderr });
}

function createSqliteApiMiddleware() {
  return (req: any, res: any, next: () => void) => {
    const rawUrl = req.url || "";
    if (!rawUrl.startsWith("/api/cbt/")) {
      return next();
    }

    const urlObj = new URL(rawUrl, "http://localhost");
    const pathname = urlObj.pathname;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (pathname === "/api/cbt/status" && req.method === "GET") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(runSqliteEngine("status"));
      return;
    }

    if (pathname === "/api/cbt/state" && req.method === "GET") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(runSqliteEngine("load"));
      return;
    }

    if (pathname === "/api/cbt/state" && req.method === "POST") {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      req.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(runSqliteEngine("save", [], body));
      });
      return;
    }

    if (pathname === "/api/cbt/events" && req.method === "GET") {
      const since = urlObj.searchParams.get("since") || "0";
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(runSqliteEngine("event_poll", [since]));
      return;
    }

    if (pathname === "/api/cbt/events" && req.method === "POST") {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      req.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(runSqliteEngine("event_push", [], body));
      });
      return;
    }

    if (pathname === "/api/cbt/download-sqlite" && req.method === "GET") {
      // Trigger status first to ensure DB file exists
      runSqliteEngine("status");
      const dbFile = path.resolve(process.cwd(), "database", "jn_cbt_server.sqlite");
      if (!fs.existsSync(dbFile)) {
        res.statusCode = 404;
        res.end("SQLite file not found");
        return;
      }
      const stat = fs.statSync(dbFile);
      res.setHeader("Content-Type", "application/x-sqlite3");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="jn_cbt_server_${Date.now()}.sqlite"`
      );
      res.setHeader("Content-Length", String(stat.size));
      fs.createReadStream(dbFile).pipe(res);
      return;
    }

    return next();
  };
}

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "jn-cbt-sqlite-lan-server",
      configureServer(server) {
        server.middlewares.use(createSqliteApiMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createSqliteApiMiddleware());
      },
    },
  ],
  server: {
    port: 5174,
    host: true,
    allowedHosts: true,
  },
  preview: {
    port: 5174,
    host: true,
    allowedHosts: true,
  },
});
