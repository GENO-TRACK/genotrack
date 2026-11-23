import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { listCases } from "../../auth/police";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "../lab/Lab.css";
import "./Police.css";

const PAGE_SIZE = 10;
const STATUSES = [
  "open",
  "sampleRequested",
  "sampleReceived",
  "matched",
  "noMatch",
  "resolved",
  "closed",
];

// All cases of the station. Two kinds: Missing Child (a family reports it)
// and Found Child (someone handed a child to the police).
export default function PoliceCasesPage() {
  const { t, lang } = useLanguage();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    listCases().then((list) => {
      if (!alive) return;
      setCases(list);
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
  const changeType = (v) => {
    setType(v);
    setPage(1);
  };
  const changeStatus = (v) => {
    setStatus(v);
    setPage(1);
  };

  const summary = useMemo(
    () => [
      { key: "total", value: cases.length, tone: "teal" },
      {
        key: "missing",
        value: cases.filter((c) => c.type === "missing").length,
        tone: "blue",
      },
      {
        key: "found",
        value: cases.filter((c) => c.type === "found").length,
        tone: "amber",
      },
      {
        key: "urgent",
        value: cases.filter(
          (c) =>
            c.priority === "high" &&
            c.status !== "resolved" &&
            c.status !== "closed",
        ).length,
        tone: "red",
      },
    ],
    [cases],
  );

  // Urgent first, then newest.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases
      .filter(
        (c) =>
          (type === "all" || c.type === type) &&
          (status === "all" || c.status === status) &&
          (!q ||
            c.id.toLowerCase().includes(q) ||
            c.childName.toLowerCase().includes(q) ||
            c.place.toLowerCase().includes(q) ||
            (c.placeAr || "").includes(query.trim()) ||
            c.reporter.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        const aOpen = a.status !== "resolved" && a.status !== "closed";
        const bOpen = b.status !== "resolved" && b.status !== "closed";
        if (aOpen !== bOpen) return aOpen ? -1 : 1;
        if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
        return a.openedAt < b.openedAt ? 1 : -1;
      });
  }, [cases, query, type, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : start + 1;
  const to = Math.min(start + PAGE_SIZE, filtered.length);

  const placeOf = (c) => (lang === "ar" && c.placeAr ? c.placeAr : c.place);
  const childLabel = (c) => c.childName || t("pol.unknownChild");

  return (
    <DashboardLayout role="police_investigator">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("pol.c.tag")}</span>
          <h1>
            {t("pol.c.title1")} <span>{t("pol.c.title2")}</span>
          </h1>
          <p>{t("pol.c.subtitle")}</p>
        </div>
        <Link to="/police/cases/new" className="sm-add">
          <Icon name="plus" size={18} /> {t("pol.newCase")}
        </Link>
      </section>

      {/* Summary */}
      <section className="ad-stats">
        {summary.map((s) => (
          <article key={s.key} className="ad-card ad-stat">
            <div className="ad-stat-top">
              <span>{t(`pol.c.sum.${s.key}`)}</span>
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
              placeholder={t("pol.c.searchPh")}
            />
          </div>
        </label>

        <label className="sm-field">
          <span>{t("pol.col.type")}</span>
          <select
            className="sm-select"
            value={type}
            onChange={(e) => changeType(e.target.value)}
          >
            <option value="all">{t("pol.c.allTypes")}</option>
            <option value="missing">{t("pol.type.missing")}</option>
            <option value="found">{t("pol.type.found")}</option>
          </select>
        </label>

        <label className="sm-field">
          <span>{t("sm.f.status")}</span>
          <select
            className="sm-select"
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
          >
            <option value="all">{t("sm.f.allStatus")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`pol.st.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* Table */}
      <section className="ad-card sm-table-card">
        <div className="ad-table-wrap lab-table-wrap">
          <table className="ad-table sm-table">
            <thead>
              <tr>
                <th>{t("pol.col.case")}</th>
                <th>{t("pol.col.type")}</th>
                <th>{t("pol.col.child")}</th>
                <th>{t("pol.col.place")}</th>
                <th>{t("pol.col.opened")}</th>
                <th>{t("pol.col.priority")}</th>
                <th>{t("pol.col.status")}</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="sm-empty">
                    {t("pol.c.empty")}
                  </td>
                </tr>
              )}
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="mono" dir="ltr">
                    <Link to={`/police/cases/${c.id}`} className="pol-link">
                      {c.id}
                    </Link>
                  </td>
                  <td>
                    <em className={`ad-status pol-type ${c.type}`}>
                      {t(`pol.type.${c.type}`)}
                    </em>
                  </td>
                  <td className="muted">{childLabel(c)}</td>
                  <td className="muted">{placeOf(c)}</td>
                  <td className="muted" dir="ltr">
                    {c.openedAt.slice(0, 10)}
                  </td>
                  <td>
                    <em className={`ad-status lab-prio ${c.priority}`}>
                      {t(`pol.prio.${c.priority}`)}
                    </em>
                  </td>
                  <td>
                    <em className={`ad-status pol-st ${c.status}`}>
                      {t(`pol.st.${c.status}`)}
                    </em>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm-foot">
          <small>
            {t("sm.showing")} {from}-{to} {t("sm.of")}{" "}
            {filtered.length.toLocaleString("en-US")} {t("pol.c.cases")}
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
