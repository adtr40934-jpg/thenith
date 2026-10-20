import mongoose from "mongoose";
import _env9406 from "./env.js";
const { env } = _env9406;
import { setServers } from "node:dns/promises";

async function connectDatabase() {
  if (env.MONGODB_DNS_SERVERS) {
    setServers(
      env.MONGODB_DNS_SERVERS.split(",")
        .map((server) => server.trim())
        .filter(Boolean),
    );
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 50,
    minPoolSize: 10,
    maxIdleTimeMS: 60000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  });
  console.log(`Successfully connected to MongoDB Database`);
}


export default { connectDatabase };
