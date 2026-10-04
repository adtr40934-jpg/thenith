const { io } = require("socket.io-client");
// Connect via Vite Proxy
const socket = io("http://localhost:3000", {
  path: "/socket.io",
  auth: { guestId: "guest_test" },
});

socket.on("connect", () => {
  console.log("Connected via Vite Proxy!");
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("Error via Vite Proxy:", err.message);
  process.exit(1);
});
