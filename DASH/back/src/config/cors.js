import _env from "./env.js";

const { env, clientOrigins } = _env;

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://192.168.1.8:3000"
];

const normalizeOrigin = (value) => (value || "").trim().replace(/\/+$/, "");
const allowedOrigins = new Set(
  [...defaultOrigins, ...clientOrigins].map(normalizeOrigin).filter(Boolean),
);

export const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);
    const isLocalOrigin = /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?$/.test(
      normalizedOrigin,
    );

    if (isLocalOrigin || allowedOrigins.has(normalizedOrigin)) {
      return callback(null, normalizedOrigin);
    }

    return callback(new Error("Admin Dashboard CORS: Origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 204,
};

export default corsOptions;
