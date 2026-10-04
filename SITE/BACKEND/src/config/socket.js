import _env from "./env.js";
const { env, clientOrigins } = _env;

export const socketConfig = {
  cors: {
    origin: clientOrigins,
    credentials: true,
  },
  pingTimeout: env.SOCKET_PING_TIMEOUT || 60000,
  pingInterval: env.SOCKET_PING_INTERVAL || 25000,
  maxHttpBufferSize: env.SOCKET_MAX_HTTP_BUFFER_SIZE || 1e6, // 1MB
  path: env.SOCKET_PATH || "/socket.io",
};

export default socketConfig;
