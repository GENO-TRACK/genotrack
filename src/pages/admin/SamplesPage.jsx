import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/LanguageContext";
import "./AdminDashboard.css";
import "./SamplesPage.css";

// ---- Demo data: replace with API calls later ----
const SUMMARY = [
  { key: "total", value: "2,841", tone: "teal" },
  { key: "pending", value: "142", tone: "amber" },
  { key: "risk", value: "28", tone: "red" },
  { key: "families", value: "892", tone: "blue" },
];

const SAMPLES = [
  {
    id: "GT-99281-X",
    name: "Baby Doe #99281",
    ward: "NICU · Bed 12-A",
    type: "buccal",
    date: "Oct 24, 2023",
    caseId: "C-4421-B",
    risk: "high",
    status: "matched",
  },
  {
    id: "GT-48210-L",
    name: "Sarah Jenkins",
    ward: "Post-Op Recovery",
    type: "blood",
    date: "Oct 23, 2023",
    caseId: "C-1290-A",
    risk: "low",
    status: "pending",
  },
  {
    id: "GT-00129-Z",
    name: "Baby Roe #00129",
    ward: "NICU · Bed 04-B",
    type: "blood",
    date: "Oct 22, 2023",
    caseId: "C-9910-K",
    risk: "medium",
    status: "analyzed",
  },
  {
    id: "GT-88219-W",
    name: "Mark Thompson",
    ward: "General Ward 3",
    type: "tissue",
    date: "Oct 21, 2023",
    caseId: "C-0021-M",
    risk: "low",
    status: "matched",
  },
];

const PAGE_SIZE = 10;
const TOTAL = 2841;

const initials = (name) =>
  name
    .replace("#", "")
    .split(" ")
    .filter((p) => /^[A-Za-z]/.test(p))
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function SamplesPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLES.filter(
      (s) =>
        (status === "all" || s.status === status) &&
        (risk === "all" || s.risk === risk) &&
        (type === "all" || s.type === type) &&
        (!q ||
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.caseId.toLowerCase().includes(q)),
    );
  }, [query, status, risk, type]);

  const pages = Math.ceil(TOTAL / PAGE_SIZE);
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, TOTAL);

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("sm.tag")}</span>
          <h1>
            {t("sm.title1")} <span>{t("sm.title2")}</span>
          </h1>
          <p>{t("sm.subtitle")}</p>
        </div>
        <Link to="/admin/samples/new" className="sm-add">
          <Icon name="plus" size={18} /> {t("sm.add")}
        </Link>
      </section>

      {/* Summary */}
      <section className="ad-stats">
        {SUMMARY.map((s) => (
          <article key={s.key} className="ad-card ad-stat">
            <div className="ad-stat-top">
              <span>{t(`sm.sum.${s.key}`)}</span>
              <i className={`sm-pip ${s.tone}`} />
            </div>
            <strong>{s.value}</strong>
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("sm.f.searchPh")}
            />
          </div>
        </label>

        <label className="sm-field">
          <span>{t("sm.f.status")}</span>
          <select
            className="sm-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
            onChange={(e) => setRisk(e.target.value)}
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
            onChange={(e) => setType(e.target.value)}
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
              {rows.length === 0 && (
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
                        {s.name}
                        <small>{s.ward}</small>
                      </span>
                    </span>
                  </td>
                  <td className="muted">{t(`sm.type.${s.type}`)}</td>
                  <td className="muted">{s.date}</td>
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
            {TOTAL.toLocaleString("en-US")} {t("sm.specimens")}
          </small>
          <div className="sm-pager">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label={t("sm.prev")}
            >
              <Icon name="chevron" size={16} />
            </button>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={page === n ? "on" : ""}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
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
