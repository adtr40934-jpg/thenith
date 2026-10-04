import { motion } from "motion/react";
import SupportWidget from "../../../components/SupportWidget.jsx";

export default function SupportPage({ t, language, isVisible }) {
  return (
    <motion.section
      initial={false}
      animate={isVisible ? "visible" : "hidden"}
      variants={{
        visible: { opacity: 1, y: 0, display: "block", transition: { duration: 0.3 } },
        hidden: { opacity: 0, y: -15, transitionEnd: { display: "none" }, transition: { duration: 0.3 } }
      }}
      className="space-y-4"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <SupportWidget embedded isVisible={isVisible} />
    </motion.section>
  );
}
