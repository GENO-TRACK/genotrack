import { Link } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";

// ---- Demo data: replace with API calls later ----
const STATS = [
  { key: "registered", value: "128", tone: "teal" },
  { key: "pending", value: "24", tone: "amber" },
  { key: "flags", value: "6", tone: "red" },
  { key: "access", value: "41", tone: "blue" },
];

const RECENT = [
  {
    id: "GT-99281-X",
    name: "Baby Doe #99281",
    ward: "NICU · Bed 12-A",
    status: "matched",
    risk: "high",
  },
  {
    id: "GT-48210-L",
    name: "Sarah Jenkins",
    ward: "Post-Op Recovery",
    status: "pending",
    risk: "low",
  },
  {
    id: "GT-00129-Z",
    name: "Baby Roe #00129",
    ward: "NICU · Bed 04-B",
    status: "analyzed",
    risk: "medium",
  },
];

const initials = (name) =>
  name
    .replace("#", "")
    .split(" ")
    .filter((p) => /^[A-Za-z]/.test(p))
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function HospitalDashboard() {
  const { t } = useLanguage();

  return (
    <DashboardLayout role="hospital_staff">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("hd.tag")}</span>
          <h1>
            {t("hd.title1")} <span>{t("hd.title2")}</span>
          </h1>
          <p>{t("hd.subtitle")}</p>
        </div>
        <Link to="/hospital/newborn" className="sm-add">
          <Icon name="baby" size={18} /> {t("hd.newborn")}
        </Link>
      </section>

      {/* Summary */}
      <section className="ad-stats">
        {STATS.map((s) => (
          <article key={s.key} className="ad-card ad-stat">
            <div className="ad-stat-top">
              <span>{t(`hd.stat.${s.key}`)}</span>
              <i className={`sm-pip ${s.tone}`} />
            </div>
            <strong>{s.value}</strong>
          </article>
        ))}
      </section>

      {/* Recent cases */}
      <section className="ad-card sm-table-card">
        <div className="ad-card-head">
          <div>
            <h3>{t("hd.recent")}</h3>
            <small>{t("hd.recentSub")}</small>
          </div>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{t("sm.col.id")}</th>
                <th>{t("sm.col.patient")}</th>
                <th>{t("sm.col.risk")}</th>
                <th>{t("sm.col.status")}</th>
              </tr>
            </thead>
            <tbody>
              {RECENT.map((s) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}
