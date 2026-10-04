import { Router } from "express";
import _planController8761 from "../controller/planController.js";
const { getPlans  } = _planController8761;

const router = Router();

router.get("/", getPlans);

export default router;
