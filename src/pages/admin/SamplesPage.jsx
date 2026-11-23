import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { listLabSamples } from "../../auth/lab";
import { listHospitalSamples, listHospitalFamilies } from "../../auth/grants";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "../lab/Lab.css";

// The admin library reads the same demo data as the lab and the hospital:
//   - the sample itself (hospital, type, status, date) -> listLabSamples
//   - what the admin typed on Add Sample (subject, case ID, risk level)
//     -> listLabSamples
//   - patient, ward, case and risk for the hospital's own samples
//     -> listHospitalSamples (joined by sample ID)
//   - families -> listHospitalFamilies
// A value typed on Add Sample wins over the hospital's record.
// Nothing here is typed in by hand, so every number matches the other pages.

const PAGE_SIZE = 10;
const MISSING = "—";

// Prefer the collection date typed on the form, then the received date.
const shortDate = (s) => {
  const iso = s.collectedAt || s.receivedAt || "";
  return iso ? iso.slice(0, 10) : "";
};

const initials = (name) =>
  String(name || "")
    .replace("#", "")
    .split(" ")
    .filter((p) => /^[A-Za-z]/.test(p))
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function SamplesPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [labSamples, setLabSamples] = useState([]);
  const [hospitalSamples, setHospitalSamples] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    Promise.all([
      listLabSamples(),
      listHospitalSamples(),
      listHospitalFamilies(),
    ]).then(([lab, hosp, fam]) => {
      if (!alive) return;
      setLabSamples(lab);
      setHospitalSamples(hosp);
      setFamilies(fam);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // One row per lab sample. Values typed on Add Sample come first, then the
  // hospital's record (joined by sample ID) fills whatever is still empty.
  const all = useMemo(() => {
    const byId = new Map(hospitalSamples.map((h) => [h.id, h]));
    return labSamples.map((s) => {
      const h = byId.get(s.id) || null;
      const hospitalName = lang === "ar" && s.hospitalAr ? s.hospitalAr : s.hospital;
      const hospName = h ? (lang === "ar" ? h.nameAr || h.name : h.name) : "";
      const hospWard = h ? (lang === "ar" ? h.wardAr || h.ward : h.ward) : "";
      return {
        id: s.id,
        hospital: hospitalName,
        type: s.type,
        status: s.status,
        flagged: s.flagged,
        date: shortDate(s),
        name: s.subject || hospName,
        ward: s.subject ? hospitalName : hospWard,
        caseId: s.caseId || (h ? h.caseId : ""),
        risk: s.risk || (h ? h.risk : ""),
      };
    });
  }, [labSamples, hospitalSamples, lang]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (s) =>
        (status === "all" || s.status === status) &&
        (risk === "all" || s.risk === risk) &&
        (type === "all" || s.type === type) &&
        (!q ||
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.hospital.toLowerCase().includes(q) ||
          s.caseId.toLowerCase().includes(q)),
    );
  }, [all, query, status, risk, type]);

  const summary = useMemo(
    () => [
      { key: "total", value: all.length, tone: "teal" },
      {
        key: "pending",
        value: all.filter(
          (s) => s.status === "received" || s.status === "sequencing",
        ).length,
        tone: "amber",
      },
      {
        key: "risk",
        value: all.filter((s) => s.risk === "high").length,
        tone: "red",
      },
      { key: "families", value: families.length, tone: "blue" },
    ],
    [all, families],
  );

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);
  const from = rows.length ? start + 1 : 0;
  const to = Math.min(start + PAGE_SIZE, rows.length);

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
        {summary.map((s) => (
          <article key={s.key} className="ad-card ad-stat">
            <div className="ad-stat-top">
              <span>{t(`sm.sum.${s.key}`)}</span>
              <i className={`sm-pip ${s.tone}`} />
            </div>
            <strong>{loading ? "…" : s.value}</strong>
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
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={t("sm.f.searchPh")}
            />
          </div>
        </label>

        <label className="sm-field">
          <span>{t("sm.f.status")}</span>
          <select
            className="sm-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t("sm.f.allStatus")}</option>
            <option value="received">{t("lab.st.received")}</option>
            <option value="sequencing">{t("lab.st.sequencing")}</option>
            <option value="done">{t("lab.st.done")}</option>
          </select>
        </label>

        <label className="sm-field">
          <span>{t("sm.f.risk")}</span>
          <select
            className="sm-select"
            value={risk}
            onChange={(e) => {
              setRisk(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
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
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="sm-empty">
                    {loading ? "…" : t("sm.empty")}
                  </td>
                </tr>
              )}
              {visible.map((s) => (
                <tr key={s.id}>
                  <td className="mono" dir="ltr">
                    {s.id}
                  </td>
                  <td>
                    <span className="ad-subject">
                      <b>{s.name ? initials(s.name) : "—"}</b>
                      <span className="sm-who">
                        {s.name || s.hospital}
                        <small>{s.name ? s.ward : s.hospital}</small>
                      </span>
                    </span>
                  </td>
                  <td className="muted">{t(`sm.type.${s.type}`)}</td>
                  <td className="muted" dir="ltr">
                    {s.date}
                  </td>
                  <td className="mono" dir="ltr">
                    {s.caseId || MISSING}
                  </td>
                  <td>
                    {s.risk ? (
                      <em className={`ad-status sm-risk ${s.risk}`}>
                        {t(`sm.risk.${s.risk}`)}
                      </em>
                    ) : (
                      <span className="muted">{t("af.risk.none")}</span>
                    )}
                  </td>
                  <td>
                    <em className={`ad-status ${s.status}`}>
                      {t(`lab.st.${s.status}`)}
                    </em>
                    {s.flagged && (
                      <em className="ad-status pending lab-c-small">
                        {" "}
                        {t("lab.flagged")}
                      </em>
                    )}
                  </td>
                  <td className="right">
                    <button
                      type="button"
                      className="ad-more"
                      aria-label={t("sm.view")}
                      title={t("sm.view")}
                      onClick={() =>
                        navigate(
                          `/admin/custody?sample=${encodeURIComponent(s.id)}`,
                        )
                      }
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
            {t("sm.showing")} {from}-{to} {t("sm.of")} {rows.length}{" "}
            {t("sm.specimens")}
          </small>
          <div className="sm-pager">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, current - 1))}
              disabled={current === 1}
              aria-label={t("sm.prev")}
            >
              <Icon name="chevron" size={16} />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={current === n ? "on" : ""}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(Math.min(pages, current + 1))}
              disabled={current === pages}
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
