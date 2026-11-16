import { Link } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/LanguageContext";
import "./AdminDashboard.css";

// ---- Demo data: replace with API calls later ----
const STATS = [
  { key: "total", value: "2,450", badge: "+12%", tone: "teal" },
  { key: "matches", value: "185", badge: "ad.badge.active", tone: "teal" },
  { key: "pending", value: "42", badge: "ad.badge.priority", tone: "amber" },
  { key: "error", value: "0.02%", badge: "ad.badge.healthy", tone: "teal" },
];

const ACTIVITY = [
  { n: 1, tone: "teal" },
  { n: 2, tone: "blue" },
  { n: 3, tone: "teal" },
  { n: 4, tone: "amber" },
];

const TREND = [
  { week: 1, value: 12 },
  { week: 2, value: 18 },
  { week: 3, value: 15 },
  { week: 4, value: 24 },
];

const CASES = [
  {
    id: "GT-99210-AX",
    name: "Jonathan Doe",
    status: "matched",
    date: "Oct 24, 2023",
  },
  {
    id: "GT-99211-BR",
    name: "Sarah Weaver",
    status: "analyzed",
    date: "Oct 23, 2023",
  },
  {
    id: "GT-99215-CX",
    name: "Marcus Kane",
    status: "pending",
    date: "Oct 23, 2023",
  },
  {
    id: "GT-99218-DY",
    name: "Elena Luvic",
    status: "matched",
    date: "Oct 22, 2023",
  },
];

const initials = (name) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function TrendChart() {
  const { t } = useLanguage();
  const W = 560;
  const H = 220;
  const pad = { l: 36, r: 16, t: 16, b: 34 };
  const max = 30;
  const stepX = (W - pad.l - pad.r) / (TREND.length - 1);
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const points = TREND.map((d, i) => [pad.l + i * stepX, y(d.value)]);
  const line = points
    .map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1][0]},${H - pad.b} L${points[0][0]},${H - pad.b} Z`;

  return (
    <svg
      className="ad-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={t("ad.trend.title")}
      direction="ltr"
    >
      <defs>
        <linearGradient id="adArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>
        <filter id="adGlow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {[0, 10, 20, 30].map((v) => (
        <g key={v}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(v)}
            y2={y(v)}
            stroke="rgba(255,255,255,0.08)"
          />
          <text
            x={pad.l - 10}
            y={y(v) + 4}
            textAnchor="end"
            fill="#6b7780"
            fontSize="11"
          >
            {v}
          </text>
        </g>
      ))}

      <path d={area} fill="url(#adArea)" />
      <path
        d={line}
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#adGlow)"
      />

      {points.map((p, i) => (
        <g key={TREND[i].week}>
          <circle
            cx={p[0]}
            cy={p[1]}
            r="6"
            fill="#05080a"
            stroke="#2dd4bf"
            strokeWidth="2.5"
          />
          <text
            x={p[0]}
            y={p[1] - 14}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontWeight="700"
          >
            {TREND[i].value}
          </text>
          <text
            x={p[0]}
            y={H - 10}
            textAnchor="middle"
            fill="#a3adb5"
            fontSize="11"
          >
            {t("ad.week")} {String(TREND[i].week).padStart(2, "0")}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function AdminDashboard() {
  const { t, isRtl } = useLanguage();
  const efficiency = 82;
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("ad.tag")}</span>
          <h1>
            {t("ad.title1")} <span>{t("ad.title2")}</span>
          </h1>
          <p>{t("ad.subtitle")}</p>
        </div>
        <span className="ad-monitor">
          <i /> {t("ad.live")}
        </span>
      </section>

      {/* Stats */}
      <section className="ad-stats">
        {STATS.map((s) => (
          <article key={s.key} className="ad-card ad-stat">
            <div className="ad-stat-top">
              <span>{t(`ad.stat.${s.key}`)}</span>
              <em className={`ad-badge ${s.tone}`}>
                {s.badge.startsWith("ad.") ? t(s.badge) : s.badge}
              </em>
            </div>
            <strong>{s.value}</strong>
            <small>{t(`ad.stat.${s.key}.sub`)}</small>
          </article>
        ))}
      </section>

      {/* Chart + Activity */}
      <section className="ad-grid-2">
        <article className="ad-card">
          <div className="ad-card-head">
            <div>
              <h3>{t("ad.trend.title")}</h3>
              <small>{t("ad.trend.sub")}</small>
            </div>
            <div className="ad-tabs" role="tablist">
              <button type="button" className="on">
                {t("ad.trend.30d")}
              </button>
              <button type="button">{t("ad.trend.6m")}</button>
            </div>
          </div>
          <TrendChart />
        </article>

        <article className="ad-card">
          <div className="ad-card-head">
            <h3>{t("ad.activity.title")}</h3>
          </div>
          <ul className="ad-activity">
            {ACTIVITY.map((a) => (
              <li key={a.n}>
                <span className={`ad-dot ${a.tone}`} />
                <div>
                  <strong>{t(`ad.act${a.n}.title`)}</strong>
                  <small>{t(`ad.act${a.n}.meta`)}</small>
                </div>
                <time>{t(`ad.act${a.n}.time`)}</time>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {/* Throughput + Security */}
      <section className="ad-grid-3">
        <article className="ad-card ad-throughput">
          <div className="ad-card-head">
            <h3>{t("ad.through.title")}</h3>
          </div>
          <div className="ad-ring-wrap">
            <svg
              viewBox="0 0 140 140"
              className="ad-ring"
              aria-label={`${t("ad.through.eff")} ${efficiency}%`}
            >
              <circle
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="12"
              />
              <circle
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - efficiency / 100)}
                transform="rotate(-90 70 70)"
              />
              <text
                x="70"
                y="68"
                textAnchor="middle"
                fill="#fff"
                fontSize="26"
                fontWeight="800"
              >
                {efficiency}%
              </text>
              <text
                x="70"
                y="88"
                textAnchor="middle"
                fill="#a3adb5"
                fontSize="11"
              >
                {t("ad.through.eff")}
              </text>
            </svg>
            <p>{t("ad.through.sub")}</p>
          </div>
          <div className="ad-mini">
            <div>
              <small>{t("ad.through.avg")}</small>
              <strong>{isRtl ? "4.2 س" : "4.2h"}</strong>
            </div>
            <div>
              <small>{t("ad.through.err")}</small>
              <strong>0.02%</strong>
            </div>
          </div>
        </article>

        <article className="ad-card ad-info">
          <span className="ad-info-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3zM9 12l2 2 4-4" />
            </svg>
          </span>
          <h3>{t("ad.sec.title")}</h3>
          <p>{t("ad.sec.text")}</p>
        </article>

        <article className="ad-card ad-info">
          <span className="ad-info-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
            </svg>
          </span>
          <h3>{t("ad.db.title")}</h3>
          <p>{t("ad.db.text")}</p>
        </article>
      </section>

      {/* Cases table */}
      <section className="ad-card ad-cases">
        <div className="ad-card-head">
          <h3>{t("ad.cases.title")}</h3>
          <Link to="/admin/samples" className="ad-link">
            {t("ad.cases.all")}
          </Link>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{t("ad.col.id")}</th>
                <th>{t("ad.col.subject")}</th>
                <th>{t("ad.col.status")}</th>
                <th>{t("ad.col.date")}</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {CASES.map((c) => (
                <tr key={c.id}>
                  <td className="mono" dir="ltr">
                    {c.id}
                  </td>
                  <td>
                    <span className="ad-subject">
                      <b>{initials(c.name)}</b>
                      {c.name}
                    </span>
                  </td>
                  <td>
                    <em className={`ad-status ${c.status}`}>
                      {t(`ad.status.${c.status}`)}
                    </em>
                  </td>
                  <td className="muted">{c.date}</td>
                  <td className="right">
                    <button
                      type="button"
                      className="ad-more"
                      aria-label="More actions"
                    >
                      ⋯
                    </button>
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
