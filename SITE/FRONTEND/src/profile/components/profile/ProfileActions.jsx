import { Phone, UserPlus } from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { motion } from "motion/react";

export default function ProfileActions({
  contact = {},
  labels,
  onSaveContact,
}) {
  const phone = contact.phone || "";
  const whatsapp = contact.whatsapp || phone;
  const cleanPhone = phone.replace(/\\s+/g, "");
  const whatsappPhone = whatsapp.replace(/[^0-9]/g, "");
  const whatsappLink = whatsappPhone ? `https://wa.me/${whatsappPhone}` : "";

  return (
    <>
      <div className="w-full max-w-md px-4 grid grid-cols-2 gap-3 mb-3">
        {cleanPhone && (
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={`tel:${cleanPhone}`}
            data-track-click="true"
            data-track-type="call"
            data-track-section="profile"
            data-track-label={labels.call}
            data-track-url={`tel:${cleanPhone}`}
            className="profile-btn-primary flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm cursor-pointer text-sm "
          >
            <Phone className="w-4 h-4 fill-current shrink-0" />
            <span>{labels.call}</span>
          </motion.a>
        )}

        {whatsappLink && (
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            data-track-click="true"
            data-track-type="whatsapp"
            data-track-section="profile"
            data-track-label={labels.whatsapp}
            data-track-url={whatsappLink}
            className="profile-btn-secondary flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-white dark:bg-slate-950/60 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800/80 hover:border-emerald-200 dark:hover:border-emerald-800/80 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all shadow-sm cursor-pointer text-sm "
          >
            <SiWhatsapp className="w-4 h-4 shrink-0" />
            <span>{labels.whatsapp}</span>
          </motion.a>
        )}
      </div>

      <div className="w-full max-w-md px-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onSaveContact}
          data-track-click="true"
          data-track-type="save_contact"
          data-track-section="profile"
          data-track-label={labels.saveContact}
          className="profile-btn-save w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 transition-all shadow-sm border border-slate-200/40 dark:border-slate-800/50 cursor-pointer text-sm "
        >
          <UserPlus className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
          <span>{labels.saveContact}</span>
        </motion.button>
      </div>
    </>
  );
}
