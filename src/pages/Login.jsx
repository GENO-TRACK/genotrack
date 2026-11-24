import { useState } from "react";
import { Link } from "react-router-dom";
import DnaHelix from "../components/DnaHelix";
import AuthLangSwitch from "../i18n/AuthLangSwitch";
import { useLanguage } from "../i18n/useLanguage";
import "./Login.css";

export default function Login({ authenticate, onAuthenticated }) {
  const { t } = useLanguage();

  const [nationalId, setNationalId] = useState("");
  const [factoryNumber, setFactoryNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [trustTerminal, setTrustTerminal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!nationalId.trim() || !factoryNumber) {
      setError(t("auth.login.errEmpty"));
      return;
    }

    if (
      typeof authenticate !== "function" ||
      typeof onAuthenticated !== "function"
    ) {
      setError(t("auth.login.errNotConnected"));
      return;
    }

    setLoading(true);

    try {
      const user = await authenticate({
        nationalId: nationalId.trim(),
        factoryNumber,
        trustTerminal,
      });

      // The backend must return the verified account role.
      // Never assign Admin here when a role is missing.
      if (!user?.role) {
        throw new Error("Unable to verify your account access.");
      }

      await onAuthenticated(user);
    } catch {
      setError(t("auth.login.errFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <AuthLangSwitch />

      <div className="login-bg" aria-hidden="true">
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
        <DnaHelix />
      </div>

      <section className="login-brand" aria-label={t("auth.login.aboutAria")}>
        <Link className="brand-name" to="/login">
          <img
            src="/images/logo/secondary-logo.png"
            alt="GenoTrack logo"
            className="brand-logo"
          />
        </Link>

        <div className="brand-content">
          <span className="brand-tag">{t("auth.tag")}</span>

          <h1>
            {t("auth.login.h1a")} <span>{t("auth.login.h1b")}</span>
            <br />
            {t("auth.login.h1c")}
          </h1>

          <p>{t("auth.login.lead")}</p>

          <div className="brand-features">
            <div>
              <strong>{t("auth.login.f1")}</strong>
              <span>{t("auth.login.f1s")}</span>
            </div>
            <div>
              <strong>{t("auth.login.f2")}</strong>
              <span>{t("auth.login.f2s")}</span>
            </div>
            <div>
              <strong>{t("auth.login.f3")}</strong>
              <span>{t("auth.login.f3s")}</span>
            </div>
          </div>
        </div>

        <p className="brand-footer">{t("auth.footer")}</p>
      </section>

      <section className="login-form-panel" aria-label={t("auth.login.title")}>
        <div className="login-form-container">
          <header className="login-heading">
            <h2>{t("auth.login.title")}</h2>
            <p>{t("auth.login.subtitle")}</p>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="national-id">{t("auth.nationalId")}</label>
              <input
                id="national-id"
                name="nationalId"
                type="text"
                inputMode="numeric"
                autoComplete="username"
                dir="ltr"
                placeholder={t("auth.nationalIdPh")}
                value={nationalId}
                onChange={(event) => setNationalId(event.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="factory-number">{t("auth.factory")}</label>

              <div className="password-field">
                <input
                  id="factory-number"
                  name="factoryNumber"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  dir="ltr"
                  placeholder={t("auth.factoryPh")}
                  value={factoryNumber}
                  onChange={(event) => setFactoryNumber(event.target.value)}
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword
                      ? t("auth.login.hideFactory")
                      : t("auth.login.showFactory")
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? t("auth.hide") : t("auth.show")}
                </button>
              </div>
            </div>

            <label className="trust-terminal">
              <input
                type="checkbox"
                checked={trustTerminal}
                onChange={(event) => setTrustTerminal(event.target.checked)}
                disabled={loading}
              />
              <span>{t("auth.login.trust")}</span>
            </label>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? t("auth.login.verifying") : t("auth.login.submit")}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="access-notice">{t("auth.login.notice")}</p>

          <p className="auth-switch">
            {t("auth.login.noAccount")}{" "}
            <Link to="/signup">{t("auth.login.signupLink")}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
