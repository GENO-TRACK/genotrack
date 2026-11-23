import { useEffect, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import LanguageSwitch from "../../components/dashboard/LanguageSwitch";
import { useLanguage } from "../../i18n/useLanguage";
import { getUser } from "../../auth/session";
import {
  CURRENT_HOSPITAL,
  getHospitalPrefs,
  listHospitalSessions,
  listHospitalStaff,
  revokeHospitalSession,
  saveHospitalPrefs,
  setStaffRole,
  setStaffStatus,
} from "../../auth/grants";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "../admin/ComparisonPage.css";
import "../admin/SettingsPage.css";
import "./HospitalSettings.css";

const ROLES = ["hospital_admin", "geneticist", "staff"];

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

export default function HospitalSettingsPage() {
  const { t, lang } = useLanguage();
  const user = getUser();
  const userId = user?.nationalId || "unknown";
  const myRole = user?.hospitalRole || "staff";
  const isAdmin = myRole === "hospital_admin";

  const [prefs, setPrefs] = useState(() => getHospitalPrefs(userId));
  const [sessions, setSessions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let alive = true;
    listHospitalSessions(userId).then((list) => {
      if (alive) setSessions(list);
    });
    if (isAdmin) {
      listHospitalStaff({ hospitalId: CURRENT_HOSPITAL.id, userId }).then(
        (list) => {
          if (alive) setStaff(list);
        },
      );
    }
    return () => {
      alive = false;
    };
  }, [userId, isAdmin]);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  function setPref(key, value) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function save() {
    saveHospitalPrefs(userId, prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function discard() {
    setPrefs(getHospitalPrefs(userId));
    flash(t("hs.discarded"));
  }

  function revoke(id) {
    revokeHospitalSession(userId, id);
    setSessions((list) => list.filter((s) => s.id !== id));
  }

  function changeRole(id, role) {
    setStaffRole(id, role);
    setStaff((list) => list.map((s) => (s.id === id ? { ...s, role } : s)));
    flash(t("hs.roleChanged"));
  }

  function toggleStatus(person) {
    const next = person.status === "active" ? "suspended" : "active";
    setStaffStatus(person.id, next);
    setStaff((list) =>
      list.map((s) => (s.id === person.id ? { ...s, status: next } : s)),
    );
    flash(next === "active" ? t("hs.activated") : t("hs.suspended"));
  }

  const hospitalName =
    lang === "ar" ? CURRENT_HOSPITAL.nameAr || CURRENT_HOSPITAL.name : CURRENT_HOSPITAL.name;
  const activeCount = staff.filter((s) => s.status === "active").length;

  return (
    <DashboardLayout role="hospital_staff">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("hs.tag")}</span>
          <h1>
            {t("hs.title1")} <span>{t("hs.title2")}</span>
          </h1>
          <p>{t("hs.subtitle", { hospital: hospitalName })}</p>
        </div>
        <div className="st-head-actions">
          <button type="button" className="sf-btn" onClick={discard}>
            {t("hs.discard")}
          </button>
          <button type="button" className="sm-add" onClick={save}>
            <Icon name="check" size={18} />{" "}
            {saved ? t("hs.saved") : t("hs.save")}
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
            <h3>{t("hs.identity")}</h3>
            <em className="st-verified">
              <Icon name="check" size={13} /> {t("hs.verified")}
            </em>
          </div>

          <div className="st-id-body">
            <div className="st-avatar">{String(userId).charAt(0)}</div>
            <dl className="st-fields">
              <div>
                <dt>{t("hs.staffId")}</dt>
                <dd dir="ltr">{userId}</dd>
              </div>
              <div>
                <dt>{t("hs.role")}</dt>
                <dd>{t(`hs.role.${myRole}`)}</dd>
              </div>
              <div>
                <dt>{t("hs.hospital")}</dt>
                <dd>{hospitalName}</dd>
              </div>
              <div>
                <dt>{t("hs.access")}</dt>
                <dd>{t(`hs.access.${myRole}`)}</dd>
              </div>
            </dl>
          </div>
        </article>

        <article className="ad-card">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="settings" size={20} />
            </span>
            <h3>{t("hs.interface")}</h3>
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
                <b>{t("hs.sound")}</b>
                <small>{t("hs.soundText")}</small>
              </div>
              <Toggle
                on={prefs.sound}
                onChange={(v) => setPref("sound", v)}
                label={t("hs.sound")}
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
            <h3>{t("hs.security")}</h3>
          </div>

          <div className="st-rows">
            <div className="st-row">
              <div>
                <b>{t("st.mfa")}</b>
                <small>{t("hs.mfaText")}</small>
              </div>
              <Toggle
                on={prefs.mfa}
                onChange={(v) => setPref("mfa", v)}
                label={t("st.mfa")}
              />
            </div>
            <div className="st-row">
              <div>
                <b>{t("hs.otpNotice")}</b>
                <small>{t("hs.otpNoticeText")}</small>
              </div>
              <Toggle
                on={prefs.otpNotice}
                onChange={(v) => setPref("otpNotice", v)}
                label={t("hs.otpNotice")}
              />
            </div>
          </div>
        </article>

        <article className="ad-card">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="clock" size={20} />
            </span>
            <h3>{t("hs.sessions")}</h3>
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

      {/* Staff list: hospital admin only */}
      {isAdmin ? (
        <section className="ad-card st-block">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="people" size={20} />
            </span>
            <h3>{t("hs.staff")}</h3>
          </div>

          <div className="ad-table-wrap hs-staff-wrap">
            <table className="ad-table st-table">
              <thead>
                <tr>
                  <th>{t("st.col.subject")}</th>
                  <th>{t("hs.col.role")}</th>
                  <th>{t("st.col.status")}</th>
                  <th>{t("st.col.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((p) => {
                  const me = p.id === userId;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="st-person">
                          <span className="st-pav">
                            {(lang === "ar" ? p.nameAr : p.name).charAt(0)}
                          </span>
                          <div>
                            <b>
                              {lang === "ar" ? p.nameAr : p.name}
                              {me && <em className="hs-you">{t("hs.you")}</em>}
                            </b>
                            <small dir="ltr">{p.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          className="hs-role-select"
                          value={p.role}
                          disabled={me}
                          aria-label={t("hs.col.role")}
                          onChange={(e) => changeRole(p.id, e.target.value)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {t(`hs.role.${r}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`hs-status ${p.status}`}>
                          {t(`hs.status.${p.status}`)}
                        </span>
                      </td>
                      <td>
                        <div className="st-row-actions">
                          <button
                            type="button"
                            className={p.status === "active" ? "warn" : "primary"}
                            disabled={me}
                            onClick={() => toggleStatus(p)}
                          >
                            {p.status === "active"
                              ? t("hs.suspend")
                              : t("hs.activate")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="st-showing">
            {t("hs.showing", { n: activeCount, total: staff.length })}
          </p>
        </section>
      ) : (
        <p className="hs-note">
          <Icon name="lock" size={16} /> {t("hs.staffOnlyAdmin")}
        </p>
      )}

      {toast && <div className="st-toast">{toast}</div>}
    </DashboardLayout>
  );
}
