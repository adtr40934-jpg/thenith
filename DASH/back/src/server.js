import http from "http";
import app from "./app.js";
import _database from "./config/database.js";
import _env from "./config/env.js";
import _socketService from "./services/socketService.js";
import { setIO } from "./middleware/securityAudit.js";

const { connectDatabase } = _database;
const { env, clientOrigins } = _env;
const { initSocket } = _socketService;

// Make allowed origins available globally for isExternal detection in middleware
global._allowedOrigins = clientOrigins;

const server = http.createServer(app);
const ioInstance = await initSocket(server);
setIO(ioInstance);

try {
  await connectDatabase();

  server.listen(env.PORT, () => {
    console.log(`🔥 Admin Server is running flawlessly on port ${env.PORT}`);
    console.log(
      `Admin Health:    http://localhost:${env.PORT}/api/admin/health`,
    );
    console.log(
      `Admin Login:     http://localhost:${env.PORT}/api/admin/login`,
    );
    console.log(
      "Status:          Running completely standalone on this machine",
    );
  });

  const shutdown = async (signal) => {
    await new Promise((resolve) => server.close(resolve));
    process.exit(0);
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
} catch (error) {
  process.exit(1);
}
