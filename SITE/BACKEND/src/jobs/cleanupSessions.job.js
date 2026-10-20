import RefreshToken from "../models/RefreshToken.js";

async function cleanupSessions() {
  const result = await RefreshToken.deleteMany({
    $or: [{ expiresAt: { $lte: new Date() } }, { revokedAt: { $ne: null } }],
  });
  return result.deletedCount;
}

function startSessionCleanupJob() {
  const run = async () => {
    try {
      await cleanupSessions();
    } catch (error) {
    }
  };

  run();
  const interval = setInterval(run, 60 * 60 * 1000);
  return () => clearInterval(interval);
}

export default {
  cleanupSessions,
  startSessionCleanupJob,
};
