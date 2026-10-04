import { Router } from "express";
import _auth302 from "../../middleware/auth.js";
const { requireAuth  } = _auth302;
import _rateLimit2606 from "../../middleware/rateLimit.js";
const { usernameRateLimit  } = _rateLimit2606;
import _authController6624 from "../../controller/auth/authController.js";
const { requestCode,
  verifyCode,
  completeRegistration,
  register,
  login,
  getSession,
  refreshToken,
  logout,
  deleteAccount,
  checkUsername,
  getMe,
  updateMe,
  googleAuth,
 } = _authController6624;

const router = Router();

router.post("/request-code", requestCode);
router.post("/verify-code", verifyCode);
router.post("/complete-registration", completeRegistration);
router.post("/register", register);
router.post("/login", login);
router.get("/session", getSession);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.delete("/me", requireAuth, deleteAccount);
router.post("/check-username", usernameRateLimit, requireAuth, checkUsername);
router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);
router.post("/google", googleAuth);

export default router;
