import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import LanguageSwitch from "../../components/dashboard/LanguageSwitch";
import { useLanguage } from "../../i18n/useLanguage";
import { getUser } from "../../auth/session";
import { listLabSamples } from "../../auth/lab";
import { listCases } from "../../auth/police";
import {
  ADMIN_PERSONNEL,
  getAdminKeysRotatedAt,
  getAdminPrefs,
  listAdminSessions,
  revokeAdminSession,
  rotateAdminKeys,
  saveAdminPrefs,
} from "../../auth/adminSettings";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";
import "./SettingsPage.css";
import "../hospital/HospitalSettings.css";

// Fixed facts of the platform (not demo numbers): the encryption in use and
// the version shown in the footer.
const ENCRYPTION = "AES-256-GCM";
const VERSION = "Clinical Sentinel v8.2.0-secure";

const OPERATIONS = [
  { id: "roles", icon: "roles", to: "/admin/settings/permissions" },
  { id: "audit", icon: "export" },
  { id: "recal", icon: "tune", to: "/admin/samples" },
  { id: "backup", icon: "database" },
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

function download(name, text, type = "text/plain") {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function SettingsPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const user = getUser();
  const userId = user?.nationalId || "ADMIN";

  const [prefs, setPrefs] = useState(() => getAdminPrefs(userId));
  const [sessions, setSessions] = useState([]);
  const [samples, setSamples] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rotatedAt, setRotatedAt] = useState(() =>
    getAdminKeysRotatedAt(userId),
  );
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      listLabSamples(),
      listCases(),
      listAdminSessions(userId),
    ]).then(([s, c, ses]) => {
      if (!alive) return;
      setSamples(s);
      setCases(c);
      setSessions(ses);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function setPref(key, value) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function save() {
    saveAdminPrefs(userId, prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function discard() {
    setPrefs(getAdminPrefs(userId));
    flash(t("st.discarded"));
  }

  function revoke(id) {
    revokeAdminSession(userId, id);
    setSessions((list) => list.filter((s) => s.id !== id));
  }

  function rotateKeys() {
    const at = rotateAdminKeys(userId);
    setRotatedAt(at);
    setSessions((list) => list.filter((s) => s.current));
    flash(t("st.rotated"));
  }

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [lang],
  );

  // ---- Numbers taken from the real lab samples and police cases ----
  const stats = useMemo(() => {
    const total = samples.length;
    const done = samples.filter((s) => s.status === "done").length;
    const flagged = samples.filter((s) => s.flagged).length;
    const received = samples.filter((s) => s.status === "received").length;
    const sequencing = samples.filter((s) => s.status === "sequencing").length;
    const hospitals = new Set(samples.map((s) => s.hospital)).size;
    const open = cases.filter((c) => c.status !== "resolved").length;
    const lastEvent = samples
      .flatMap((s) => (s.history || []).map((h) => h.at))
      .concat(samples.map((s) => s.receivedAt))
      .sort()
      .pop();
    return {
      total,
      done,
      flagged,
      received,
      sequencing,
      hospitals,
      open,
      lastEvent,
    };
  }, [samples, cases]);

  // Share of samples already finished, and share still being worked on.
  const doneShare = stats.total
    ? Math.round((stats.done / stats.total) * 100)
    : 0;
  const activeShare = stats.total
    ? Math.round(((stats.received + stats.sequencing) / stats.total) * 100)
    : 0;

  const databases = [
    { id: "samples", icon: "database", value: stats.total },
    { id: "cases", icon: "shield", value: cases.length },
    { id: "hospitals", icon: "globe", value: stats.hospitals },
  ];

  // Work waiting to be done: built from the real queue.
  const upcoming = useMemo(() => {
    const out = [];
    if (stats.received > 0)
      out.push({ id: "queue", n: stats.received, status: "pending" });
    if (stats.sequencing > 0)
      out.push({ id: "sequencing", n: stats.sequencing, status: "scheduled" });
    if (stats.flagged > 0)
      out.push({ id: "flags", n: stats.flagged, status: "attention" });
    if (stats.open > 0)
      out.push({ id: "cases", n: stats.open, status: "scheduled" });
    return out;
  }, [stats]);

  // ---- Operations ----
  function exportAudit() {
    const rows = [["type", "id", "hospital", "by", "at", "note"].join(",")];
    samples.forEach((s) => {
      const events = [
        ...(s.history || []).map((h) => ({
          type: h.type,
          by: h.staffId || "",
          at: h.at,
          note: h.note || "",
        })),
        {
          type: "received",
          by: s.transferredBy || "courier",
          at: s.receivedAt,
          note: "",
        },
      ];
      events.forEach((e) =>
        rows.push(
          [e.type, s.id, s.hospital, e.by, e.at, e.note].map(csvCell).join(","),
        ),
      );
    });
    cases.forEach((c) => {
      (c.log || []).forEach((e) =>
        rows.push(
          [`case.${e.type}`, c.id, "", e.by || "", e.at || "", ""]
            .map(csvCell)
            .join(","),
        ),
      );
    });
    download("genotrack-audit-log.csv", rows.join("\n"), "text/csv");
    flash(t("st.auditExported", { n: rows.length - 1 }));
  }

  function verifyBackup() {
    const missing = samples.filter((s) => !s.hospital || !s.type).length;
    flash(
      missing === 0
        ? t("st.backupOk", { n: samples.length })
        : t("st.backupMissing", { n: missing }),
    );
  }

  function runOperation(o) {
    if (o.id === "audit") return exportAudit();
    if (o.id === "backup") return verifyBackup();
    if (o.to) return navigate(o.to);
    return undefined;
  }

  const displayName =
    user?.name || (lang === "ar" ? "مدير الوزارة" : "Ministry Admin");

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
          <button type="button" className="sf-btn" onClick={discard}>
            {t("st.discard")}
          </button>
          <button type="button" className="sm-add" onClick={save}>
            <Icon name="check" size={18} />{" "}
            {saved ? t("st.synced") : t("st.sync")}
          </button>
        </div>
      </section>

      {/* System status: real numbers */}
      <section className="st-stats">
        <article className="ad-card st-stat">
          <small>{t("st.nodes")}</small>
          <strong dir="ltr">
            {loading ? "…" : stats.hospitals}
            <span> {t("st.sendingHospitals")}</span>
          </strong>
          <em>{t("st.nodesText", { n: stats.total })}</em>
        </article>

        <article className="ad-card st-stat">
          <small>{t("st.dbSync")}</small>
          <strong className={stats.flagged > 0 ? "amber" : "teal"}>
            <Icon name="sync" size={22} />{" "}
            {stats.flagged > 0 ? t("st.needsReview") : t("st.synchronized")}
          </strong>
          <em>
            {stats.lastEvent
              ? t("st.lastActivity", {
                  d: fmt.format(new Date(stats.lastEvent)),
                })
              : t("st.noActivity")}
          </em>
        </article>

        <article className="ad-card st-stat">
          <small>{t("st.uptime")}</small>
          <strong dir="ltr">
            {loading ? "…" : doneShare}
            <span>%</span>
          </strong>
          <div className="st-bar" dir="ltr">
            <i style={{ width: `${doneShare}%` }} />
          </div>
          <em>{t("st.finishedOf", { n: stats.done, total: stats.total })}</em>
        </article>

        <article className="ad-card st-stat">
          <small>{t("st.load")}</small>
          <strong dir="ltr">
            {loading ? "…" : activeShare}
            <span>%</span>
          </strong>
          <div className="st-bar" dir="ltr">
            <i className="amber" style={{ width: `${activeShare}%` }} />
          </div>
          <em>{t("st.inLab", { n: stats.received + stats.sequencing })}</em>
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
                <button type="button" onClick={() => runOperation(o)}>
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
            <div className="st-avatar">{String(displayName).charAt(0)}</div>
            <dl className="st-fields">
              <div>
                <dt>{t("st.fullName")}</dt>
                <dd>{displayName}</dd>
              </div>
              <div>
                <dt>{t("st.serial")}</dt>
                <dd dir="ltr">{userId}</dd>
              </div>
              <div>
                <dt>{t("st.department")}</dt>
                <dd>{t("st.dept")}</dd>
              </div>
              <div>
                <dt>{t("st.accessLevel")}</dt>
                <dd>{t("st.accessLevelValue")}</dd>
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
                <b>{t("st.sound")}</b>
                <small>{t("st.soundText")}</small>
              </div>
              <Toggle
                on={prefs.sound}
                onChange={(v) => setPref("sound", v)}
                label={t("st.sound")}
              />
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
              <Toggle
                on={prefs.mfa}
                onChange={(v) => setPref("mfa", v)}
                label={t("st.mfa")}
              />
            </div>
          </div>

          <ul className="st-secs">
            <li className="teal">
              <span className="st-ico-sm">
                <Icon name="lock" size={18} />
              </span>
              <div>
                <small>{t("st.sec.encryption")}</small>
                <b dir="ltr">{ENCRYPTION}</b>
              </div>
            </li>
            <li className={sessions.length > 1 ? "amber" : "teal"}>
              <span className="st-ico-sm">
                <Icon name="shield" size={18} />
              </span>
              <div>
                <small>{t("st.sec.sessions")}</small>
                <b dir="ltr">{sessions.length}</b>
              </div>
            </li>
            <li className={stats.flagged > 0 ? "amber" : "teal"}>
              <span className="st-ico-sm">
                <Icon name="alert" size={18} />
              </span>
              <div>
                <small>{t("st.sec.flags")}</small>
                <b dir="ltr">{stats.flagged}</b>
              </div>
            </li>
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
            onClick={rotateKeys}
          >
            <Icon name="key" size={14} />
            &nbsp;{t("st.rotate")}
          </button>
        </div>
        <p className="st-showing">
          {rotatedAt
            ? t("st.rotatedAt", { d: fmt.format(new Date(rotatedAt)) })
            : t("st.neverRotated")}
        </p>

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
            onClick={() => navigate("/admin/settings/permissions")}
          >
            <Icon name="roles" size={16} /> {t("st.manageRoles")}
          </button>
        </div>

        <div className="ad-table-wrap hs-staff-wrap">
          <table className="ad-table st-table">
            <thead>
              <tr>
                <th>{t("st.col.subject")}</th>
                <th>{t("st.col.tier")}</th>
                <th>{t("st.col.area")}</th>
                <th>{t("st.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_PERSONNEL.map((p) => {
                const me = p.id === userId;
                const name = lang === "ar" ? p.nameAr : p.name;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="st-person">
                        <span className="st-pav">{name.charAt(0)}</span>
                        <div>
                          <b>
                            {name}
                            {me && <em className="hs-you">{t("hs.you")}</em>}
                          </b>
                          <small dir="ltr">{p.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`st-tier ${p.tier}`}>
                        {t(`st.tier.${p.tier}`)}
                      </span>
                    </td>
                    <td className="st-last" dir="ltr">
                      {p.area}
                    </td>
                    <td>
                      <div className="st-row-actions">
                        <button
                          type="button"
                          className="primary"
                          onClick={() =>
                            navigate("/admin/settings/permissions")
                          }
                        >
                          {t("st.perms")}
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
          {t("st.showing", {
            n: ADMIN_PERSONNEL.length,
            total: ADMIN_PERSONNEL.length,
          })}
        </p>
      </section>

      {/* Databases + work waiting */}
      <section className="st-grid">
        <article className="ad-card">
          <div className="st-title">
            <span className="st-ico">
              <Icon name="database" size={20} />
            </span>
            <h3>{t("st.dbMeta")}</h3>
          </div>
          <ul className="st-dbs">
            {databases.map((d) => (
              <li key={d.id}>
                <span className="st-ico-sm">
                  <Icon name={d.icon} size={18} />
                </span>
                <b>{t(`st.db.${d.id}`)}</b>
                <strong dir="ltr">{loading ? "…" : d.value}</strong>
                <small>{t(`st.dbUnit.${d.id}`)}</small>
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
          {upcoming.length === 0 ? (
            <p className="st-showing">{t("st.nothingWaiting")}</p>
          ) : (
            <ul className="st-maint">
              {upcoming.map((m) => (
                <li key={m.id}>
                  <div>
                    <small dir="ltr">{m.n}</small>
                    <b>{t(`st.w.${m.id}.title`)}</b>
                    <p>{t(`st.w.${m.id}.text`, { n: m.n })}</p>
                  </div>
                  <em className={`st-mst ${m.status}`}>
                    {t(`st.mst.${m.status}`)}
                  </em>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <footer className="ad-card st-foot">
        <span dir="ltr">{VERSION}</span>
        <div>
          <button type="button" onClick={() => navigate("/privacy")}>
            {t("st.privacy")}
          </button>
          <button type="button" onClick={() => navigate("/terms")}>
            {t("st.ethics")}
          </button>
          <button type="button" onClick={() => navigate("/admin/custody")}>
            {t("st.audit")}
          </button>
        </div>
      </footer>

      {toast && <div className="st-toast">{toast}</div>}
    </DashboardLayout>
  );
}
