import { useMemo, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { findPatient, getAccessLog } from "../../auth/grants";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "./AccessLog.css";

const PAGE_SIZE = 8;
const TYPES = ["otp", "emergency", "registration", "release"];

export default function AccessLogPage() {
  const { t, lang } = useLanguage();

  // Read once when the page opens. The log is written by Patient Search
  // (otp / emergency), Newborn Registration (registration) and the
  // Reports page (release).
  const [log] = useState(() => getAccessLog());

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const patientName = (id) => {
    const p = findPatient(id);
    if (!p) return null;
    return lang === "ar" && p.nameAr ? p.nameAr : p.name;
  };

  const counts = useMemo(
    () => ({
      total: log.length,
      otp: log.filter((e) => e.type === "otp").length,
      emergency: log.filter((e) => e.type === "emergency").length,
      registration: log.filter((e) => e.type === "registration").length,
      release: log.filter((e) => e.type === "release").length,
    }),
    [log],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return log.filter((e) => {
      if (type !== "all" && e.type !== type) return false;
      if (!q) return true;
      const name = (patientName(e.patientId) || "").toLowerCase();
      return (
        String(e.patientId).toLowerCase().includes(q) ||
        String(e.staffId).toLowerCase().includes(q) ||
        name.includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log, query, type, lang]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const when = (iso) =>
    new Date(iso).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <DashboardLayout role="hospital_staff">
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("al.tag")}</span>
          <h1>
            {t("al.title1")} <span>{t("al.title2")}</span>
          </h1>
          <p>{t("al.subtitle")}</p>
        </div>
      </section>

      {/* Summary */}
      <section className="ad-stats">
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("al.total")}</span>
          </div>
          <strong>{counts.total}</strong>
        </article>
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("al.type.otp")}</span>
          </div>
          <strong>{counts.otp}</strong>
        </article>
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("al.type.emergency")}</span>
          </div>
          <strong className={counts.emergency ? "al-danger" : ""}>
            {counts.emergency}
          </strong>
        </article>
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("al.type.registration")}</span>
          </div>
          <strong>{counts.registration}</strong>
        </article>
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("al.type.release")}</span>
          </div>
          <strong>{counts.release}</strong>
        </article>
      </section>

      {/* Filters */}
      <section className="ad-card al-filters">
        <label className="al-search">
          <Icon name="search" size={18} />
          <input
            type="search"
            dir="ltr"
            placeholder={t("al.searchPh")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          className="al-select"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          aria-label={t("al.filterType")}
        >
          <option value="all">{t("al.allTypes")}</option>
          {TYPES.map((k) => (
            <option key={k} value={k}>
              {t(`al.type.${k}`)}
            </option>
          ))}
        </select>
      </section>

      {/* Table */}
      <section className="ad-card al-table-card">
        {rows.length === 0 ? (
          <p className="ps-hint al-empty">
            {log.length === 0 ? t("al.emptyAll") : t("al.emptyFilter")}
          </p>
        ) : (
          <div className="al-scroll">
            <table className="al-table">
              <thead>
                <tr>
                  <th>{t("al.col.when")}</th>
                  <th>{t("al.col.patient")}</th>
                  <th>{t("al.col.staff")}</th>
                  <th>{t("al.col.type")}</th>
                  <th>{t("al.col.reason")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e, i) => {
                  const name = patientName(e.patientId);
                  return (
                    <tr
                      key={`${e.at}-${i}`}
                      className={e.type === "emergency" ? "al-row-danger" : ""}
                    >
                      <td>{when(e.at)}</td>
                      <td>
                        {name && <strong>{name}</strong>}
                        <small dir="ltr">{e.patientId}</small>
                      </td>
                      <td dir="ltr">{e.staffId}</td>
                      <td>
                        <em className={`al-badge ${e.type}`}>
                          {t(`al.type.${e.type}`)}
                        </em>
                      </td>
                      <td>{e.reason ? e.reason : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <div className="al-pager">
            <button
              type="button"
              className="ps-ghost"
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
            >
              {t("al.prev")}
            </button>
            <span>
              {current} / {pages}
            </span>
            <button
              type="button"
              className="ps-ghost"
              disabled={current >= pages}
              onClick={() => setPage(current + 1)}
            >
              {t("al.next")}
            </button>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
