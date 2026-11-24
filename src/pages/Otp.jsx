import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DnaHelix from "../components/DnaHelix";
import AuthLangSwitch from "../i18n/AuthLangSwitch";
import { useLanguage } from "../i18n/useLanguage";
import "./Login.css";
import "./Otp.css";

// Change this path to your character image (put the file in public/images/)
const OTP_CHARACTER_SRC = "/images/logo/Rating.png";

const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;

const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "xxxxxxxx@gmail.com";
  return `${name.slice(0, 2)}${"x".repeat(Math.max(name.length - 2, 3))}@${domain}`;
};

const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function Otp({ onVerify, onResend }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRtl } = useLanguage();

  const {
    email = "",
    userId = "",
    purpose = "registration",
    nationalId = "",
  } = location.state || {};
  const [values, setValues] = useState(Array(OTP_LENGTH).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef([]);

  // Countdown
  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const setDigit = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setValues((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setError("");
    if (digit && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    // The boxes always run left to right, so the arrows stay physical.
    if (e.key === "ArrowLeft" && index > 0)
      inputsRef.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1)
      inputsRef.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => {
      next[i] = d;
    });
    setValues(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const resetCode = () => {
    setValues(Array(OTP_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
  };

  const handleResend = async () => {
    if (seconds > 0) return;
    setError("");
    try {
      if (!userId) throw new Error("Missing verification user.");
      if (typeof onResend === "function") {
        await onResend({ userId, purpose });
      }
      setSeconds(RESEND_SECONDS);
      resetCode();
    } catch (err) {
      setError(err?.message || t("auth.otp.errResend"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = values.join("");
    if (code.length < OTP_LENGTH) {
      setError(t("auth.otp.errLength", { n: OTP_LENGTH }));
      return;
    }
    if (typeof onVerify !== "function") {
      setError(t("auth.otp.errNotConnected"));
      return;
    }
    try {
      setSubmitting(true);
      const result = await onVerify({
        code,
        purpose,
        userId,
        nationalId,
      });
      navigate(
        result?.target || (purpose === "registration" ? "/login" : "/login"),
        { replace: true },
      );
    } catch (err) {
      setError(err?.message || t("auth.otp.errInvalid"));
      resetCode();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page otp-page">
      <AuthLangSwitch />

      <div className="login-bg" aria-hidden="true">
        <span className="bg-orb bg-orb-a" />
        <span className="bg-orb bg-orb-b" />
        <DnaHelix />
      </div>

      <section className="login-brand">
        <Link to="/login" className="brand-name" aria-label="GenoTrack">
          <img
            className="brand-logo"
            src="/images/logo/secondary-logo.png"
            alt="GenoTrack"
          />
        </Link>

        <div className="brand-content">
          <span className="brand-tag">{t("auth.tag")}</span>

          <h1>
            {t("auth.otp.h1a")} <span>{t("auth.otp.h1b")}</span>
          </h1>

          <p>{t("auth.otp.lead")}</p>

          <div className="brand-features">
            <div>
              <strong>{t("auth.otp.f1")}</strong>
              <span>{t("auth.otp.f1s")}</span>
            </div>
            <div>
              <strong>{t("auth.otp.f2")}</strong>
              <span>{t("auth.otp.f2s")}</span>
            </div>
            <div>
              <strong>{t("auth.otp.f3")}</strong>
              <span>{t("auth.otp.f3s")}</span>
            </div>
          </div>
        </div>

        <p className="brand-footer">{t("auth.footer")}</p>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          <Link
            to="/signup"
            className="otp-back"
            aria-label={t("auth.otp.back")}
          >
            {isRtl ? "→" : "←"} {t("auth.otp.back")}
          </Link>

          {/* Character inside the OTP card */}
          <div className="otp-character">
            <img src={OTP_CHARACTER_SRC} alt="" />
          </div>

          <div className="login-heading">
            <h2>{t("auth.otp.title")}</h2>
            <p>{t("auth.otp.subEmail")}</p>
          </div>

          <p className="otp-target" dir="ltr">
            {maskEmail(email)}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="otp-inputs" dir="ltr" onPaste={handlePaste}>
              {values.map((v, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={v}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  aria-label={t("auth.otp.digit", { n: i + 1 })}
                  className={v ? "filled" : ""}
                />
              ))}
            </div>

            {error && <p className="login-error otp-error">{error}</p>}

            <p className="otp-timer" dir="ltr">
              {formatTime(seconds)}
            </p>

            <p className="otp-resend">
              {t("auth.otp.noCode")}{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={seconds > 0}
              >
                {t("auth.otp.resend")}
              </button>
            </p>

            <button
              type="submit"
              className="login-submit"
              disabled={submitting}
            >
              {submitting ? t("auth.otp.verifying") : t("auth.otp.submit")}
              {!submitting && <span aria-hidden="true">→</span>}
            </button>
          </form>

        </div>
      </section>
    </main>
  );
}
