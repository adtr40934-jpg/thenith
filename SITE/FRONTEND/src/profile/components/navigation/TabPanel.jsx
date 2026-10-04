import { motion } from "motion/react";

export default function TabPanel({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
