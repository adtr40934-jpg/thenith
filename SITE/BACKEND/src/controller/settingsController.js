import _asyncHandler4338 from "../util/asyncHandler.js";
const { asyncHandler  } = _asyncHandler4338;
import Setting from "../models/Setting.js";
import _landingConfig4943 from "../util/landingConfig.js";
const { mergeLandingConfig  } = _landingConfig4943;

// ── GET /api/settings ─────────────────────────────────────────────────────────
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find({
    key: { $in: ["store_config", "public_config", "landing_config"] },
  });
  const settingsMap = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });
  settingsMap.landing_config = mergeLandingConfig(settingsMap.landing_config);
  res.json(settingsMap);
});


export default { getSettings };
