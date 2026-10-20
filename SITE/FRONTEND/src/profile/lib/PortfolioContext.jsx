import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchProfile } from "../services/profileApi.js";
import { normalizePortfolio } from "../utils/normalizePortfolio.js";
import { applyProfileSeo, getNotFoundSeoData, applyPageSeo } from "../../utils/seo.js";
import { getLocalizedErrorMessage } from "../../utils/errorHandling.js";
import { useLanguage } from "./LanguageContext.jsx";

const STORAGE_KEY = "thenith_portfolio_data";
const PortfolioContext = createContext(undefined);

export const PortfolioProvider = ({ children, mockProfile }) => {
  const [profile, setProfile] = useState(mockProfile ? normalizePortfolio(mockProfile) : null);
  const [status, setStatus] = useState(mockProfile ? "success" : "idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (mockProfile) {
      setProfile(normalizePortfolio(mockProfile));
      setStatus("success");
      return;
    }

    let isMounted = true;
    setStatus("loading");

    const parts = window.location.pathname.split("/").filter(Boolean);
    const publicId =
      parts[0]?.toLowerCase() === "p" ? parts[1] || "" : parts[0] || "";

    const cacheKey = publicId
      ? `${STORAGE_KEY}_${publicId.toLowerCase()}`
      : STORAGE_KEY;
    let saved = null;
    try {
      saved = localStorage.getItem(cacheKey);
    } catch {
      // Storage restricted
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const matchesIdentifier =
          !publicId ||
          parsed?.id === publicId ||
          parsed?.publicId === publicId ||
          parsed?.userPublicId === publicId ||
          parsed?.username?.toLowerCase() === publicId.toLowerCase();

        if (matchesIdentifier) {
          setProfile(normalizePortfolio(parsed));
        }
      } catch (parseError) {
        console.error(
          "Error loading portfolio data from localStorage",
          parseError,
        );
      }
    }

    // Fetch profile from backend.
    fetchProfile(publicId)
      .then((nextProfile) => {
        if (!isMounted) return;

        setProfile(nextProfile);
        setStatus("success");
        setError("");

        try {
          localStorage.setItem(cacheKey, JSON.stringify(nextProfile));
        } catch {
          // Ignore quota errors
        }

        /*
         * Keep the browser URL on the FRONTEND origin.
         *
         * IMPORTANT:
         * history.replaceState() cannot change the URL from:
         *
         *   http://localhost:3001
         *
         * to:
         *
         *
         *
         * because they have different origins.
         *
         * The backend URL should only be used for API requests.
         */

        const profileUrl = nextProfile?.profileUrl || `/${publicId}`;

        let canonicalPath = `/${publicId}`;

        try {
          const parsedUrl = new URL(profileUrl, window.location.origin);

          canonicalPath =
            parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;

          if (
            parts[0]?.toLowerCase() === "p" &&
            !canonicalPath.toLowerCase().startsWith("/p/")
          ) {
            canonicalPath = `/p${canonicalPath}`;
          }
        } catch (urlError) {
          console.warn(
            "Invalid profileUrl returned from API:",
            profileUrl,
            urlError,
          );

          // Safe fallback to the current frontend path.
          canonicalPath =
            parts[0]?.toLowerCase() === "p" ? `/p/${publicId}` : `/${publicId}`;
        }

        // Ensure canonical path always favors user's username
        const preferredId = nextProfile?.username || publicId;
        canonicalPath =
          parts[0]?.toLowerCase() === "p"
            ? `/p/${preferredId}`
            : `/${preferredId}`;

        // Only modify the path on the current frontend origin.
        if (
          canonicalPath &&
          canonicalPath !==
            window.location.pathname +
              window.location.search +
              window.location.hash
        ) {
          window.history.replaceState(null, "", canonicalPath);
        }
      })
      .catch((requestError) => {
        if (!isMounted) return;


        if (requestError.response && requestError.response.status === 404) {
          setStatus("not-found");
        } else {
          setStatus("error");
          setError(getLocalizedErrorMessage(requestError));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [mockProfile]);

  const langCtx = (() => {
    try {
      return useLanguage();
    } catch {
      return { language: "ar" };
    }
  })();
  const language = langCtx?.language || "ar";

  useEffect(() => {
    if (status === "not-found") {
      applyPageSeo(getNotFoundSeoData(language, "profile"));
    } else if (status === "error") {
      applyPageSeo({
        title: language === "en" ? "Profile Unavailable | Thenith" : "البروفايل غير متاح | Thenith",
        description: language === "en" ? "This profile is currently unavailable." : "البروفايل غير متاح حالياً.",
        robots: "noindex, nofollow",
        lang: language,
      });
    } else if (status === "success" && profile) {
      applyProfileSeo(profile, { language });
    }
  }, [profile, status, language]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "PREVIEW_UPDATE" && event.data?.profile) {
        setProfile(normalizePortfolio(event.data.profile));
        setStatus("success");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      isLoading: status === "loading",
      isError: status === "error",
      isNotFound: status === "not-found",
      error,
    }),
    [error, profile, status],
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);

  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }

  return context;
};
