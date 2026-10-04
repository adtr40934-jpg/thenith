import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import User from "../models/User.js";
import _env6627 from "../config/env.js";
const { env  } = _env6627;

async function makeAdmin() {
  await mongoose.connect(env.MONGODB_URI);
  const email = process.argv[2];
  if (!email) {
    console.error(
      "Please provide an email: node makeAdmin.js admin@example.com",
    );
    process.exit(1);
  }

  const user = await User.findOneAndUpdate(
    { email },
    { role: "admin" },
    { new: true },
  );

  if (user) {
  } else {
  }

  await mongoose.disconnect();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  makeAdmin().catch(async (error) => {
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}
