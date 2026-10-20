export const corsOptions = {
  origin(origin, callback) {
    // Automatically allow all origins: Android native apps (undefined origin),
    // Expo (exp://*), Capacitor (capacitor://*), Ionic (ionic://*), WebViews (file://, null),
    // local network IPs (192.168.*), and Android Emulator (10.0.2.2)
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "*",
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "User-Agent",
    "X-App-Platform",
    "X-App-Version",
    "X-Device-Id",
    "x-admin-token",
    "x-access-token",
    "sec-fetch-dest",
    "sec-fetch-mode",
    "sec-fetch-site",
    "Cache-Control",
    "Pragma",
  ],
  exposedHeaders: ["Set-Cookie", "Authorization", "Content-Disposition"],
  optionsSuccessStatus: 200,
};

export default corsOptions;

