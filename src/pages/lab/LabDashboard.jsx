import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { CURRENT_LAB, listLabSamples } from "../../auth/lab";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "./Lab.css";

// Lab dashboard: counts and the queue of samples that still need work.
// A lab technician sees samples only, never a patient name.
export default function LabDashboard() {
  const { t, lang } = useLanguage();
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    listLabSamples().then((list) => {
      if (!alive) return;
      setSamples(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const summary = useMemo(
    () => [
      {
        key: "received",
        value: samples.filter((s) => s.status === "received").length,
        tone: "amber",
      },
      {
        key: "sequencing",
        value: samples.filter((s) => s.status === "sequencing").length,
        tone: "blue",
      },
      {
        key: "done",
        value: samples.filter((s) => s.status === "done").length,
        tone: "teal",
      },
      {
        key: "flagged",
        value: samples.filter((s) => s.flagged).length,
        tone: "red",
      },
    ],
    [samples],
  );

  // Queue: urgent first, then oldest first. Finished samples are not in it.
  const queue = useMemo(
    () =>
      samples
        .filter((s) => s.status !== "done")
        .sort((a, b) => {
          if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
          return a.receivedAt < b.receivedAt ? -1 : 1;
        })
        .slice(0, 6),
    [samples],
  );

  const hospitalName = (s) =>
    lang === "ar" && s.hospitalAr ? s.hospitalAr : s.hospital;
  const labName = lang === "ar" ? CURRENT_LAB.nameAr : CURRENT_LAB.name;
  const dateOf = (iso) => iso.slice(0, 10);

  return (
    <DashboardLayout role="lab_technician">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("lab.tag")}</span>
          <h1>
            {t("lab.title1")} <span>{t("lab.title2")}</span>
          </h1>
          <p>{t("lab.subtitle", { lab: labName })}</p>
        </div>
        <Link to="/lab/samples" className="sm-add">
          <Icon name="dna" size={18} /> {t("lab.openSamples")}
        </Link>
      </section>

      {/* Summary */}
      <section className="ad-stats">
        {summary.map((s) => (
          <article key={s.key} className="ad-card ad-stat">
            <div className="ad-stat-top">
              <span>{t(`lab.sum.${s.key}`)}</span>
              <i className={`sm-pip ${s.tone}`} />
            </div>
            <strong>{s.value.toLocaleString("en-US")}</strong>
          </article>
        ))}
      </section>

      {/* Queue */}
      <section className="ad-card sm-table-card">
        <div className="lab-card-head">
          <h3>{t("lab.queue")}</h3>
          <small>{t("lab.queueText")}</small>
        </div>

        <div className="ad-table-wrap lab-table-wrap">
          <table className="ad-table sm-table">
            <thead>
              <tr>
                <th>{t("lab.col.sample")}</th>
                <th>{t("lab.col.type")}</th>
                <th>{t("lab.col.hospital")}</th>
                <th>{t("lab.col.received")}</th>
                <th>{t("lab.col.priority")}</th>
                <th>{t("lab.col.status")}</th>
              </tr>
            </thead>
            <tbody>
              {!loading && queue.length === 0 && (
                <tr>
                  <td colSpan={6} className="sm-empty">
                    {t("lab.queueEmpty")}
                  </td>
                </tr>
              )}
              {queue.map((s) => (
                <tr key={s.id}>
                  <td className="mono" dir="ltr">
                    {s.id}
                    {s.flagged && (
                      <em className="lab-flag-dot" title={t("lab.flagged")} />
                    )}
                  </td>
                  <td className="muted">{t(`sm.type.${s.type}`)}</td>
                  <td className="muted">{hospitalName(s)}</td>
                  <td className="muted" dir="ltr">
                    {dateOf(s.receivedAt)}
                  </td>
                  <td>
                    <em className={`ad-status lab-prio ${s.priority}`}>
                      {t(`lab.prio.${s.priority}`)}
                    </em>
                  </td>
                  <td>
                    <em className={`ad-status lab-st ${s.status}`}>
                      {t(`lab.st.${s.status}`)}
                    </em>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}
