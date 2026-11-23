import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { CURRENT_STATION, listCases } from "../../auth/police";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "./Police.css";

// Police dashboard: counts, matches waiting for the officer, recent cases.
// Police see a match / no match and the hospital name, never a medical record.
export default function PoliceDashboard() {
  const { t, lang } = useLanguage();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const isOpen = (c) => c.status !== "resolved" && c.status !== "closed";

  const summary = useMemo(
    () => [
      {
        key: "active",
        value: cases.filter(isOpen).length,
        tone: "teal",
      },
      {
        key: "matches",
        value: cases.filter((c) => c.status === "matched").length,
        tone: "red",
      },
      {
        key: "awaiting",
        value: cases.filter((c) => c.status === "sampleRequested").length,
        tone: "amber",
      },
      {
        key: "resolved",
        value: cases.filter((c) => c.status === "resolved").length,
        tone: "blue",
      },
    ],
    [cases],
  );

  // Matches the officer still has to confirm.
  const matches = useMemo(
    () => cases.filter((c) => c.status === "matched").slice(0, 3),
    [cases],
  );

  // Urgent first, then newest. Finished cases are not in the list.
  const recent = useMemo(
    () =>
      cases
        .filter(isOpen)
        .sort((a, b) => {
          if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
          return a.openedAt < b.openedAt ? 1 : -1;
        })
        .slice(0, 6),
    [cases],
  );

  const stationName =
    lang === "ar" ? CURRENT_STATION.nameAr : CURRENT_STATION.name;
  const childLabel = (c) => c.childName || t("pol.unknownChild");

  return (
    <DashboardLayout role="police_investigator">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("pol.tag")}</span>
          <h1>
            {t("pol.title1")} <span>{t("pol.title2")}</span>
          </h1>
          <p>{t("pol.subtitle", { station: stationName })}</p>
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
              <span>{t(`pol.sum.${s.key}`)}</span>
              <i className={`sm-pip ${s.tone}`} />
            </div>
            <strong>{s.value.toLocaleString("en-US")}</strong>
          </article>
        ))}
      </section>

      {/* Matches waiting for confirmation */}
      {matches.length > 0 && (
        <section className="pol-matches">
          {matches.map((c) => (
            <article key={c.id} className="ad-card pol-match">
              <span className="pol-match-ico">
                <Icon name="alert" size={22} />
              </span>
              <div>
                <b>{t("pol.matchFound")}</b>
                <small>
                  <span dir="ltr">{c.id}</span> · {childLabel(c)} ·{" "}
                  <span dir="ltr">{c.result.similarity}%</span>
                </small>
              </div>
              <Link to={`/police/cases/${c.id}`} className="pol-link">
                {t("pol.review")}
              </Link>
            </article>
          ))}
        </section>
      )}

      {/* Recent cases */}
      <section className="ad-card sm-table-card">
        <div className="lab-card-head">
          <h3>{t("pol.recent")}</h3>
          <Link to="/police/cases" className="pol-link">
            {t("pol.viewAll")}
          </Link>
        </div>

        <div className="ad-table-wrap lab-table-wrap">
          <table className="ad-table sm-table">
            <thead>
              <tr>
                <th>{t("pol.col.case")}</th>
                <th>{t("pol.col.type")}</th>
                <th>{t("pol.col.child")}</th>
                <th>{t("pol.col.opened")}</th>
                <th>{t("pol.col.priority")}</th>
                <th>{t("pol.col.status")}</th>
              </tr>
            </thead>
            <tbody>
              {!loading && recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="sm-empty">
                    {t("pol.recentEmpty")}
                  </td>
                </tr>
              )}
              {recent.map((c) => (
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
      </section>
    </DashboardLayout>
  );
}
