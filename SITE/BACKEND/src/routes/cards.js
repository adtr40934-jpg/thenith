import { Router } from "express";
import _auth3612 from "../middleware/auth.js";
const { requireAuth  } = _auth3612;
import _subscription7436 from "../middleware/subscription.js";
const { requireSubscription  } = _subscription7436;
import _panelController7798 from "../controller/panelController.js";
const { getCards,
  createCard,
  updateCard,
  reorderLinks,
  deleteCard,
  getPublicCard,
  getNfcPayload,
  recordNfcLinked,
  listPhysicalCards,
  registerPhysicalCard,
  deletePhysicalCard,
 } = _panelController7798;

const router = Router();

// Public compatibility endpoint for rendering a sanitized card view.
router.get("/public/:cardId", getPublicCard);

router.use(requireAuth);
router.use(requireSubscription);

router.get("/", getCards);
router.post("/", createCard);
router.patch("/:cardId", updateCard);
router.patch("/:cardId/links/reorder", reorderLinks);
router.delete("/:cardId", deleteCard);

// NFC Card Linking — backend is the sole authority for the NFC URL
router.post("/nfc-payload", getNfcPayload);
router.post("/nfc-linked", recordNfcLinked);

// Physical NFC Card Registry
router.get("/physical", listPhysicalCards);
router.post("/physical/register", registerPhysicalCard);
router.delete("/physical/:id", deletePhysicalCard);

export default router;

