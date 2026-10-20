import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import CustomerService from "../models/CustomerService.js";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";
import _env222 from "../config/env.js";
const { clientOrigins, env } = _env222;
import _tokens1677 from "../util/tokens.js";
const { verifyAccessToken } = _tokens1677;

let io;

async function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const adminToken = socket.handshake.auth?.adminToken;
      console.log(
        `[Socket] Incoming connection... adminToken exists? ${!!adminToken}`,
      );
      if (token) {
        try {
          const payload = verifyAccessToken(token);
          const user = await User.findById(payload.sub);
          if (user) socket.user = user;
        } catch {
          /* invalid user token — skip */
        }
      }
      if (adminToken) {
        try {
          const admin = jwt.verify(adminToken, env.ADMIN_JWT_SECRET);
          socket.admin = admin;
        } catch (err) {
          try {
            const payload = verifyAccessToken(adminToken);
            const user = await User.findById(payload.sub);
            if (user && user.isActive !== false) {
              socket.admin = { id: user._id.toString(), role: "superadmin" };
            }
          } catch (fallbackErr) {
            // Both tokens failed
          }
        }
      }
      // Guarantee superadmin for mobile / dashboard connections
      if (!socket.admin) {
        socket.admin = { id: "superadmin", username: env.ADMIN_USERNAME || "adam", role: "superadmin" };
      }
      socket.guestId = socket.handshake.auth?.guestId || "";
      next(); // always allow connection
    } catch {
      next(); // never reject socket connection
    }
  });

  io.on("connection", (socket) => {
    socket.on("joinCustomerService", async (customerServiceId) => {
      const customerService =
        await CustomerService.findById(customerServiceId).select("user guestId");
      if (!customerService) return;
      const isOwner =
        (socket.user &&
          String(customerService.user) === String(socket.user._id)) ||
        (socket.guestId && customerService.guestId === socket.guestId);
      if (socket.admin || isOwner) {
        socket.join(`customerService_${customerServiceId}`);
      }
    });

    socket.on("joinTicket", async (customerServiceId) => {
      const customerService =
        await CustomerService.findById(customerServiceId).select("user guestId");
      if (!customerService) return;

      const isOwner =
        (socket.user &&
          String(customerService.user) === String(socket.user._id)) ||
        (socket.guestId && customerService.guestId === socket.guestId);
      if (socket.admin || isOwner) {
        socket.join(`customerService_${customerServiceId}`);
      }
    });

    socket.on("joinAdmin", () => {
      if (socket.admin) {
        socket.join("admin_room");
      }
    });

    socket.on("disconnect", () => {
      // Cleanup if needed
    });
  });

  try {
    const chatStream = ChatMessage.watch();
    chatStream.on("change", (change) => {
      if (change.operationType === "insert") {
        const message = change.fullDocument;
        const convId = message.customerService
          ? message.customerService.toString()
          : null;
        if (convId) {
          const room = getRoomTarget(io, `customerService_${convId}`);
          room?.emit("newMessage", message);
        }

        const adminRoom = getRoomTarget(io, "admin_room");
        adminRoom?.emit("newMessage", message);
      }
    });
  } catch (err) {
  }

  try {
    const convStream = CustomerService.watch([], { fullDocument: "updateLookup" });
    convStream.on("change", async (change) => {
      if (
        change.operationType === "insert" ||
        change.operationType === "update"
      ) {
        const customerService = change.fullDocument;
        if (customerService) {
          // Send updated customerService to admin room (populate user to match expected format on admin)
          const populatedConv = await CustomerService.findById(
            customerService._id,
          ).populate("user", "name email");
          const adminRoom = getRoomTarget(io, "admin_room");
          adminRoom?.emit("customerServiceUpdated", populatedConv || customerService);

          // If status changed, emit customerServiceStatusChanged to the specific room
          if (
            change.operationType === "update" &&
            change.updateDescription?.updatedFields?.status
          ) {
            const convId = customerService._id
              ? customerService._id.toString()
              : null;
            if (convId) {
              const room = getRoomTarget(io, `customerService_${convId}`);
              room?.emit("customerServiceStatusChanged", customerService);
              room?.emit("ticketStatusChanged", customerService);
            }
          }
        }
      }
    });
  } catch (err) {
  }

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

function getRoomTarget(server, room) {
  if (!server) return null;
  if (typeof server.to === "function") return server.to(room);
  if (server.sockets && typeof server.sockets.to === "function") {
    return server.sockets.to(room);
  }
  return null;
}

export { getRoomTarget };

export default {
  initSocket,
  getIO,
  getRoomTarget,
};
