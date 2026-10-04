import { io } from "socket.io-client";

async function run() {
  const API_URL = "http://localhost:4000/api";

  // 1. Create a guest conversation
  const guestId = "guest_test_" + Date.now();

  const res = await fetch(`${API_URL}/support/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test Socket", guestId }),
  });
  const ticket = await res.json();

  // 2. Connect socket
  const socket = io("http://localhost:4000", {
    path: "/socket.io",
    auth: { guestId },
  });

  socket.on("connect", () => {
    socket.emit("joinConversation", {
      conversationId: ticket._id.toString(),
      token: null,
    });
  });

  socket.on("newMessage", (msg) => {
    process.exit(0);
  });

  await new Promise((r) => setTimeout(r, 2000));
  console.log(
    "Sending message via socket emit to check if we can send to ourselves...",
  );

  // Oh wait, user sends message via HTTP API
  const msgRes = await fetch(
    `${API_URL}/support/conversations/${ticket._id}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, content: "Hello from myself!" }),
    },
  );
  const msg = await msgRes.json();

  setTimeout(() => {
    process.exit(1);
  }, 10000);
}

run().catch((err) => {
  process.exit(1);
});
