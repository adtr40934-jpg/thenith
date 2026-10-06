import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Palette } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const MiniProfile = ({ active, bg, cardBg, cardBorder, avatarBg, avatarBorder, textPrimary, textSecondary, btnPrimary, btnSecondary, btnSecondaryBorder, glow, ringColor }) => (
  <div
    className={`w-full h-full rounded-[1.25rem] lg:rounded-xl overflow-hidden flex flex-col items-center p-2 lg:p-1.5 pt-4 lg:pt-2 transition-all relative ${
      active ? `ring-2 ring-offset-2 ${ringColor || "ring-indigo-500 dark:ring-offset-slate-950"}` : ""
    }`}
    style={{ background: bg }}
  >
    {glow && (
      <div
        className="absolute w-12 h-12 rounded-full opacity-30 blur-sm"
        style={{ background: "radial-gradient(circle,#6366f1,transparent)", top: "-10px", right: "-5px" }}
      />
    )}
    
    <div 
      className="w-full flex-1 flex flex-col items-center p-2 rounded-2xl lg:rounded-[0.6rem] border shadow-sm relative z-10"
      style={{ background: cardBg, borderColor: cardBorder }}
    >
      <div 
        className="w-10 h-10 lg:w-7 lg:h-7 rounded-full border-2 mb-2 lg:mb-1.5 flex items-center justify-center shrink-0" 
        style={{ borderColor: avatarBorder || cardBorder, background: avatarBg || cardBg }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2" style={{ color: textSecondary }}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      
      <div className="w-16 lg:w-12 h-2 lg:h-1.5 rounded-full mb-1.5 lg:mb-1 shrink-0" style={{ background: textPrimary }} />
      <div className="w-10 lg:w-8 h-1.5 lg:h-1 rounded-full mb-3 lg:mb-2 shrink-0" style={{ background: textSecondary }} />
      
      <div className="w-full h-6 lg:h-4 rounded-lg lg:rounded-sm mb-1.5 lg:mb-1 border shrink-0" style={{ background: btnPrimary, borderColor: "transparent" }} />
      <div className="w-full h-6 lg:h-4 rounded-lg lg:rounded-sm border shrink-0" style={{ background: btnSecondary, borderColor: btnSecondaryBorder || cardBorder }} />
    </div>
  </div>
);

const THEMES = [
  {
    id: "default",
    nameEn: "Default", nameAr: "الافتراضي",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="linear-gradient(135deg, #f8fafc 50%, #020617 50%)"
        cardBg="linear-gradient(135deg, #ffffff 50%, #0f172a 50%)"
        cardBorder="#e2e8f0"
        textPrimary="#1e293b"
        textSecondary="#94a3b8"
        btnPrimary="#0f172a"
        btnSecondary="#ffffff"
      />
    ),
  },
  {
    id: "glass_dark",
    nameEn: "Appearance 3", nameAr: "المظهر 3",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="linear-gradient(135deg,#0a0f1e 0%,#0f172a 50%,#0d1225 100%)"
        cardBg="rgba(255,255,255,0.06)"
        cardBorder="rgba(255,255,255,0.10)"
        textPrimary="#818cf8"
        textSecondary="rgba(255,255,255,0.4)"
        btnPrimary="rgba(99,102,241,0.75)"
        btnSecondary="rgba(16,185,129,0.12)"
        btnSecondaryBorder="rgba(16,185,129,0.25)"
        glow={true}
        ringColor="ring-indigo-400 ring-offset-[#0a0f1e]"
      />
    ),
  },
  {
    id: "glass_light",
    nameEn: "Appearance 4", nameAr: "المظهر 4",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="linear-gradient(135deg,#dde8f8 0%,#eaf0fb 50%,#f0f4ff 100%)"
        cardBg="rgba(255,255,255,0.65)"
        cardBorder="rgba(255,255,255,0.90)"
        textPrimary="#6366f1"
        textSecondary="rgba(15,23,42,0.4)"
        btnPrimary="rgba(99,102,241,0.85)"
        btnSecondary="rgba(255,255,255,0.70)"
        btnSecondaryBorder="rgba(100,116,139,0.18)"
        ringColor="ring-blue-400 ring-offset-white"
      />
    ),
  },
  {
    id: "stormy_morning",
    nameEn: "Appearance 5", nameAr: "المظهر 5",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="#ECEFF1"
        cardBg="#FFFFFF"
        cardBorder="#CFD8DC"
        textPrimary="#263238"
        textSecondary="#90A4AE"
        btnPrimary="#3F51B5"
        btnSecondary="#E8EAF6"
        btnSecondaryBorder="transparent"
        ringColor="ring-[#3F51B5]"
      />
    ),
  },
  {
    id: "material_emerald",
    nameEn: "Appearance 6", nameAr: "المظهر 6",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="#E8F5E9"
        cardBg="#FFFFFF"
        cardBorder="#C8E6C9"
        textPrimary="#1B5E20"
        textSecondary="#81C784"
        btnPrimary="#2E7D32"
        btnSecondary="#E8F5E9"
        btnSecondaryBorder="transparent"
        ringColor="ring-[#2E7D32]"
      />
    ),
  },
  {
    id: "royal_purple",
    nameEn: "Appearance 7", nameAr: "المظهر 7",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="#F3E5F5"
        cardBg="#FFFFFF"
        cardBorder="#E1BEE7"
        textPrimary="#4A148C"
        textSecondary="#BA68C8"
        btnPrimary="#6A1B9A"
        btnSecondary="#F3E5F5"
        btnSecondaryBorder="transparent"
        ringColor="ring-[#6A1B9A]"
      />
    ),
  },
  {
    id: "crimson_red",
    nameEn: "Appearance 8", nameAr: "المظهر 8",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="#FFEBEE"
        cardBg="#FFFFFF"
        cardBorder="#FFCDD2"
        textPrimary="#B71C1C"
        textSecondary="#E57373"
        btnPrimary="#C62828"
        btnSecondary="#FFEBEE"
        btnSecondaryBorder="transparent"
        ringColor="ring-[#C62828]"
      />
    ),
  },
  {
    id: "sunset_orange",
    nameEn: "Appearance 9", nameAr: "المظهر 9",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="#FFF3E0"
        cardBg="#FFFFFF"
        cardBorder="#FFE0B2"
        textPrimary="#E65100"
        textSecondary="#FFB74D"
        btnPrimary="#EF6C00"
        btnSecondary="#FFF3E0"
        btnSecondaryBorder="transparent"
        ringColor="ring-[#EF6C00]"
      />
    ),
  },
  {
    id: "ocean_blue",
    nameEn: "Appearance 10", nameAr: "المظهر 10",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="#E1F5FE"
        cardBg="#FFFFFF"
        cardBorder="#B3E5FC"
        textPrimary="#01579B"
        textSecondary="#4FC3F7"
        btnPrimary="#0288D1"
        btnSecondary="#E1F5FE"
        btnSecondaryBorder="transparent"
        ringColor="ring-[#0288D1]"
      />
    ),
  },
  {
    id: "teal_breeze",
    nameEn: "Appearance 11", nameAr: "المظهر 11",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="#E0F2F1"
        cardBg="#FFFFFF"
        cardBorder="#B2DFDB"
        textPrimary="#004D40"
        textSecondary="#4DB6AC"
        btnPrimary="#00796B"
        btnSecondary="#E0F2F1"
        btnSecondaryBorder="transparent"
        ringColor="ring-[#00796B]"
      />
    ),
  },
  {
    id: "rose_gold",
    nameEn: "Appearance 12", nameAr: "المظهر 12",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="#FCE4EC"
        cardBg="#FFFFFF"
        cardBorder="#F8BBD0"
        textPrimary="#880E4F"
        textSecondary="#F06292"
        btnPrimary="#C2185B"
        btnSecondary="#FCE4EC"
        btnSecondaryBorder="transparent"
        ringColor="ring-[#C2185B]"
      />
    ),
  },
  {
    id: "midnight_amber",
    nameEn: "Appearance 13", nameAr: "المظهر 13",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="#1a1a1a"
        cardBg="#2a2a2a"
        cardBorder="#3a3a3a"
        textPrimary="#F9FAFB"
        textSecondary="#D1D5DB"
        btnPrimary="#F59E0B"
        btnSecondary="rgba(245,158,11,0.12)"
        btnSecondaryBorder="rgba(245,158,11,0.30)"
        ringColor="ring-[#F59E0B] ring-offset-[#1a1a1a]"
      />
    ),
  },
  {
    id: "slate_dark",
    nameEn: "Appearance 14", nameAr: "المظهر 14",
    preview: (props) => (
      <MiniProfile
        {...props}
        active={props.active}
        bg="#0f172a"
        cardBg="#1e293b"
        cardBorder="#334155"
        textPrimary="#F1F5F9"
        textSecondary="#CBD5E1"
        btnPrimary="#22D3EE"
        btnSecondary="rgba(34,211,238,0.10)"
        btnSecondaryBorder="rgba(34,211,238,0.25)"
        ringColor="ring-[#22D3EE] ring-offset-[#0f172a]"
      />
    ),
  },
];

export default function ThemeSection({ t, language, card, onUpdateCard }) {
  const isArabic = language === "ar";
  const currentTheme = card.theme || "default";

  const handleSelect = (themeId) => {
    onUpdateCard((prev) => ({ ...prev, theme: themeId }));
  };

  const carouselRef = useRef(null);

  useEffect(() => {
    // Initial scroll to the currently selected theme when the tab opens
    if (carouselRef.current) {
      const activeElement = carouselRef.current.querySelector(`[data-theme-id="${currentTheme}"]`);
      if (activeElement) {
        // Use a tiny delay to ensure the DOM is fully rendered in the tab
        setTimeout(() => {
          activeElement.scrollIntoView({ behavior: "instant", inline: "center", block: "nearest" });
        }, 50);
      }
    }
  }, []);

  const handleCardClick = (themeId, e) => {
    handleSelect(themeId);
    e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const currentThemeIndex = THEMES.findIndex((t) => t.id === currentTheme);
  const activeThemeObj = THEMES[currentThemeIndex] || THEMES[0];

  return (
    <div className="flex flex-col gap-6 w-full overflow-hidden pt-4" dir={isArabic ? "rtl" : "ltr"}>
      {/* Swipeable Card Carousel */}
      <div className="w-full relative -mx-4 px-4 sm:mx-0 sm:px-0 flex justify-center">
        <div 
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-[calc(50%-110px)] sm:px-[calc(50%-130px)] py-8 items-center hide-scrollbar w-full"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {THEMES.map((theme) => {
            const isActive = currentTheme === theme.id;
            const PreviewComponent = theme.preview;
            
            return (
              <div 
                key={theme.id}
                data-theme-id={theme.id}
                onClick={(e) => handleCardClick(theme.id, e)}
                className={`theme-card-item shrink-0 snap-center w-[220px] sm:w-[260px] p-4 sm:p-5 border-2 rounded-[2.5rem] flex flex-col items-center gap-5 transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-900/10 shadow-2xl scale-105 opacity-100" 
                    : "border-transparent bg-transparent scale-95 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="w-[160px] h-[320px] sm:w-[180px] sm:h-[360px] rounded-[2.5rem] overflow-hidden pointer-events-none shadow-xl shrink-0 border-[6px] sm:border-[8px] border-slate-900 dark:border-black bg-white dark:bg-slate-950 flex items-center justify-center relative ring-1 ring-slate-200 dark:ring-slate-800">
                  {/* Subtle Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 dark:bg-black rounded-b-[12px] z-20"></div>
                  <PreviewComponent active={false} />
                </div>
                
                <div className="flex flex-col items-center gap-1 w-full mt-2">
                  <span className={`text-base font-black text-center w-full truncate transition-colors ${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-200"}`}>
                    {isArabic ? theme.nameAr : theme.nameEn}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
