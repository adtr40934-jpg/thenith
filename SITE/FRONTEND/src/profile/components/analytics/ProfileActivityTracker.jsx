import { useEffect, useRef } from "react";
import { usePortfolio } from "../../lib/PortfolioContext.jsx";
import { trackVisit } from "../../services/portfolioService.js";

export default function ProfileActivityTracker() {
  const { profile } = usePortfolio();
  const tracked = useRef(false);

  useEffect(() => {
    if (profile?.id && !tracked.current) {
      tracked.current = true;
      trackVisit(profile.id).catch(() => {});
    }
  }, [profile?.id]);

  return null;
}
