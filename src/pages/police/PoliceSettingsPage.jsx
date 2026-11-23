import { useEffect, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import LanguageSwitch from "../../components/dashboard/LanguageSwitch";
import { useLanguage } from "../../i18n/useLanguage";
import { getUser } from "../../auth/session";
import {
  CURRENT_STATION,
  getPolicePrefs,
  listPoliceSessions,
  revokePoliceSession,
  savePolicePrefs,
} from "../../auth/police";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "../admin/ComparisonPage.css";
import "../admin/SettingsPage.css";
import "../hospital/HospitalSettings.css";
import "./Police.css";

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`st-switch ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
    >
      <i />
    </button>
  );
}

// Police settings: profile, interface, security and sign-in devices.
// There is no staff list here: an officer manages only their own account.
export default function PoliceSettingsPage() {
  const { t, lang } = useLanguage();
  const userId = getUser()?.nationalId || "unknown";

  const [prefs, setPrefs] = useState(() => getPolicePrefs(userId));
  const [sessions, setSessions] = useState([]);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let alive = true;
    listPoliceSessions(userId).then((list) => {
      if (alive) setSessions(list);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  function setPref(key, value) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function save() {
    savePolicePrefs(userId, prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function discard() {
    setPrefs(getPolicePrefs(userId));
    flash(t("pol.set.discarded"));
  }

  function revoke(id) {
    revokePoliceSession(userId, id);
    setSessions((list) => list.filter((s) => s.id !== id));
  }

  const stationName =
    lang === "ar" ? CURRENT_STATION.nameAr : CURRENT_STATION.name;

  return (
    <DashboardLayout role="police_investigator">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("pol.set.tag")}</span>
          <h1>
            {t("pol.set.title1")} <span>{t("pol.set.title2")}</span>
          </h1>
          <p>{t("pol.set.subtitle", { station: stationName })}</p>
        </div>
        <div className="st-head-actions">
          <button type="button" className="sf-btn" onClick={discard}>
            {t("pol.set.discard")}
          </button>
          <button type="button" className="sm-add" onClick={save}>
            <Icon name="check" size={18} />{" "}
            {saved ? t("pol.set.saved") : t("pol.set.save")}
          </button>
        </div>
      </section>

      {/* Identity + interface */}
      <section className="st-grid">
        <article className="ad-card st-identity">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="user" size={20} />
            </span>
            <h3>{t("pol.set.identity")}</h3>
            <em className="st-verified">
              <Icon name="check" size={13} /> {t("pol.set.verified")}
            </em>
          </div>

          <div className="st-id-body">
            <div className="st-avatar">{String(userId).charAt(0)}</div>
            <dl className="st-fields">
              <div>
                <dt>{t("pol.set.staffId")}</dt>
                <dd dir="ltr">{userId}</dd>
              </div>
              <div>
                <dt>{t("pol.set.role")}</dt>
                <dd>{t("pol.set.roleValue")}</dd>
              </div>
              <div>
                <dt>{t("pol.set.station")}</dt>
                <dd>{stationName}</dd>
              </div>
              <div>
                <dt>{t("pol.set.access")}</dt>
                <dd>{t("pol.set.accessValue")}</dd>
              </div>
            </dl>
          </div>
        </article>

        <article className="ad-card">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="settings" size={20} />
            </span>
            <h3>{t("pol.set.interface")}</h3>
          </div>

          <div className="st-rows">
            <div className="st-row">
              <div>
                <b>{t("st.language")}</b>
                <small>{t("set.lang.text")}</small>
              </div>
              <LanguageSwitch />
            </div>

            <div className="st-row">
              <div>
                <b>{t("st.autoLock")}</b>
                <small>{t("st.autoLockText")}</small>
              </div>
              <select
                className="st-select"
                value={prefs.autoLock}
                onChange={(e) => setPref("autoLock", e.target.value)}
              >
                <option value="5">5 {t("st.min")}</option>
                <option value="15">15 {t("st.min")}</option>
                <option value="30">30 {t("st.min")}</option>
                <option value="60">60 {t("st.min")}</option>
              </select>
            </div>

            <div className="st-row">
              <div>
                <b>{t("pol.set.sound")}</b>
                <small>{t("pol.set.soundText")}</small>
              </div>
              <Toggle
                on={prefs.sound}
                onChange={(v) => setPref("sound", v)}
                label={t("pol.set.sound")}
              />
            </div>
          </div>
        </article>
      </section>

      {/* Security + sessions */}
      <section className="st-grid">
        <article className="ad-card">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="shield" size={20} />
            </span>
            <h3>{t("pol.set.security")}</h3>
          </div>

          <div className="st-rows">
            <div className="st-row">
              <div>
                <b>{t("st.mfa")}</b>
                <small>{t("pol.set.mfaText")}</small>
              </div>
              <Toggle
                on={prefs.mfa}
                onChange={(v) => setPref("mfa", v)}
                label={t("st.mfa")}
              />
            </div>
            <div className="st-row">
              <div>
                <b>{t("pol.set.matchAlerts")}</b>
                <small>{t("pol.set.matchAlertsText")}</small>
              </div>
              <Toggle
                on={prefs.matchAlerts}
                onChange={(v) => setPref("matchAlerts", v)}
                label={t("pol.set.matchAlerts")}
              />
            </div>
          </div>
        </article>

        <article className="ad-card">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="clock" size={20} />
            </span>
            <h3>{t("pol.set.sessions")}</h3>
          </div>

          <ul className="st-sessions">
            {sessions.map((s) => (
              <li key={s.id}>
                <span className="st-ico-sm">
                  <Icon name={s.icon === "phone" ? "user" : "grid"} size={18} />
                </span>
                <div>
                  <b>{lang === "ar" ? s.nameAr : s.name}</b>
                  <small dir="ltr">
                    {s.ip} · {lang === "ar" ? s.placeAr : s.place}
                  </small>
                </div>
                {s.current ? (
                  <em className="st-current">{t("st.current")}</em>
                ) : (
                  <button
                    type="button"
                    className="st-revoke"
                    onClick={() => revoke(s.id)}
                  >
                    {t("st.revoke")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <p className="hs-note">
        <Icon name="lock" size={16} /> {t("pol.set.noStaff")}
      </p>

      {toast && <div className="st-toast">{toast}</div>}
    </DashboardLayout>
  );
}
