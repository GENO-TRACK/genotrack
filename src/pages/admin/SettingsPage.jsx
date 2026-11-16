import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import LanguageSwitch from "../../components/dashboard/LanguageSwitch";
import { useLanguage } from "../../i18n/LanguageContext";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";
import "./SettingsPage.css";

// ---- Demo data: replace with API calls later ----
const STATS = {
  nodes: { online: 124, total: 128 },
  uptime: "99.99",
  load: 24,
  temp: "42°C",
  syncAgo: "0.2s",
};

const OPERATIONS = [
  { id: "roles", icon: "roles", to: "/admin/settings/permissions" },
  { id: "audit", icon: "export" },
  { id: "recal", icon: "tune" },
  { id: "backup", icon: "database" },
];

const SECURITY = [
  { id: "encryption", icon: "lock", value: "AES-256-GCM", tone: "teal" },
  { id: "firewall", icon: "shield", value: "firewallValue", tone: "teal" },
  { id: "attempts", icon: "alert", value: "0", tone: "amber" },
];

const DATABASES = [
  { id: "codis", icon: "globe", value: "14.2M" },
  { id: "interpol", icon: "shield", value: "8.7M" },
  { id: "local", icon: "database", value: "2.1M" },
];

const MAINTENANCE = [
  { id: "hotfix", date: "Oct 14, 02:00", status: "scheduled" },
  { id: "migration", date: "Oct 21, 23:30", status: "pending" },
];

const PERSONNEL = [
  {
    id: "p1",
    name: "Aris Thorne",
    email: "a.thorne@genotrack.sentinel",
    tier: "admin",
    last: "now",
  },
  {
    id: "p2",
    name: "Elias Vance",
    email: "e.vance@genotrack.sentinel",
    tier: "lab",
    last: "hours",
  },
  {
    id: "p3",
    name: "Lena Rossi",
    email: "l.rossi@genotrack.sentinel",
    tier: "investigator",
    last: "yesterday",
  },
];

const SESSIONS = [
  {
    id: "s1",
    icon: "desktop",
    name: "Workstation F-12",
    ip: "192.168.1.44",
    place: "Lyon, FR",
    current: true,
  },
  {
    id: "s2",
    icon: "phone",
    name: "Secure Sentinel Mobile",
    ip: "10.0.4.12",
    place: "Marseille, FR",
    current: false,
  },
];

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

export default function SettingsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [autoLock, setAutoLock] = useState("15");
  const [sound, setSound] = useState(true);
  const [mfa, setMfa] = useState(true);
  const [sessions, setSessions] = useState(SESSIONS);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState("");

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function revoke(id) {
    setSessions((list) => list.filter((s) => s.id !== id));
  }

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("st.tag")}</span>
          <h1>
            {t("st.title1")} <span>{t("st.title2")}</span>
          </h1>
          <p>{t("st.subtitle")}</p>
        </div>
        <div className="st-head-actions">
          <button
            type="button"
            className="sf-btn"
            onClick={() => flash(t("st.discarded"))}
          >
            {t("st.discard")}
          </button>
          <button type="button" className="sm-add" onClick={save}>
            <Icon name="sync" size={18} />{" "}
            {saved ? t("st.synced") : t("st.sync")}
          </button>
        </div>
      </section>

      {/* System status */}
      <section className="st-stats">
        <article className="ad-card st-stat">
          <small>{t("st.nodes")}</small>
          <strong dir="ltr">
            {STATS.nodes.online}
            <span>
              {" "}
              / {STATS.nodes.total} {t("st.online")}
            </span>
          </strong>
          <div className="st-bar" dir="ltr">
            <i
              style={{
                width: `${(STATS.nodes.online / STATS.nodes.total) * 100}%`,
              }}
            />
          </div>
        </article>

        <article className="ad-card st-stat">
          <small>{t("st.dbSync")}</small>
          <strong className="teal">
            <Icon name="sync" size={22} /> {t("st.synchronized")}
          </strong>
          <em dir="ltr">{t("st.lastSync", { s: STATS.syncAgo })}</em>
        </article>

        <article className="ad-card st-stat">
          <small>{t("st.uptime")}</small>
          <strong dir="ltr">
            {STATS.uptime}
            <span>%</span>
          </strong>
          <em>{t("st.api")}</em>
        </article>

        <article className="ad-card st-stat">
          <small>{t("st.load")}</small>
          <strong dir="ltr">
            {STATS.load}
            <span>%</span>
          </strong>
          <div className="st-bar" dir="ltr">
            <i className="amber" style={{ width: `${STATS.load}%` }} />
          </div>
          <em dir="ltr">{t("st.temp", { c: STATS.temp })}</em>
        </article>
      </section>

      {/* Operations + identity */}
      <section className="st-grid">
        <article className="ad-card">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="settings" size={20} />
            </span>
            <h3>{t("st.operations")}</h3>
            <em className="st-auth">L4 · ADMIN</em>
          </div>

          <ul className="st-ops">
            {OPERATIONS.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => (o.to ? navigate(o.to) : flash(t("st.demo")))}
                >
                  <span className="st-ico-sm">
                    <Icon name={o.icon} size={18} />
                  </span>
                  <b>{t(`st.op.${o.id}`)}</b>
                  <Icon name="chevron" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="ad-card st-identity">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="user" size={20} />
            </span>
            <h3>{t("st.identity")}</h3>
            <em className="st-verified">
              <Icon name="check" size={13} /> {t("st.verified")}
            </em>
          </div>

          <div className="st-id-body">
            <div className="st-avatar">M</div>
            <dl className="st-fields">
              <div>
                <dt>{t("st.fullName")}</dt>
                <dd>Aris Thorne</dd>
              </div>
              <div>
                <dt>{t("st.serial")}</dt>
                <dd dir="ltr">GT-8842</dd>
              </div>
              <div>
                <dt>{t("st.department")}</dt>
                <dd>{t("st.dept")}</dd>
              </div>
              <div>
                <dt>{t("st.email")}</dt>
                <dd dir="ltr">a.thorne@genotrack.sentinel</dd>
              </div>
            </dl>
          </div>
        </article>
      </section>

      {/* Interface + security */}
      <section className="st-grid">
        <article className="ad-card">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="tune" size={20} />
            </span>
            <h3>{t("st.interface")}</h3>
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
                value={autoLock}
                onChange={(e) => setAutoLock(e.target.value)}
              >
                <option value="5">5 {t("st.min")}</option>
                <option value="15">15 {t("st.min")}</option>
                <option value="30">30 {t("st.min")}</option>
                <option value="60">60 {t("st.min")}</option>
              </select>
            </div>

            <div className="st-row">
              <div>
                <b>{t("st.sound")}</b>
                <small>{t("st.soundText")}</small>
              </div>
              <Toggle on={sound} onChange={setSound} label={t("st.sound")} />
            </div>
          </div>
        </article>

        <article className="ad-card">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="shield" size={20} />
            </span>
            <h3>{t("st.security")}</h3>
            <em className="st-verified">{t("st.layer7")}</em>
          </div>

          <div className="st-rows">
            <div className="st-row">
              <div>
                <b>{t("st.mfa")}</b>
                <small>{t("st.mfaText")}</small>
              </div>
              <Toggle on={mfa} onChange={setMfa} label={t("st.mfa")} />
            </div>
          </div>

          <ul className="st-secs">
            {SECURITY.map((s) => (
              <li key={s.id} className={s.tone}>
                <span className="st-ico-sm">
                  <Icon name={s.icon} size={18} />
                </span>
                <div>
                  <small>{t(`st.sec.${s.id}`)}</small>
                  <b dir="ltr">
                    {s.value === "firewallValue"
                      ? t("st.impenetrable")
                      : s.value}
                  </b>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {/* Sessions */}
      <section className="ad-card st-block">
        <div className="st-title">
          <span className="st-ico">
            <Icon name="history" size={20} />
          </span>
          <h3>{t("st.sessions")}</h3>
          <button
            type="button"
            className="sf-btn st-small"
            onClick={() => flash(t("st.demo"))}
          >
            <Icon name="key" size={14} />
            &nbsp;{t("st.rotate")}
          </button>
        </div>

        <ul className="st-sessions">
          {sessions.map((s) => (
            <li key={s.id}>
              <span className="st-ico-sm">
                <Icon name={s.icon} size={18} />
              </span>
              <div>
                <b>{s.name}</b>
                <small dir="ltr">
                  {s.ip} · {s.place}
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
      </section>

      {/* Personnel */}
      <section className="ad-card st-block">
        <div className="st-title">
          <span className="st-ico">
            <Icon name="roles" size={20} />
          </span>
          <h3>{t("st.personnel")}</h3>
          <button
            type="button"
            className="sm-add st-small"
            onClick={() => flash(t("st.demo"))}
          >
            <Icon name="userPlus" size={16} /> {t("st.deploy")}
          </button>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table st-table">
            <thead>
              <tr>
                <th>{t("st.col.subject")}</th>
                <th>{t("st.col.tier")}</th>
                <th>{t("st.col.status")}</th>
                <th>{t("st.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {PERSONNEL.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="st-person">
                      <span className="st-pav">{p.name[0]}</span>
                      <div>
                        <b>{p.name}</b>
                        <small dir="ltr">{p.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`st-tier ${p.tier}`}>
                      {t(`st.tier.${p.tier}`)}
                    </span>
                  </td>
                  <td className="st-last">{t(`st.last.${p.last}`)}</td>
                  <td>
                    <div className="st-row-actions">
                      <button type="button" onClick={() => flash(t("st.demo"))}>
                        {t("st.edit")}
                      </button>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => navigate("/admin/settings/permissions")}
                      >
                        {t("st.perms")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="st-showing">
          {t("st.showing", { n: PERSONNEL.length, total: 48 })}
        </p>
      </section>

      {/* Databases + maintenance */}
      <section className="st-grid">
        <article className="ad-card">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="database" size={20} />
            </span>
            <h3>{t("st.dbMeta")}</h3>
          </div>
          <ul className="st-dbs">
            {DATABASES.map((d) => (
              <li key={d.id}>
                <span className="st-ico-sm">
                  <Icon name={d.icon} size={18} />
                </span>
                <b>{t(`st.db.${d.id}`)}</b>
                <strong dir="ltr">{d.value}</strong>
                <small>{t("st.records")}</small>
              </li>
            ))}
          </ul>
        </article>

        <article className="ad-card">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="clock" size={20} />
            </span>
            <h3>{t("st.maintenance")}</h3>
          </div>
          <ul className="st-maint">
            {MAINTENANCE.map((m) => (
              <li key={m.id}>
                <div>
                  <small dir="ltr">{m.date}</small>
                  <b>{t(`st.m.${m.id}.title`)}</b>
                  <p>{t(`st.m.${m.id}.text`)}</p>
                </div>
                <em className={`st-mst ${m.status}`}>
                  {t(`st.mst.${m.status}`)}
                </em>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <footer className="ad-card st-foot">
        <span dir="ltr">Clinical Sentinel v8.2.0-secure</span>
        <div>
          <button type="button">{t("st.privacy")}</button>
          <button type="button">{t("st.ethics")}</button>
          <button type="button" onClick={() => navigate("/admin/custody")}>
            {t("st.audit")}
          </button>
        </div>
      </footer>

      {toast && <div className="st-toast">{toast}</div>}
    </DashboardLayout>
  );
}
