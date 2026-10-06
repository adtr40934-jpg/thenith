import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { FileText, Mail, Phone, Send, User } from "lucide-react";
import FormInput from "../ui/FormInput.jsx";
import FormTextarea from "../ui/FormTextarea.jsx";
import SectionHeader from "../ui/SectionHeader.jsx";
import SubmitButton from "../ui/SubmitButton.jsx";
import { useLanguage } from "../../lib/LanguageContext.jsx";
import { usePortfolio } from "../../lib/PortfolioContext.jsx";
import {
  sendHireRequest,
  fetchMyRequests,
  deleteHireRequest,
} from "../../services/portfolioService.js";
import HireRequestsList from "./HireRequestsList.jsx";
import HireSuccessAlert from "./HireSuccessAlert.jsx";
import { getLocalizedErrorMessage } from "../../../utils/errorHandling.js";

export default function HireRequestForm() {
  const { t, language } = useLanguage();
  const { profile } = usePortfolio();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [submittedRequests, setSubmittedRequests] = useState([]);

  useEffect(() => {
    if (profile?.id) {
      fetchMyRequests(profile.id)
        .then((res) => setSubmittedRequests(res.requests || []))
        .catch((err) => {});
    }
  }, [profile?.id]);

  const validate = () => {
    const nextErrors = {};
    if (!fullName.trim())
      nextErrors.fullName = t.validationName || "الاسم مطلوب";
    if (!phone.trim())
      nextErrors.phone = t.validationPhone || "رقم الهاتف مطلوب";
    if (!message.trim()) {
      nextErrors.message = t.validationMessageRequired || "الرسالة مطلوبة";
    } else if (message.length < 10) {
      nextErrors.message = t.validationMessageLength || "الرسالة قصيرة جداً";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setMessage("");
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const requestPayload = {
      name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      message: message.trim(),
    };

    try {
      await sendHireRequest(profile?.id, requestPayload);

      const res = await fetchMyRequests(profile?.id);
      setSubmittedRequests(res.requests || []);

      setIsSuccess(true);
      resetForm();
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      setErrors({
        message: getLocalizedErrorMessage(error, language),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      await deleteHireRequest(id);
      setSubmittedRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
    }
  };

  return (
    <div className="flex flex-col gap-6 text-start rtl:text-right">
      <SectionHeader title={t.hireTitle} subtitle={t.hireSubtitle} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInput
          type="text"
          dir="auto"
          icon={User}
          label={t.fullNameLabel}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder={t.fullNamePlaceholder}
          error={errors.fullName}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            type="tel"
            dir="auto"
            icon={Phone}
            label={t.phoneInputLabel}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={t.phoneInputPlaceholder}
            error={errors.phone}
          />

          <FormInput
            type="email"
            dir="auto"
            icon={Mail}
            label={t.emailInputLabel}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t.emailInputPlaceholder}
          />
        </div>

        <FormTextarea
          rows={4}
          dir="auto"
          icon={FileText}
          label={t.messageLabel}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t.messagePlaceholder}
          error={errors.message}
        />

        <SubmitButton
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          loadingLabel={t.submitting}
        >
          <Send className="w-4 h-4 rtl:rotate-180" />
          <span>{t.submitBtn}</span>
        </SubmitButton>
      </form>

      <AnimatePresence>
        {isSuccess && (
          <HireSuccessAlert title={t.successTitle} message={t.successMessage} />
        )}
      </AnimatePresence>

      <HireRequestsList
        requests={submittedRequests}
        language={language}
        labels={{
          submittedRequests: t.submittedRequests,
          liveFeed: t.liveFeed,
          deleteRequest: t.deleteRequest,
        }}
        onDeleteRequest={handleDeleteRequest}
      />
    </div>
  );
}
