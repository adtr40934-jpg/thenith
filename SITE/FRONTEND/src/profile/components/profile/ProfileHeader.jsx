import { useState } from "react";

import { usePortfolio } from "../../lib/PortfolioContext.jsx";
import { useLanguage } from "../../lib/LanguageContext.jsx";
import { downloadVcard } from "../../utils/vcard.js";
import ShareModal from "../share/ShareModal.jsx";
import ProfileActions from "./ProfileActions.jsx";
import ProfileAvatar from "./ProfileAvatar.jsx";
import ProfileCover from "./ProfileCover.jsx";
import ProfileIdentity from "./ProfileIdentity.jsx";
import ShareProfileButton from "./ShareProfileButton.jsx";
export default function ProfileHeader() {
  const { profile, isLoading } = usePortfolio();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("contact");
  const [isShareOpen, setIsShareOpen] = useState(false);

  if (isLoading || !profile) {
    return null; // or a loading placeholder
  }
  const {
    avatar,
    contact,
    name,
    role,
    bio,
    coverImage,
    isVerified,
    personal,
    actionType,
    id,
  } = profile;
  const company = personal?.company || "";

  return (
    <div className="w-full flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800/80 relative">
      <ShareProfileButton
        onClick={() => setIsShareOpen(true)}
        title={t.shareProfile}
      />
      <ProfileCover coverImage={coverImage} coverText={name} />
      <ProfileAvatar
        avatar={avatar}
        name={name}
        availableTitle={t.availableText}
      />
      <ProfileIdentity
        company={company}
        name={name}
        role={role}
        bio={bio}
        verifiedLabel={t.verifiedAccount}
        isVerified={isVerified}
      />
      <ProfileActions
        contact={contact}
        labels={{
          call: t.call,
          whatsapp: t.whatsapp,
          saveContact: t.saveContact,
        }}
        onSaveContact={() => downloadVcard(profile)}
      />

      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </div>
  );
}
