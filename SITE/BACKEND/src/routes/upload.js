import { Router } from "express";
import _auth9019 from "../middleware/auth.js";
const { requireAuth  } = _auth9019;
import _subscription7189 from "../middleware/subscription.js";
const { requireSubscription  } = _subscription7189;
import _uploadController8071 from "../controller/uploadController.js";
const { uploadBase64  } = _uploadController8071;

const router = Router();
router.use(requireAuth);
router.use(requireSubscription);

router.post("/base64", uploadBase64);

export default router;
