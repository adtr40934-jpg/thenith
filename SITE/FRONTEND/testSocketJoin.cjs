const { io } = require("socket.io-client");
const socket = io("http://localhost:3000", {
  path: "/socket.io",
  auth: { guestId: "guest_test" },
});

socket.on("connect", () => {
  console.log("Connected via Vite Proxy! ID:", socket.id);
  socket.emit("joinConversation", "60b8c4d2e8b2a30b4c8d4a1a");
});

socket.on("newMessage", (msg) => {
  console.log("RECEIVED MESSAGE:", msg);
});

setTimeout(() => {
  console.log("Exiting after 5s");
  process.exit(0);
}, 5000);
