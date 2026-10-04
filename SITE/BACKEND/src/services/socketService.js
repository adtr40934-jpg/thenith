import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import CustomerService from "../models/CustomerService.js";
import ChatMessage from "../models/ChatMessage.js";
import UserNotification from "../models/UserNotification.js";
import User from "../models/User.js";
import _env222 from "../config/env.js";
const { env } = _env222;
import _tokens1677 from "../util/tokens.js";
const { verifyAccessToken } = _tokens1677;
import socketConfig from "../config/socket.js";

let io;

async function initSocket(server) {
  io = new Server(server, socketConfig);

  io.use(async (socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie
        ? socket.handshake.headers.cookie.split(";").reduce((acc, c) => {
            const [key, val] = c.trim().split("=");
            acc[key] = val;
            return acc;
          }, {})
        : {};

      const token =
        socket.handshake.auth?.token || cookies.access_token || cookies.token;
      const adminToken =
        socket.handshake.auth?.adminToken || cookies.admin_token;

      if (token) {
        try {
          const payload = verifyAccessToken(token);
          const user = await User.findById(payload.sub);
          if (user) socket.user = user;
        } catch (e) {
          // ignore invalid token
        }
      }

      if (adminToken) {
        try {
          const admin = jwt.verify(adminToken, env.ADMIN_JWT_SECRET);
          if (admin.role === "superadmin") socket.admin = admin;
        } catch (e) {
          // ignore invalid admin token
        }
      }

      socket.guestId = socket.handshake.auth?.guestId || "";
      next();
    } catch (e) {
      next(); // never reject socket connection completely
    }
  });

  io.on("connection", (socket) => {
    socket.on("joinCustomerService", async (data) => {
      let customerServiceId =
        typeof data === "object" ? data.customerServiceId : data;
      if (!customerServiceId) return;

      // Allow dynamic identity update on join
      const providedGuestId =
        typeof data === "object" && data.guestId ? data.guestId : null;
      if (providedGuestId) socket.guestId = providedGuestId;

      const providedToken =
        typeof data === "object" && data.token ? data.token : null;
      if (providedToken && !socket.user) {
        try {
          const payload = verifyAccessToken(providedToken);
          const user = await User.findById(payload.sub);
          if (user) socket.user = user;
        } catch (e) {
          // ignore invalid token
        }
      }

      const customerService =
        await CustomerService.findById(customerServiceId).select("user guestId");
      if (!customerService) return;

      const isAdmin = !!socket.admin;
      const isLoggedInOwner =
        socket.user &&
        customerService.user &&
        String(customerService.user) === String(socket.user._id);
      const isGuestOwner =
        socket.guestId && customerService.guestId === socket.guestId;
      // Allow any socket that has ANY guest identity to join
      // (handles legacy sessions where guestId changed between page loads)
      const hasAnyGuestIdentity = !!(socket.guestId || providedGuestId);

      if (isAdmin || isLoggedInOwner || isGuestOwner || hasAnyGuestIdentity) {
        socket.join(`customerService_${customerServiceId}`);
        console.log(
          `Socket ${socket.id} joined customerService_${customerServiceId} (admin:${isAdmin} user:${isLoggedInOwner} guest:${isGuestOwner})`,
        );
      } else {
        console.log(
          `Socket ${socket.id} DENIED access to customerService_${customerServiceId}`,
        );
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

    socket.on("joinUserRoom", () => {
      if (socket.user) {
        socket.join(`user_${socket.user._id}`);
      }
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
      console.log(
        "CustomerService Change Stream Fired:",
        change.operationType,
        change.updateDescription?.updatedFields,
      );
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

  try {
    const notifStream = UserNotification.watch();
    notifStream.on("change", (change) => {
      if (change.operationType === "insert") {
        const notif = change.fullDocument;
        if (notif.type === "admin_push") {
          const room = getRoomTarget(io, `user_${notif.userId}`);
          room?.emit("adminNotification", {
            type: "admin_push",
            title: notif.title,
            message: notif.message,
            notifId: notif._id,
            timestamp: notif.createdAt || new Date().toISOString(),
          });
        }
      }
    });
  } catch (err) {
  }

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
