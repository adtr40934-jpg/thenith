import RefreshToken from "../models/RefreshToken.js";

async function cleanupSessions() {
  const result = await RefreshToken.deleteMany({
    $or: [{ expiresAt: { $lte: new Date() } }, { revokedAt: { $ne: null } }],
  });
  return result.deletedCount;
}

async function startSessionCleanupJob() {
  const run = async () => {
    try {
      const deletedCount = await cleanupSessions();
      if (deletedCount) {
        console.log(
          `[Job:cleanupSessions] Deleted ${deletedCount} refresh sessions.`,
        );
      }
    } catch (error) {
    }
  };

  run();
  const interval = setInterval(run, 60 * 60 * 1000);
  return () => clearInterval(interval);
}


export default {
  cleanupSessions,
  startSessionCleanupJob
};
