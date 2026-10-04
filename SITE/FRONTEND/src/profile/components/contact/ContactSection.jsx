import { Globe, Link, Mail, MapPin, Phone } from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import SectionHeader from "../ui/SectionHeader.jsx";
import { usePortfolio } from "../../lib/PortfolioContext.jsx";
import { useLanguage } from "../../lib/LanguageContext.jsx";
import ContactCard from "./ContactCard.jsx";

const contactIcons = {
  phone: Phone,
  email: Mail,
  website: Globe,
  location: MapPin,
  whatsapp: SiWhatsapp,
  link: Link,
};

export default function ContactSection() {
  const { profile, isLoading } = usePortfolio();
  const { t } = useLanguage();
  if (isLoading || !profile) {
    return null; // or a loading placeholder
  }
  const contactItems = profile.contactMethods || [];

  return (
    <div className="flex flex-col gap-4 text-start rtl:text-right">
      <SectionHeader title={t.aboutTab} />

      <div className="grid grid-cols-1 gap-3">
        {contactItems.map((item, index) => {
          const Icon = contactIcons[item.type] || contactIcons.link;
          const translatedLabel =
            item.type === "whatsapp" ? t.whatsapp : t[`${item.type}Label`];

          return (
            <ContactCard
              key={`${item.type}-${item.value}-${index}`}
              icon={<Icon className="w-5 h-5" />}
              label={
                translatedLabel || item.label || t[item.labelKey] || item.type
              }
              value={item.value}
              href={item.href}
              copyable={item.copyable}
              isLtr={item.isLtr}
              index={index}
            />
          );
        })}
      </div>
    </div>
  );
}
