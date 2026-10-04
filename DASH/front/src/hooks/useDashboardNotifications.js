import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useDashboardNotifications(pathname) {
  const [unreadTabCount, setUnreadTabCount] = useState(0);
  const [navNotificationCount, setNavNotificationCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState(null);

  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token");
    const socket = io(import.meta.env.VITE_API_BASE_URL.replace("/api", ""), {
      auth: { adminToken },
    });

    socket.on("connect", () => {
      socket.emit("joinAdmin");
    });

    socket.on("newMessage", (message) => {
      if (message.senderModel === "Guest" || message.senderModel === "User") {
        if (pathname !== "/dashboard/support" && pathname !== "/support") {
          setNavNotificationCount((prev) => prev + 1);
          setLatestMessage(message);

          if (document.hidden) {
            setUnreadTabCount((prev) => prev + 1);
          }

          const audioEl =
            document.getElementById("admin-global-notify") ||
            new Audio("/sounds/digital-notification.mp3");
          audioEl.volume = 0.8;
          audioEl
            .play()
            .catch((e) => );

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("رسالة جديدة من عميل", {
              body: message.content,
              icon: "/favicon.ico",
            });
          }
        }
      }
    });

    return () => socket.disconnect();
  }, [pathname]);

  useEffect(() => {
    const handleFocus = () => setUnreadTabCount(0);
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const clearNotifications = () => {
    setNavNotificationCount(0);
    setLatestMessage(null);
  };

  return {
    unreadTabCount,
    navNotificationCount,
    latestMessage,
    clearNotifications,
    clearUnread: () => setUnreadTabCount(0),
  };
}
