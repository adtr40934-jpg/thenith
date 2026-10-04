import React, { createContext, useContext, useCallback } from "react";
import Swal from "sweetalert2";
import { useLanguage } from "../hooks/useLanguage.jsx";

const ConfirmContext = createContext();

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }) {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const confirm = useCallback(
    (options) => {
      return new Promise((resolve) => {
        const type = options.type || "warning"; // map danger to warning or error for SweetAlert
        let icon = "warning";
        if (type === "danger") icon = "error";
        else if (type === "info") icon = "info";

        const confirmButtonColor =
          type === "danger"
            ? "#e11d48"
            : type === "warning"
              ? "#d97706"
              : "#4f46e5";

        Swal.fire({
          title: options.title || (isRtl ? "تأكيد" : "Confirm"),
          text: options.message || "",
          icon: icon,
          showCancelButton: true,
          confirmButtonColor: confirmButtonColor,
          cancelButtonColor: "#64748b",
          confirmButtonText:
            options.confirmText || (isRtl ? "تأكيد" : "Confirm"),
          cancelButtonText: options.cancelText || (isRtl ? "إلغاء" : "Cancel"),
          reverseButtons: isRtl, // put cancel on the left if RTL
          customClass: {
            container: "font-sans",
            popup: "rounded-3xl shadow-2xl dark:bg-slate-900",
            title: "text-slate-800 dark:text-white font-black",
            htmlContainer: "text-slate-500 dark:text-slate-400 text-sm",
            confirmButton: "rounded-xl font-bold px-5 py-2.5",
            cancelButton: "rounded-xl font-bold px-5 py-2.5",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    },
    [isRtl],
  );

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
    </ConfirmContext.Provider>
  );
}
