const { io } = require("socket.io-client");
const socket = io("http://localhost:4000", {
  path: "/socket.io",
  auth: { guestId: "guest_test" },
});

socket.on("connect", () => {
  console.log("Connected!");
  socket.emit("joinConversation", "60b8c4d2e8b2a30b4c8d4a1a"); // Just a fake ID
  setTimeout(() => {
    console.log("Waited 2s");
    process.exit(0);
  }, 2000);
});

socket.on("connect_error", (err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
