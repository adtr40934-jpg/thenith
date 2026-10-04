import { Router } from "express";
import _settingsController2535 from "../controller/settingsController.js";
const { getSettings  } = _settingsController2535;

const router = Router();

router.get("/", getSettings);

export default router;
