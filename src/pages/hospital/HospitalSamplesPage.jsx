import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { CURRENT_HOSPITAL, listHospitalSamples } from "../../auth/grants";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";

const PAGE_SIZE = 10;

const initials = (name) =>
  String(name || "")
    .replace("#", "")
    .split(" ")
    .filter((p) => /^[A-Za-z]/.test(p))
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "•";

export default function HospitalSamplesPage() {
  const { t, lang } = useLanguage();
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  // Only this hospital's samples are loaded.
  useEffect(() => {
    let alive = true;
    listHospitalSamples(CURRENT_HOSPITAL.id).then((list) => {
      if (!alive) return;
      setSamples(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Every filter goes back to page 1 when it changes (done in the handlers,
  // not in an effect).
  const changeQuery = (v) => {
    setQuery(v);
    setPage(1);
  };
  const changeStatus = (v) => {
    setStatus(v);
    setPage(1);
  };
  const changeRisk = (v) => {
    setRisk(v);
    setPage(1);
  };
  const changeType = (v) => {
    setType(v);
    setPage(1);
  };

  const summary = useMemo(
    () => [
      { key: "total", value: samples.length, tone: "teal" },
      {
        key: "pending",
        value: samples.filter((s) => s.status === "pending").length,
        tone: "amber",
      },
      {
        key: "risk",
        value: samples.filter((s) => s.risk === "high").length,
        tone: "red",
      },
      {
        key: "matched",
        value: samples.filter((s) => s.status === "matched").length,
        tone: "blue",
      },
    ],
    [samples],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return samples.filter(
      (s) =>
        (status === "all" || s.status === status) &&
        (risk === "all" || s.risk === risk) &&
        (type === "all" || s.type === type) &&
        (!q ||
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.nameAr.includes(query.trim()) ||
          s.caseId.toLowerCase().includes(q)),
    );
  }, [samples, query, status, risk, type]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : start + 1;
  const to = Math.min(start + PAGE_SIZE, filtered.length);

  const personName = (s) => (lang === "ar" && s.nameAr ? s.nameAr : s.name);
  const wardName = (s) => (lang === "ar" && s.wardAr ? s.wardAr : s.ward);

  return (
    <DashboardLayout role="hospital_staff">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("hsl.tag")}</span>
          <h1>
            {t("hsl.title1")} <span>{t("hsl.title2")}</span>
          </h1>
          <p>{t("hsl.subtitle", { hospital: CURRENT_HOSPITAL.name })}</p>
        </div>
        <Link to="/hospital/newborn" className="sm-add">
          <Icon name="plus" size={18} /> {t("hs.add")}
        </Link>
      </section>

      {/* Summary */}
      <section className="ad-stats">
        {summary.map((s) => (
          <article key={s.key} className="ad-card ad-stat">
            <div className="ad-stat-top">
              <span>{t(`hs.sum.${s.key}`)}</span>
              <i className={`sm-pip ${s.tone}`} />
            </div>
            <strong>{s.value.toLocaleString("en-US")}</strong>
          </article>
        ))}
      </section>

      {/* Filters */}
      <section className="ad-card sm-filters">
        <label className="sm-field sm-field-search">
          <span>{t("sm.f.search")}</span>
          <div className="sm-input">
            <Icon name="search" size={18} />
            <input
              type="search"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder={t("sm.f.searchPh")}
            />
          </div>
        </label>

        <label className="sm-field">
          <span>{t("sm.f.status")}</span>
          <select
            className="sm-select"
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
          >
            <option value="all">{t("sm.f.allStatus")}</option>
            <option value="matched">{t("sm.status.matched")}</option>
            <option value="pending">{t("sm.status.pending")}</option>
            <option value="analyzed">{t("sm.status.analyzed")}</option>
          </select>
        </label>

        <label className="sm-field">
          <span>{t("sm.f.risk")}</span>
          <select
            className="sm-select"
            value={risk}
            onChange={(e) => changeRisk(e.target.value)}
          >
            <option value="all">{t("sm.f.allRisk")}</option>
            <option value="high">{t("sm.risk.high")}</option>
            <option value="medium">{t("sm.risk.medium")}</option>
            <option value="low">{t("sm.risk.low")}</option>
          </select>
        </label>

        <label className="sm-field">
          <span>{t("sm.f.type")}</span>
          <select
            className="sm-select"
            value={type}
            onChange={(e) => changeType(e.target.value)}
          >
            <option value="all">{t("sm.f.allType")}</option>
            <option value="buccal">{t("sm.type.buccal")}</option>
            <option value="blood">{t("sm.type.blood")}</option>
            <option value="tissue">{t("sm.type.tissue")}</option>
          </select>
        </label>
      </section>

      {/* Table */}
      <section className="ad-card sm-table-card">
        <div className="ad-table-wrap">
          <table className="ad-table sm-table">
            <thead>
              <tr>
                <th>{t("sm.col.id")}</th>
                <th>{t("sm.col.patient")}</th>
                <th>{t("sm.col.type")}</th>
                <th>{t("sm.col.date")}</th>
                <th>{t("sm.col.case")}</th>
                <th>{t("sm.col.risk")}</th>
                <th>{t("sm.col.status")}</th>
                <th aria-label={t("sm.col.actions")} />
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="sm-empty">
                    {t("sm.empty")}
                  </td>
                </tr>
              )}
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="mono" dir="ltr">
                    {s.id}
                  </td>
                  <td>
                    <span className="ad-subject">
                      <b>{initials(s.name)}</b>
                      <span className="sm-who">
                        {personName(s)}
                        <small>{wardName(s)}</small>
                      </span>
                    </span>
                  </td>
                  <td className="muted">{t(`sm.type.${s.type}`)}</td>
                  <td className="muted" dir="ltr">
                    {s.date}
                  </td>
                  <td className="mono" dir="ltr">
                    {s.caseId}
                  </td>
                  <td>
                    <em className={`ad-status sm-risk ${s.risk}`}>
                      {t(`sm.risk.${s.risk}`)}
                    </em>
                  </td>
                  <td>
                    <em className={`ad-status ${s.status}`}>
                      {t(`sm.status.${s.status}`)}
                    </em>
                  </td>
                  <td className="right">
                    <button
                      type="button"
                      className="ad-more"
                      aria-label={t("sm.view")}
                      title={t("sm.view")}
                    >
                      <Icon name="eye" size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm-foot">
          <small>
            {t("sm.showing")} {from}-{to} {t("sm.of")}{" "}
            {filtered.length.toLocaleString("en-US")} {t("sm.specimens")}
          </small>
          <div className="sm-pager">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label={t("sm.prev")}
            >
              <Icon name="chevron" size={16} />
            </button>
            {Array.from({ length: Math.min(pages, 3) }, (_, i) => i + 1).map(
              (n) => (
                <button
                  key={n}
                  type="button"
                  className={safePage === n ? "on" : ""}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={safePage === pages}
              aria-label={t("sm.next")}
            >
              <Icon name="chevron" size={16} />
            </button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
