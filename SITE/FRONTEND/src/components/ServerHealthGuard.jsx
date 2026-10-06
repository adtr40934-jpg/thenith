import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function ServerHealthGuard({ children }) {
  const [isServerUp, setIsServerUp] = useState(false);
  const [showConnecting, setShowConnecting] = useState(false);

  useEffect(() => {
    let intervalId;

    const checkHealth = async () => {
      try {
        await axios.get("/api/health", { timeout: 3000 });
        if (!isServerUp) setIsServerUp(true);
      } catch (err) {
        if (isServerUp) setIsServerUp(false);
      }
    };

    // Show the connecting UI only if it takes more than 1s (to avoid flashing on fast networks)
    const timeoutId = setTimeout(() => {
      if (!isServerUp) setShowConnecting(true);
    }, 1000);

    // Initial check
    checkHealth();
    
    // Poll every 3 seconds
    intervalId = setInterval(checkHealth, 3000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isServerUp]);

  if (!isServerUp) {
    return (
      <AnimatePresence>
        {showConnecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900/80 shadow-[0_0_40px_rgba(99,102,241,0.2)] backdrop-blur-xl border border-slate-800/60">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-3">Connecting to Server</h2>
            <p className="text-slate-400 font-medium">Please wait while we establish a secure connection...</p>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return children;
}
