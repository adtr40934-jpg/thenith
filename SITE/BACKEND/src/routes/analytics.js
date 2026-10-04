import { Router } from "express";
import _analyticsController752 from "../controller/analyticsController.js";
const { trackVisit, trackClick  } = _analyticsController752;
import _rateLimit5089 from "../middleware/rateLimit.js";
const { analyticsRateLimit  } = _rateLimit5089;

const router = Router();

router.post("/:cardId/visit", analyticsRateLimit, trackVisit);
router.post("/:cardId/click", analyticsRateLimit, trackClick);

export default router;
