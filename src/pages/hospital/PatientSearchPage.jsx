import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { getUser } from "../../auth/session";
import {
  createGrant,
  findPatient,
  getGrant,
  requestPatientOtp,
  verifyPatientOtp,
} from "../../auth/grants";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "./PatientSearch.css";

const OTP_LENGTH = 4;

export default function PatientSearchPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const user = getUser();
  const staffId = user?.nationalId || "unknown";

  // step: "search" -> "otp" (patient found, waiting for code) | emergency form
  const [step, setStep] = useState("search");
  const [nationalId, setNationalId] = useState("");
  const [patient, setPatient] = useState(null);
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputs = useRef([]);

  const displayName = (p) => (lang === "ar" && p.nameAr ? p.nameAr : p.name);

  function reset() {
    setStep("search");
    setPatient(null);
    setDigits(Array(OTP_LENGTH).fill(""));
    setReason("");
    setError("");
  }

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    const found = findPatient(nationalId);
    if (!found) {
      setError(t("ps.notFound"));
      return;
    }
    setPatient(found);

    // A valid grant already exists: open the profile directly.
    if (getGrant(found.nationalId)) {
      navigate(`/hospital/patient/${found.nationalId}`);
      return;
    }

    setBusy(true);
    try {
      await requestPatientOtp(found.nationalId);
      setStep("otp");
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch {
      setError(t("ps.otpSendFail"));
    } finally {
      setBusy(false);
    }
  }

  function handleDigit(index, value) {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setError(t("ps.otpIncomplete"));
      return;
    }
    setBusy(true);
    try {
      await verifyPatientOtp(patient.nationalId, code);
      createGrant({
        patientId: patient.nationalId,
        type: "otp",
        staffId,
      });
      navigate(`/hospital/patient/${patient.nationalId}`);
    } catch {
      setError(t("ps.otpWrong"));
      setDigits(Array(OTP_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  }

  function handleEmergency(e) {
    e.preventDefault();
    setError("");
    if (reason.trim().length < 5) {
      setError(t("ps.reasonRequired"));
      return;
    }
    createGrant({
      patientId: patient.nationalId,
      type: "emergency",
      staffId,
      reason: reason.trim(),
    });
    navigate(`/hospital/patient/${patient.nationalId}`);
  }

  return (
    <DashboardLayout role="hospital_staff">
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("ps.tag")}</span>
          <h1>
            {t("ps.title1")} <span>{t("ps.title2")}</span>
          </h1>
          <p>{t("ps.subtitle")}</p>
        </div>
      </section>

      <section className="ad-card ps-card">
        {/* Step 1: search by national ID */}
        {step === "search" && (
          <form onSubmit={handleSearch} className="ps-form">
            <label className="ps-label" htmlFor="ps-id">
              {t("ps.idLabel")}
            </label>
            <div className="ps-row">
              <input
                id="ps-id"
                className="ps-input"
                dir="ltr"
                inputMode="numeric"
                autoComplete="off"
                placeholder={t("ps.idPh")}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
              />
              <button type="submit" className="sm-add" disabled={busy}>
                <Icon name="search" size={18} />{" "}
                {busy ? t("ps.searching") : t("ps.search")}
              </button>
            </div>
            <p className="ps-hint">{t("ps.hint")}</p>
            <p className="ps-hint ps-demo" dir="ltr">
              {t("ps.demoIds")}: 29801011234567 · 30511150123456 ·
              27504201987654
            </p>
          </form>
        )}

        {/* Step 2: patient found, OTP or emergency */}
        {step === "otp" && patient && (
          <div className="ps-otp">
            <div className="ps-found">
              <span className="ps-avatar">
                <Icon name="user" size={22} />
              </span>
              <div>
                <strong>{displayName(patient)}</strong>
                <small dir="ltr">{patient.nationalId}</small>
              </div>
            </div>

            <form onSubmit={handleVerify}>
              <p className="ps-hint">{t("ps.otpSent")}</p>
              <div className="ps-digits" dir="ltr">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    className="ps-digit"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    aria-label={`${t("ps.digit")} ${i + 1}`}
                  />
                ))}
              </div>
              <div className="ps-actions">
                <button type="submit" className="sm-add" disabled={busy}>
                  <Icon name="shield" size={18} />{" "}
                  {busy ? t("ps.verifying") : t("ps.verify")}
                </button>
                <button type="button" className="ps-ghost" onClick={reset}>
                  {t("ps.back")}
                </button>
              </div>
            </form>

            <button
              type="button"
              className="ps-emergency-link"
              onClick={() => {
                setError("");
                setStep("emergency");
              }}
            >
              <Icon name="alert" size={16} /> {t("ps.emergencyLink")}
            </button>
          </div>
        )}

        {/* Step 3: emergency access, reason required */}
        {step === "emergency" && patient && (
          <form onSubmit={handleEmergency} className="ps-form">
            <div className="ps-banner" role="alert">
              <Icon name="alert" size={20} />
              <div>
                <strong>{t("ps.emergencyTitle")}</strong>
                <p>{t("ps.emergencyText")}</p>
              </div>
            </div>

            <div className="ps-found">
              <span className="ps-avatar">
                <Icon name="user" size={22} />
              </span>
              <div>
                <strong>{displayName(patient)}</strong>
                <small dir="ltr">{patient.nationalId}</small>
              </div>
            </div>

            <label className="ps-label" htmlFor="ps-reason">
              {t("ps.reasonLabel")}
            </label>
            <textarea
              id="ps-reason"
              className="ps-input ps-textarea"
              rows={3}
              placeholder={t("ps.reasonPh")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <div className="ps-actions">
              <button type="submit" className="sm-add ps-danger">
                <Icon name="alert" size={18} /> {t("ps.emergencyOpen")}
              </button>
              <button
                type="button"
                className="ps-ghost"
                onClick={() => {
                  setError("");
                  setStep("otp");
                }}
              >
                {t("ps.back")}
              </button>
            </div>
          </form>
        )}

        {error && (
          <p className="ps-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </DashboardLayout>
  );
}
