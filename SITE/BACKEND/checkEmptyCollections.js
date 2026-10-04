import mongoose from "mongoose";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { setServers } from "node:dns/promises";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, ".env") });

if (process.env.MONGODB_DNS_SERVERS) {
  setServers(
    process.env.MONGODB_DNS_SERVERS.split(",")
      .map((server) => server.trim())
      .filter(Boolean),
  );
}

await mongoose.connect(process.env.MONGODB_URI);

const collections = await mongoose.connection.db.listCollections().toArray();
for (const c of collections) {
  const count = await mongoose.connection.db.collection(c.name).countDocuments();
}

await mongoose.disconnect();
