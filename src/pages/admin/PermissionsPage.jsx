import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/LanguageContext";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";
import "./SettingsPage.css";
import "./PermissionsPage.css";

// ---- Demo data: replace with API calls later ----
const PERSON = {
  name: "Aris Thorne",
  role: "Lab Tech",
  level: 4,
  lastLogin: "Oct 24, 2023 - 09:42 AM",
};

const RESOURCES = [
  { id: "samples", icon: "dna" },
  { id: "comparison", icon: "compare" },
  { id: "custody", icon: "chain" },
  { id: "reports", icon: "report" },
  { id: "settings", icon: "settings" },
];

const ACTIONS = ["read", "write", "export", "audit"];

const INITIAL_MATRIX = {
  samples: { read: true, write: true, export: false, audit: false },
  comparison: { read: true, write: false, export: false, audit: false },
  custody: { read: true, write: false, export: false, audit: true },
  reports: { read: true, write: false, export: true, audit: false },
  settings: { read: false, write: false, export: false, audit: false },
};

const HIGH = ["override", "delete", "exportForensic"];

export default function PermissionsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [matrix, setMatrix] = useState(INITIAL_MATRIX);
  const [high, setHigh] = useState({
    override: false,
    delete: false,
    exportForensic: true,
  });
  const [applied, setApplied] = useState(false);

  function toggle(res, act) {
    setMatrix((m) => ({ ...m, [res]: { ...m[res], [act]: !m[res][act] } }));
  }

  function setAll(value) {
    const next = {};
    RESOURCES.forEach((r) => {
      next[r.id] = {};
      ACTIONS.forEach((a) => (next[r.id][a] = value));
    });
    setMatrix(next);
  }

  function apply() {
    setApplied(true);
    setTimeout(() => navigate("/admin/settings"), 900);
  }

  const needsToken = HIGH.some((k) => high[k]);

  return (
    <DashboardLayout role="admin">
      {/* Breadcrumb + header */}
      <nav className="pm-crumbs" aria-label="breadcrumb">
        <Link to="/admin/settings">{t("nav.settings")}</Link>
        <span>/</span>
        <Link to="/admin/settings">{t("pm.roleMgmt")}</Link>
        <span>/</span>
        <b>{t("pm.edit")}</b>
      </nav>

      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("pm.tag")}</span>
          <h1>
            {t("pm.title")} <span dir="ltr">{PERSON.name}</span>
          </h1>
        </div>
        <button
          type="button"
          className="sf-btn"
          onClick={() => navigate("/admin/settings")}
        >
          <Icon name="back" size={16} />
          &nbsp;{t("pm.back")}
        </button>
      </section>

      {/* Person */}
      <section className="ad-card pm-person">
        <span className="pm-avatar">{PERSON.name[0]}</span>
        <div>
          <h3 dir="ltr">{PERSON.name}</h3>
          <div className="pm-badges">
            <em className="lab">{t("st.tier.lab")}</em>
            <em className="lvl">
              <Icon name="shield" size={13} />{" "}
              {t("pm.level", { n: PERSON.level })}
            </em>
          </div>
        </div>
        <div className="pm-last">
          <small>{t("pm.lastLogin")}</small>
          <b dir="ltr">{PERSON.lastLogin}</b>
        </div>
      </section>

      {/* Access matrix */}
      <section className="ad-card pm-matrix">
        <div className="st-title">
          <span className="st-ico">
            <Icon name="lock" size={20} />
          </span>
          <h3>{t("pm.matrix")}</h3>
          <div className="pm-bulk">
            <button type="button" onClick={() => setAll(true)}>
              {t("pm.selectAll")}
            </button>
            <button type="button" onClick={() => setAll(false)}>
              {t("pm.clearAll")}
            </button>
          </div>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table pm-table">
            <thead>
              <tr>
                <th>{t("pm.resource")}</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="c">
                    {t(`pm.act.${a}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="pm-res">
                      <span className="st-ico-sm">
                        <Icon name={r.icon} size={18} />
                      </span>
                      <div>
                        <b>{t(`pm.res.${r.id}`)}</b>
                        <small>{t(`pm.res.${r.id}.text`)}</small>
                      </div>
                    </div>
                  </td>
                  {ACTIONS.map((a) => (
                    <td key={a} className="c">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={matrix[r.id][a]}
                        aria-label={`${t(`pm.res.${r.id}`)} - ${t(`pm.act.${a}`)}`}
                        className={`pm-check ${matrix[r.id][a] ? "on" : ""}`}
                        onClick={() => toggle(r.id, a)}
                      >
                        {matrix[r.id][a] && <Icon name="check" size={14} />}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* High security */}
      <section className="ad-card pm-high">
        <div className="st-title">
          <span className="st-ico amber">
            <Icon name="alert" size={20} />
          </span>
          <div className="pm-high-title">
            <h3>{t("pm.high")}</h3>
            <small>{t("pm.highText")}</small>
          </div>
        </div>

        <div className="st-rows">
          {HIGH.map((k) => (
            <div key={k} className="st-row">
              <div>
                <b>{t(`pm.h.${k}`)}</b>
                <small>{t(`pm.h.${k}.text`)}</small>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={high[k]}
                aria-label={t(`pm.h.${k}`)}
                className={`st-switch ${high[k] ? "on" : ""}`}
                onClick={() => setHigh((h) => ({ ...h, [k]: !h[k] }))}
              >
                <i />
              </button>
            </div>
          ))}
        </div>

        {needsToken && (
          <p className="pm-token">
            <Icon name="key" size={16} /> {t("pm.token")}
          </p>
        )}
      </section>

      {/* Footer actions */}
      <footer className="pm-foot">
        <em className="pm-helix">
          <Icon name="shield" size={14} /> {t("pm.helix")}
        </em>
        <div>
          <button
            type="button"
            className="sf-btn"
            onClick={() => navigate("/admin/settings")}
          >
            {t("pm.cancel")}
          </button>
          <button type="button" className="sm-add" onClick={apply}>
            {applied ? t("pm.applied") : t("pm.apply")}
          </button>
        </div>
      </footer>
    </DashboardLayout>
  );
}
