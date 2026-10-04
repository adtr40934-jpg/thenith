import { MoreVertical } from "lucide-react";
import NavTabButton from "./NavTabButton.jsx";

export default function MobileNavigation({
  tabs,
  activeTab,
  isSettingsOpen,
  settingsLabel,
  onTabChange,
  onSettingsOpen,
}) {
  return (
    <nav className="lg:hidden fixed bottom-0 start-0 end-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-4 py-3 flex items-center justify-around shadow-lg transition-colors duration-300">
      {tabs.map((tab) => (
        <NavTabButton
          key={tab.id}
          id={tab.id === "hire" ? "mobile-hire-tab" : undefined}
          label={tab.label}
          icon={tab.icon}
          isActive={activeTab === tab.id && !isSettingsOpen}
          onClick={() => onTabChange(tab.id)}
          layoutId="mobileActiveTabPill"
          variant="mobile"
        />
      ))}
      <NavTabButton
        id="mobile-settings-tab"
        label={settingsLabel}
        icon={MoreVertical}
        isActive={isSettingsOpen}
        onClick={onSettingsOpen}
        layoutId="mobileActiveTabPill"
        variant="mobile"
      />
    </nav>
  );
}
