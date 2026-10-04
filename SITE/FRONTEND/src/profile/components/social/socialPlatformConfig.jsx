import {
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Send,
  Slack,
  Twitch,
  Twitter,
  Youtube,
} from "lucide-react";

import {
  DiscordIcon,
  MediumIcon,
  PinterestIcon,
  SnapchatIcon,
  SoundCloudIcon,
  SpotifyIcon,
  TikTokIcon,
} from "./SocialIcons.jsx";

const uniformThemeClass =
  "hover:border-slate-300 dark:hover:border-slate-700/80 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/60";

export function getSocialPlatformConfig(name, url) {
  const normName = name.toLowerCase().trim();
  const normUrl = url.toLowerCase().trim();

  if (normName.includes("facebook") || normUrl.includes("facebook.com")) {
    return {
      icon: <Facebook className="w-5 h-5 fill-current" />,
      themeClass: uniformThemeClass,
    };
  }
  if (normName.includes("instagram") || normUrl.includes("instagram.com")) {
    return {
      icon: <Instagram className="w-5 h-5" />,
      themeClass: uniformThemeClass,
    };
  }
  if (normName.includes("tiktok") || normUrl.includes("tiktok.com")) {
    return { icon: <TikTokIcon />, themeClass: uniformThemeClass };
  }
  if (normName.includes("snapchat") || normUrl.includes("snapchat.com")) {
    return { icon: <SnapchatIcon />, themeClass: uniformThemeClass };
  }
  if (
    normName.includes("whatsapp") ||
    normUrl.includes("wa.me") ||
    normUrl.includes("whatsapp.com")
  ) {
    return {
      icon: <MessageCircle className="w-5 h-5" />,
      themeClass: uniformThemeClass,
    };
  }
  if (
    normName.includes("telegram") ||
    normUrl.includes("t.me") ||
    normUrl.includes("telegram.org")
  ) {
    return {
      icon: <Send className="w-5 h-5 fill-current" />,
      themeClass: uniformThemeClass,
    };
  }
  if (
    normName.includes("youtube") ||
    normUrl.includes("youtube.com") ||
    normUrl.includes("youtu.be")
  ) {
    return {
      icon: <Youtube className="w-5 h-5" />,
      themeClass: uniformThemeClass,
    };
  }
  if (normName.includes("linkedin") || normUrl.includes("linkedin.com")) {
    return {
      icon: <Linkedin className="w-5 h-5 fill-current" />,
      themeClass: uniformThemeClass,
    };
  }
  if (
    normName.includes("twitter") ||
    normName === "x" ||
    normUrl.includes("twitter.com") ||
    normUrl.includes("x.com")
  ) {
    return {
      icon: <Twitter className="w-5 h-5 fill-current" />,
      themeClass: uniformThemeClass,
    };
  }
  if (normName.includes("github") || normUrl.includes("github.com")) {
    return {
      icon: <Github className="w-5 h-5" />,
      themeClass: uniformThemeClass,
    };
  }
  if (normName.includes("pinterest") || normUrl.includes("pinterest.com")) {
    return { icon: <PinterestIcon />, themeClass: uniformThemeClass };
  }
  if (normName.includes("twitch") || normUrl.includes("twitch.tv")) {
    return {
      icon: <Twitch className="w-5 h-5" />,
      themeClass: uniformThemeClass,
    };
  }
  if (
    normName.includes("discord") ||
    normUrl.includes("discord.gg") ||
    normUrl.includes("discord.com")
  ) {
    return { icon: <DiscordIcon />, themeClass: uniformThemeClass };
  }
  if (normName.includes("spotify") || normUrl.includes("spotify.com")) {
    return { icon: <SpotifyIcon />, themeClass: uniformThemeClass };
  }
  if (normName.includes("soundcloud") || normUrl.includes("soundcloud.com")) {
    return { icon: <SoundCloudIcon />, themeClass: uniformThemeClass };
  }
  if (normName.includes("medium") || normUrl.includes("medium.com")) {
    return { icon: <MediumIcon />, themeClass: uniformThemeClass };
  }
  if (normName.includes("slack") || normUrl.includes("slack.com")) {
    return {
      icon: <Slack className="w-5 h-5" />,
      themeClass: uniformThemeClass,
    };
  }

  return { icon: <Globe className="w-5 h-5" />, themeClass: uniformThemeClass };
}
