import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DnaHelix from "../components/DnaHelix";
import AuthLangSwitch from "../i18n/AuthLangSwitch";
import { useLanguage } from "../i18n/useLanguage";
import "./Login.css";

export default function Signup({ onRegister }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    fullName: "",
    nationalId: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const fullName = form.fullName.trim();
    const nationalId = form.nationalId.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!fullName || !nationalId || !email || !phone || !form.password) {
      setError(t("auth.signup.errEmpty"));
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t("auth.signup.errEmail"));
      return;
    }

    if (form.password.length < 8) {
      setError(t("auth.signup.errPassword"));
      return;
    }

    if (typeof onRegister !== "function") {
      setError(t("auth.signup.errNotConnected"));
      return;
    }

    setLoading(true);

    try {
      await onRegister({
        fullName,
        nationalId,
        email,
        phone,
        password: form.password,
      });
      navigate("/otp", { state: { phone: form.phone, email: form.email } });
    } catch {
      setError(t("auth.signup.errFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page signup-page">
      <AuthLangSwitch />

      <div className="login-bg" aria-hidden="true">
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
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
            {t("auth.signup.h1a")} <span>{t("auth.signup.h1b")}</span>
          </h1>

          <p>{t("auth.signup.lead")}</p>

          <div className="brand-features">
            <div>
              <strong>{t("auth.signup.f1")}</strong>
              <span>{t("auth.signup.f1s")}</span>
            </div>
            <div>
              <strong>{t("auth.signup.f2")}</strong>
              <span>{t("auth.signup.f2s")}</span>
            </div>
            <div>
              <strong>{t("auth.signup.f3")}</strong>
              <span>{t("auth.signup.f3s")}</span>
            </div>
          </div>
        </div>

        <p className="brand-footer">{t("auth.footer")}</p>
      </section>

      <section className="login-form-panel" aria-label={t("auth.signup.title")}>
        <div className="login-form-container">
          <header className="login-heading">
            <h2>{t("auth.signup.title")}</h2>
            <p>{t("auth.signup.subtitle")}</p>
          </header>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="full-name">{t("auth.signup.fullName")}</label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder={t("auth.signup.fullNamePh")}
                value={form.fullName}
                onChange={updateField}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="signup-national-id">{t("auth.nationalId")}</label>
              <input
                id="signup-national-id"
                name="nationalId"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                dir="ltr"
                placeholder={t("auth.nationalIdPh")}
                value={form.nationalId}
                onChange={updateField}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="signup-email">{t("auth.email")}</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                dir="ltr"
                placeholder={t("auth.emailPh")}
                value={form.email}
                onChange={updateField}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="signup-phone">{t("auth.phone")}</label>
              <input
                id="signup-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder={t("auth.phonePh")}
                value={form.phone}
                onChange={updateField}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="signup-password">{t("auth.password")}</label>
              <div className="password-field">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  dir="ltr"
                  placeholder={t("auth.passwordPh")}
                  value={form.password}
                  onChange={updateField}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword
                      ? t("auth.signup.hidePassword")
                      : t("auth.signup.showPassword")
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? t("auth.hide") : t("auth.show")}
                </button>
              </div>
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? t("auth.signup.creating") : t("auth.signup.submit")}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="auth-switch">
            {t("auth.signup.haveAccount")}{" "}
            <Link to="/login">{t("auth.signup.loginLink")}</Link>
          </p>

          <p className="access-notice">
            {t("auth.signup.agree")}{" "}
            <Link to="/privacy">{t("auth.privacy")}</Link> {t("auth.and")}{" "}
            <Link to="/terms">{t("auth.terms")}</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
