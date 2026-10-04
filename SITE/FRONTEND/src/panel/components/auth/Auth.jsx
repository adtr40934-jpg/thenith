import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Smartphone,
  Lock,
  User,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import {
  completeRegistration,
  requestEmailCode,
  verifyEmailCode,
  googleLogin,
  saveAccessToken,
} from "../../services/authApi.js";
import GlobalLogo from "../../../components/GlobalLogo.jsx";
import ErrorNotice from "../../../components/ErrorNotice.jsx";
import { getLocalizedErrorMessage } from "../../../utils/errorHandling.js";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

export default function Auth({ t, language, onLogin, forceMode }) {
  const googleClientId = (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "303849620984-k3eubjup305l6rlad9fr4honuuhd8ec0.apps.googleusercontent.com"
  ).trim();
  const [mode, setMode] = useState(forceMode || "LOGIN"); // 'LOGIN' | 'REGISTER'
  const [step, setStep] = useState("EMAIL"); // 'EMAIL' | 'OTP' | 'REGISTRATION'
  const [authEmail, setAuthEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    jobTitle: "",
    company: "",
    bio: "",
  });
  const [regStepIndex, setRegStepIndex] = useState(0); // 0:Name, 1:Job, 2:Company, 3:Bio
  const [error, setError] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsSubmitting(true);
      setError("");
      const data = await googleLogin(credentialResponse?.credential);

      if (data.requiresRegistration) {
        setVerificationToken(data.verificationToken);
        setFormData({ ...formData, fullName: data.payload.name || "" });
        setStep("REGISTRATION");
      } else if (data.accessToken) {
        saveAccessToken(data.accessToken);
        onLogin(data.user);
      }
    } catch (err) {
      setError(getLocalizedErrorMessage(err, language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRtl = language === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  useEffect(() => {
    const title = mode === "LOGIN" ? t("login") : t("createAccount");
    document.title = `Thenith | ${title}`;
  }, [mode, t]);

  const resetFlow = (newMode) => {
    setMode(newMode);
    setStep("EMAIL");
    setAuthEmail("");
    setOtp("");
    setFormData({ fullName: "", jobTitle: "", company: "", bio: "" });
    setRegStepIndex(0);
    setError("");
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const cleaned = authEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setError(t("emailInvalid"));
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const response = await requestEmailCode(cleaned, "auto");
      setAuthEmail(cleaned);
      if (response?.purpose) {
        setMode(response.purpose === "login" ? "LOGIN" : "REGISTER");
      }
      setStep("OTP");
    } catch (requestError) {
      setError(getLocalizedErrorMessage(requestError, language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError(
        isRtl
          ? "كود التحقق يجب أن يكون 6 أرقام"
          : "The verification code must contain 6 digits",
      );
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const result = await verifyEmailCode(
        authEmail.trim(),
        otp,
        mode === "LOGIN" ? "login" : "register",
      );
      if (mode === "LOGIN") {
        onLogin(result.user);
      } else {
        setVerificationToken(result.verificationToken);
        setStep("REGISTRATION");
      }
    } catch (verifyError) {
      setError(getLocalizedErrorMessage(verifyError, language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    if (regStepIndex < 3) {
      setRegStepIndex(regStepIndex + 1);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await completeRegistration({
        verificationToken,
        name: formData.fullName.trim() || (isRtl ? "مستخدم جديد" : "New User"),
        jobTitle: formData.jobTitle.trim(),
        company: formData.company.trim(),
        bio: formData.bio.trim(),
      });
      onLogin(result.user);
    } catch (registrationError) {
      setError(getLocalizedErrorMessage(registrationError, language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pe-4 ps-11 text-sm font-bold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/50 dark:text-white dark:focus:bg-slate-900";

  return (
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <div
        className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 dark:from-slate-950 dark:to-slate-900`}
        dir={dir}
      >
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-8 text-center flex flex-col items-center">
            <GlobalLogo className="text-3xl text-slate-800 dark:text-white" />
            <p className="mt-1 text-sm text-slate-500">
              {mode === "LOGIN" ? t("welcomeBack") : t("createNewAccount")}
            </p>
          </div>

          {/* Mode Toggle (shown only on EMAIL step) */}
          {step === "EMAIL" && (
            <div className="mb-4 flex rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
              <button
                onClick={() => resetFlow("LOGIN")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-black transition-all ${
                  mode === "LOGIN"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t("login")}
              </button>
              <button
                onClick={() => resetFlow("REGISTER")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-black transition-all ${
                  mode === "REGISTER"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t("createAccount")}
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
            <AnimatePresence mode="wait">
              {/* STEP 1: EMAIL */}
              {step === "EMAIL" && (
                <motion.form
                  key="EMAIL"
                  initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  onSubmit={handleEmailSubmit}
                  className="p-6 sm:p-8"
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">
                      {mode === "LOGIN"
                        ? isRtl
                          ? t("loginTitle")
                          : "Sign In"
                        : isRtl
                          ? "حساب جديد"
                          : "Sign Up"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {mode === "LOGIN"
                        ? isRtl
                          ? "أدخل بريدك الإلكتروني للمتابعة"
                          : "Enter your email to continue"
                        : isRtl
                          ? "أدخل بريدك الإلكتروني للبدء"
                          : "Enter your email to start"}
                    </p>
                  </div>

                  {googleClientId ? (
                    <div className="mb-6">
                      <GoogleLoginButton
                        mode={mode}
                        isRtl={isRtl}
                        isSubmitting={isSubmitting}
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Google Sign-In failed")}
                      />
                    </div>
                  ) : (
                    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {isRtl
                        ? "تسجيل Google غير مفعّل حاليًا. أضف VITE_GOOGLE_CLIENT_ID في ملف البيئة."
                        : "Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to the environment file."}
                    </div>
                  )}

                  <div className="relative flex items-center py-2 mb-4">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">
                      {t("orUsing")}
                    </span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 flex items-center justify-center w-11 pointer-events-none ltr:left-0 rtl:right-0 text-slate-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        maxLength={100}
                        value={authEmail}
                        onChange={(e) =>
                          setAuthEmail(e.target.value.replace(/\s/g, ""))
                        }
                        className={inputBase}
                        placeholder="hello@example.com"
                        required
                      />
                    </div>

                    <ErrorNotice error={error} language={language} />

                    <button
                      type="submit"
                      disabled={!authEmail.trim() || isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white transition-all hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                    >
                      {t("continue")}
                      {isRtl ? (
                        <ArrowLeft className="h-4 w-4" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* STEP 2: OTP */}
              {step === "OTP" && (
                <motion.form
                  key="OTP"
                  initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  onSubmit={handleOtpSubmit}
                  className="p-6 sm:p-8"
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">
                      {t("verify")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500" dir={dir}>
                      {t("otpSent")}{" "}
                      <b className="text-slate-700 dark:text-slate-300 mx-1">
                        {authEmail}
                      </b>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 flex items-center justify-center w-11 pointer-events-none ltr:left-0 rtl:right-0 text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className={`${inputBase} text-center tracking-[0.5em] text-lg font-black`}
                        placeholder="••••"
                        required
                      />
                    </div>

                    <ErrorNotice error={error} language={language} />

                    <button
                      type="submit"
                      disabled={otp.length !== 6 || isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white transition-all hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                    >
                      {mode === "LOGIN"
                        ? isRtl
                          ? "تأكيد الدخول"
                          : "Confirm Login"
                        : t("continue")}
                      {isRtl ? (
                        <ArrowLeft className="h-4 w-4" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep("EMAIL")}
                      className="w-full py-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {isRtl ? "تغيير البريد الإلكتروني" : "Change email"}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* STEP 3: REGISTRATION (only for new users) */}
              {step === "REGISTRATION" && (
                <motion.form
                  key="REGISTRATION"
                  initial={{ opacity: 0, x: isRtl ? -24 : 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? 24 : -24 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegistrationSubmit}
                  className="space-y-4 p-6 sm:p-8"
                >
                  <div>
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                      <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white">
                      {regStepIndex === 0 &&
                        (isRtl ? "ما هو اسمك؟" : "What's your name?")}
                      {regStepIndex === 1 &&
                        (isRtl
                          ? "ما هو مسماك الوظيفي؟"
                          : "What's your job title?")}
                      {regStepIndex === 2 &&
                        (isRtl ? "في أي شركة تعمل؟" : "Where do you work?")}
                      {regStepIndex === 3 &&
                        (isRtl ? "نبذة قصيرة عنك" : "Write a short bio")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {isRtl
                        ? "سيتم إضافته لبطاقتك الرقمية (يمكنك تغييره لاحقاً)"
                        : "This will be added to your digital card."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {regStepIndex === 0 && (
                      <div className="relative flex items-center">
                        <User className="absolute mx-3 h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          required
                          maxLength={50}
                          value={formData.fullName}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              fullName: e.target.value.replace(
                                /<[^>]*>?/gm,
                                "",
                              ),
                            });
                            setError("");
                          }}
                          placeholder={t("fullNameRequired")}
                          className={inputBase}
                          autoFocus
                        />
                      </div>
                    )}

                    {regStepIndex === 1 && (
                      <div className="relative flex items-center">
                        <User className="absolute mx-3 h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          maxLength={100}
                          value={formData.jobTitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              jobTitle: e.target.value.replace(
                                /<[^>]*>?/gm,
                                "",
                              ),
                            })
                          }
                          placeholder={
                            isRtl
                              ? "مثال: مدير تسويق"
                              : "e.g. Marketing Manager"
                          }
                          className={inputBase}
                          autoFocus
                        />
                      </div>
                    )}

                    {regStepIndex === 2 && (
                      <div className="relative flex items-center">
                        <User className="absolute mx-3 h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          maxLength={100}
                          value={formData.company}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              company: e.target.value.replace(/<[^>]*>?/gm, ""),
                            })
                          }
                          placeholder={
                            isRtl ? "مثال: شركة جوجل" : "e.g. Google Inc."
                          }
                          className={inputBase}
                          autoFocus
                        />
                      </div>
                    )}

                    {regStepIndex === 3 && (
                      <div className="relative flex items-start">
                        <User className="absolute mx-3 mt-3.5 h-5 w-5 text-slate-400" />
                        <textarea
                          rows={3}
                          maxLength={150}
                          value={formData.bio}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bio: e.target.value.replace(/<[^>]*>?/gm, ""),
                            })
                          }
                          placeholder={
                            isRtl
                              ? "اكتب نبذة مختصرة عنك وعن خبراتك..."
                              : "Write a short bio about yourself..."
                          }
                          className={`${inputBase} resize-none`}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  <ErrorNotice error={error} language={language} />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      {regStepIndex < 3
                        ? isRtl
                          ? "متابعة"
                          : "Continue"
                        : isRtl
                          ? "إنهاء وإنشاء الحساب"
                          : "Finish & Create"}
                    </button>
                    {regStepIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (regStepIndex < 3) {
                            setRegStepIndex(regStepIndex + 1);
                          } else {
                            // Skip the last step by submitting
                            handleRegistrationSubmit({
                              preventDefault: () => {},
                            });
                          }
                        }}
                        disabled={isSubmitting}
                        className="px-6 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                      >
                        {isRtl ? "تخطي" : "Skip"}
                      </button>
                    )}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Step indicator dots */}
          <div className="mt-6 flex justify-center gap-2">
            {(mode === "REGISTER"
              ? ["EMAIL", "OTP", "REGISTRATION"]
              : ["EMAIL", "OTP"]
            ).map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  step === s
                    ? "w-6 bg-indigo-600"
                    : "w-1.5 bg-slate-300 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

// ── GoogleLoginButton ─────────────────────────────────────────────────────────
// Uses useGoogleLogin (implicit flow) for a fully custom, design-consistent button.
// Fetches the id_token from Google's tokeninfo endpoint so the existing
// backend verifyIdToken() flow continues to work without any backend changes.
// Must be rendered inside <GoogleOAuthProvider>.
function GoogleLoginButton({ mode, isRtl, isSubmitting, onSuccess, onError }) {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // useGoogleLogin implicit flow returns access_token.
        // Fetch the id_token from Google's userinfo v3 tokeninfo endpoint.
        const res = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?access_token=${tokenResponse.access_token}`
        );
        if (!res.ok) throw new Error("Failed to fetch Google token info");
        const info = await res.json();
        // Pass as { credential: id_token } to match the existing backend contract.
        onSuccess({ credential: info.id_token || tokenResponse.access_token });
      } catch (err) {
        onError(err);
      }
    },
    onError,
    flow: "implicit",
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={isSubmitting}
      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {/* Official Google "G" SVG — exact brand colors */}
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
        <path fill="#4285F4" d="M21.6 12.23c0-.75-.07-1.47-.2-2.16H12v4.09h5.39a4.6 4.6 0 0 1-1.99 3.01v2.5h3.22c1.89-1.74 2.98-4.3 2.98-7.44Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.22-2.5c-.9.6-2.04.96-3.41.96-2.62 0-4.84-1.77-5.63-4.15H.72v2.6A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.37 19.83A6 6 0 0 1 6 16.7V14.1H2.8a9.99 9.99 0 0 0 0 8.9l3.57-2.17Z" />
        <path fill="#EA4335" d="M12 4.98c1.48 0 2.8.51 3.85 1.5l2.88-2.88A9.96 9.96 0 0 0 12 2a10 10 0 0 0-9.28 5.5l3.58 2.77A6 6 0 0 1 12 4.98Z" />
      </svg>
      <span>
        {mode === "LOGIN"
          ? isRtl ? "تسجيل الدخول بجوجل" : "Continue with Google"
          : isRtl ? "إنشاء حساب بجوجل"   : "Sign up with Google"}
      </span>
    </button>
  );
}
