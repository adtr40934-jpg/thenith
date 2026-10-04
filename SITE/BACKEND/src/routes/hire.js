import { Router } from "express";
import _hireController9972 from "../controller/hireController.js";
const { createHireRequest, deleteHireRequest, getMyRequests } =
  _hireController9972;

import _rateLimit from "../middleware/rateLimit.js";
const { publicRequestRateLimit } = _rateLimit;

const router = Router();

router.post("/:cardId", publicRequestRateLimit, createHireRequest);
router.delete("/:requestId", deleteHireRequest);
router.get("/:cardId/my-requests", getMyRequests);

export default router;
