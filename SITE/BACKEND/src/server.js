import http from "http";
import app from "./app.js";
import _database from "./config/database.js";
import _env from "./config/env.js";
import _seed from "./scripts/seed.js";
import _socketService from "./services/socketService.js";
import _index from "./jobs/index.js";

const { connectDatabase } = _database;
const { env } = _env;
const { backfillPublicIds, seedPlans } = _seed;
const { initSocket } = _socketService;
const { startJobs } = _index;

const server = http.createServer(app);
initSocket(server);

try {
  await connectDatabase();
  await seedPlans();
  await backfillPublicIds();
  const stopJobs = startJobs();
  server.listen(env.PORT, () => { console.log(🔥 Server is running flawlessly on port \); });

  const shutdown = async (signal) => {
    stopJobs?.();
    await new Promise((resolve) => server.close(resolve));
    process.exit(0);
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
} catch (error) {
  process.exit(1);
}
