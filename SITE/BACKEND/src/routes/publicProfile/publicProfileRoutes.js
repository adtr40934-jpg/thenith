import { Router } from "express";
import _rateLimit4143 from "../../middleware/rateLimit.js";
const { publicRequestRateLimit  } = _rateLimit4143;
import _publicProfileController2536 from "../../controller/publicProfile/publicProfileController.js";
const { getPublicProfile,
  submitContact,
 } = _publicProfileController2536;

const router = Router();

router.get("/:identifier", getPublicProfile);
router.post("/contact", publicRequestRateLimit, submitContact);

export default router;
