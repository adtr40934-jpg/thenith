import { Router } from "express";
import _appointmentController7741 from "../controller/appointmentController.js";
const {
  createAppointment,
  getAvailability,
  deleteAppointment,
  getMyAppointments,
} = _appointmentController7741;

import _rateLimit from "../middleware/rateLimit.js";
const { publicRequestRateLimit } = _rateLimit;

const router = Router();

router.post("/:cardId", publicRequestRateLimit, createAppointment);
router.get("/:cardId/availability", getAvailability);
router.delete("/:appointmentId", deleteAppointment);
router.get("/:cardId/my-appointments", getMyAppointments);

export default router;
