import NavTabButton from "./NavTabButton.jsx";

export default function DesktopTabs({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="hidden lg:flex items-center gap-2 p-1.5 bg-white/95 dark:bg-slate-900/40 dark:backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm lg:sticky lg:top-4 z-30 relative transition-colors duration-300">
      {tabs.map((tab) => (
        <NavTabButton
          key={tab.id}
          label={tab.label}
          icon={tab.icon}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          layoutId="desktopActiveTabPill"
        />
      ))}
    </nav>
  );
}
