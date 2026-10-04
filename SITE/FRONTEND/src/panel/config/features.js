import { homeConfig } from "./pages/homeConfig.js";
import { profileConfig } from "./pages/profileConfig.js";
import { cardsConfig } from "./pages/cardsConfig.js";
import { messagesConfig } from "./pages/messagesConfig.js";
import { productsConfig } from "./pages/productsConfig.js";

export const FEATURES = {
  ...homeConfig.features,
  ...profileConfig.features,
  ...cardsConfig.features,
  ...messagesConfig.features,
  ...productsConfig.features,
  subscriptions: true,
};

export const isFeatureEnabled = (featureName) =>
  FEATURES[featureName] !== false;
