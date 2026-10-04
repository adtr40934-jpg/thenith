import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import CustomerService from "../models/CustomerService.js";
import User from "../models/User.js";
import _env222 from "../config/env.js";
const { clientOrigins, env } = _env222;
import _tokens1677 from "../util/tokens.js";
const { verifyAccessToken } = _tokens1677;

let io;

async function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: clientOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const adminToken = socket.handshake.auth?.adminToken;
      if (token) {
        try {
          const payload = verifyAccessToken(token);
          const user = await User.findById(payload.sub);
          if (user) socket.user = user;
        } catch { /* invalid user token — skip */ }
      }
      if (adminToken) {
        try {
          const admin = jwt.verify(adminToken, env.ADMIN_JWT_SECRET);
          if (admin.role === "superadmin") socket.admin = admin;
        } catch { /* invalid admin token — skip */ }
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
      if (socket.admin) socket.join("admin_room");
    });
  });

  return io;
}

async function getIO() {
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
