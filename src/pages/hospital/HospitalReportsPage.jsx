import { useEffect, useMemo, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { getUser } from "../../auth/session";
import {
  CURRENT_HOSPITAL,
  listHospitalReports,
  releaseReport,
} from "../../auth/grants";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "./HospitalReports.css";

const FILTERS = ["all", "draft", "released"];

export default function HospitalReportsPage() {
  const { t, lang } = useLanguage();
  const user = getUser();
  const canRelease = user?.hospitalRole === "geneticist";

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const [confirmId, setConfirmId] = useState("");

  // Only this hospital's reports are loaded.
  useEffect(() => {
    let alive = true;
    listHospitalReports(CURRENT_HOSPITAL.id).then((list) => {
      if (!alive) return;
      setReports(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: reports.length,
      draft: reports.filter((r) => !r.released).length,
      released: reports.filter((r) => r.released).length,
    }),
    [reports],
  );

  const visible = reports.filter((r) =>
    filter === "all" ? true : filter === "released" ? r.released : !r.released,
  );

  async function handleRelease(report) {
    setBusy(report.reportId);
    try {
      const entry = await releaseReport({
        reportId: report.reportId,
        staffId: user?.nationalId,
      });
      setReports((list) =>
        list.map((r) =>
          r.reportId === report.reportId
            ? { ...r, released: true, releasedAt: entry.at, releasedBy: entry.by }
            : r,
        ),
      );
    } finally {
      setBusy("");
      setConfirmId("");
    }
  }

  const when = (iso) =>
    new Date(iso).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <DashboardLayout role="hospital_staff">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("hrp.tag")}</span>
          <h1>
            {t("hrp.title1")} <span>{t("hrp.title2")}</span>
          </h1>
          <p>{t("hrp.subtitle", { hospital: CURRENT_HOSPITAL.name })}</p>
        </div>
      </section>

      {/* Summary */}
      <section className="ad-stats">
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("hrp.total")}</span>
          </div>
          <strong>{counts.all}</strong>
        </article>
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("hrp.draft")}</span>
          </div>
          <strong>{counts.draft}</strong>
        </article>
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("hrp.released")}</span>
          </div>
          <strong>{counts.released}</strong>
        </article>
      </section>

      {!canRelease && (
        <p className="hrp-note">
          <Icon name="lock" size={16} /> {t("hrp.viewOnly")}
        </p>
      )}

      {/* Filter tabs */}
      <div className="hrp-tabs" role="tablist">
        {FILTERS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={filter === k}
            className={filter === k ? "active" : ""}
            onClick={() => setFilter(k)}
          >
            {t(`hrp.filter.${k}`)}
            <b dir="ltr">{counts[k]}</b>
          </button>
        ))}
      </div>

      {/* Reports */}
      <section className="hrp-list">
        {loading && <p className="ps-hint">{t("hrp.loading")}</p>}

        {!loading && visible.length === 0 && (
          <div className="ad-card hrp-empty">
            <h3>{t("hrp.empty.title")}</h3>
            <p>{t("hrp.empty.text")}</p>
          </div>
        )}

        {visible.map((r) => (
          <article key={r.reportId} className="ad-card hrp-item">
            <div className="hrp-main">
              <header>
                <h3>{lang === "ar" ? r.patientNameAr : r.patientName}</h3>
                <em className={`hrp-badge ${r.released ? "released" : "draft"}`}>
                  {r.released ? t("hrp.badge.released") : t("hrp.badge.draft")}
                </em>
              </header>

              <dl className="hrp-meta">
                <div>
                  <dt>{t("hrp.col.report")}</dt>
                  <dd dir="ltr">{r.reportId}</dd>
                </div>
                <div>
                  <dt>{t("hrp.col.sample")}</dt>
                  <dd dir="ltr">{r.sampleId}</dd>
                </div>
                <div>
                  <dt>{t("hrp.col.finding")}</dt>
                  <dd>{lang === "ar" ? r.findingAr : r.finding}</dd>
                </div>
                <div>
                  <dt>{t("hrp.col.risk")}</dt>
                  <dd className={`hrp-risk ${r.level}`}>
                    <span dir="ltr">{r.score}/10</span> ·{" "}
                    {t(`sm.risk.${r.level}`)}
                  </dd>
                </div>
                <div>
                  <dt>{t("hrp.col.date")}</dt>
                  <dd dir="ltr">{r.date}</dd>
                </div>
              </dl>

              {r.released && (
                <p className="hrp-releasedline">
                  <Icon name="check" size={14} />{" "}
                  {t("hrp.releasedLine", {
                    when: when(r.releasedAt),
                    by: `\u2066${r.releasedBy}\u2069`,
                  })}
                </p>
              )}
            </div>

            <div className="hrp-actions">
              {!r.released && canRelease && confirmId !== r.reportId && (
                <button
                  type="button"
                  className="sm-add"
                  onClick={() => setConfirmId(r.reportId)}
                >
                  <Icon name="share" size={16} /> {t("hrp.release")}
                </button>
              )}

              {!r.released && canRelease && confirmId === r.reportId && (
                <div className="hrp-confirm">
                  <p>{t("hrp.confirmText")}</p>
                  <div>
                    <button
                      type="button"
                      className="sm-add"
                      disabled={busy === r.reportId}
                      onClick={() => handleRelease(r)}
                    >
                      {busy === r.reportId
                        ? t("hrp.releasing")
                        : t("hrp.confirmYes")}
                    </button>
                    <button
                      type="button"
                      className="ps-ghost"
                      disabled={busy === r.reportId}
                      onClick={() => setConfirmId("")}
                    >
                      {t("hrp.cancel")}
                    </button>
                  </div>
                </div>
              )}

              {!r.released && !canRelease && (
                <span className="hrp-wait">
                  <Icon name="clock" size={14} /> {t("hrp.waiting")}
                </span>
              )}
            </div>
          </article>
        ))}
      </section>
    </DashboardLayout>
  );
}
