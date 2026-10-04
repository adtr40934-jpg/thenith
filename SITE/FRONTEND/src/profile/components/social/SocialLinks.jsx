import SectionHeader from "../ui/SectionHeader.jsx";
import { usePortfolio } from "../../lib/PortfolioContext.jsx";
import { useLanguage } from "../../lib/LanguageContext.jsx";
import SocialLinkCard from "./SocialLinkCard.jsx";
import { getSocialPlatformConfig } from "./socialPlatformConfig.jsx";

export default function SocialLinks() {
  const { profile } = usePortfolio();
  const { socials } = profile;
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4 text-start rtl:text-right">
      <SectionHeader title={t.linksTab} />

      <div className="grid grid-cols-1 gap-3">
        {socials.map((social, index) => {
          const config = getSocialPlatformConfig(social.name, social.url);

          return (
            <SocialLinkCard
              key={`${social.name}-${index}`}
              social={social}
              icon={config.icon}
              themeClass={config.themeClass}
              index={index}
            />
          );
        })}
      </div>
    </div>
  );
}
