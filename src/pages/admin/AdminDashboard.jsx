import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { listLabSamples } from "../../auth/lab";
import { listCases } from "../../auth/police";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "../lab/Lab.css";

// The admin dashboard reads the same demo data as the lab and the police:
//   - samples  -> listLabSamples (src/auth/lab.js)
//   - cases    -> listCases      (src/auth/police.js)
// Nothing here is typed in by hand, so every number matches the other pages.

// Case statuses that count as a match.
const MATCH_STATUSES = ["matched", "resolved"];

// Latest lab/case actions shown in Recent Activity.
const ACTIVITY_LIMIT = 4;

const shortDate = (iso) => (iso ? iso.slice(0, 10) : "");

// Which "week bucket" an ISO date falls in, counted back from the newest sample.
function buildTrend(samples) {
  if (!samples.length) return [];
  const DAY = 24 * 60 * 60 * 1000;
  const times = samples.map((s) => new Date(s.receivedAt).getTime());
  const newest = Math.max(...times);
  const buckets = [0, 0, 0, 0];
  times.forEach((tm) => {
    const weeksBack = Math.floor((newest - tm) / (7 * DAY));
    if (weeksBack >= 0 && weeksBack < 4) buckets[3 - weeksBack] += 1;
  });
  return buckets.map((value, i) => ({ week: i + 1, value }));
}

function TrendChart({ data }) {
  const { t } = useLanguage();
  const W = 560;
  const H = 220;
  const pad = { l: 36, r: 16, t: 16, b: 34 };
  const top = Math.max(4, ...data.map((d) => d.value));
  const max = Math.ceil(top / 4) * 4;
  const stepX = (W - pad.l - pad.r) / (data.length - 1 || 1);
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const points = data.map((d, i) => [pad.l + i * stepX, y(d.value)]);
  const line = points
    .map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1][0]},${H - pad.b} L${points[0][0]},${H - pad.b} Z`;
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];

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

      {ticks.map((v) => (
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
        <g key={data[i].week}>
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
            {data[i].value}
          </text>
          <text
            x={p[0]}
            y={H - 10}
            textAnchor="middle"
            fill="#a3adb5"
            fontSize="11"
          >
            {t("ad.week")} {String(data[i].week).padStart(2, "0")}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function AdminDashboard() {
  const { t, lang } = useLanguage();
  const [samples, setSamples] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([listLabSamples(), listCases()]).then(([s, c]) => {
      if (!alive) return;
      setSamples(s);
      setCases(c);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const hospitalName = (s) =>
    lang === "ar" && s.hospitalAr ? s.hospitalAr : s.hospital;

  const numbers = useMemo(() => {
    const total = samples.length;
    const done = samples.filter((s) => s.status === "done").length;
    const pending = samples.filter(
      (s) => s.status === "received" || s.status === "sequencing",
    ).length;
    const flagged = samples.filter((s) => s.flagged).length;
    const matches = cases.filter((c) =>
      MATCH_STATUSES.includes(c.status),
    ).length;
    const efficiency = total ? Math.round((done / total) * 100) : 0;
    return { total, done, pending, flagged, matches, efficiency };
  }, [samples, cases]);

  const trend = useMemo(() => buildTrend(samples), [samples]);

  // Latest actions across the lab (sample history) and the police (case log).
  const activity = useMemo(() => {
    const out = [];
    samples.forEach((s) => {
      out.push({
        key: `rec-${s.id}`,
        kind: "received",
        ref: s.id,
        at: s.receivedAt,
        tone: "blue",
      });
      s.history.forEach((h, i) => {
        out.push({
          key: `${s.id}-${h.type}-${h.at}-${i}`,
          kind: h.type,
          ref: s.id,
          at: h.at,
          tone: h.type === "flagged" ? "amber" : "teal",
        });
      });
    });
    cases.forEach((c) => {
      c.log.forEach((l, i) => {
        if (l.type !== "searched" && l.type !== "confirmed") return;
        out.push({
          key: `${c.id}-${l.type}-${l.at}-${i}`,
          kind: l.type === "confirmed" ? "caseConfirmed" : "caseSearched",
          ref: c.id,
          at: l.at,
          tone: l.type === "confirmed" ? "teal" : "blue",
        });
      });
    });
    return out
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, ACTIVITY_LIMIT);
  }, [samples, cases]);

  const recent = samples.slice(0, 4);

  const R = 52;
  const C = 2 * Math.PI * R;

  const STATS = [
    {
      key: "total",
      value: numbers.total,
      badge: `${numbers.done} ${t("ad.badge.done")}`,
      tone: "teal",
    },
    {
      key: "matches",
      value: numbers.matches,
      badge: "ad.badge.active",
      tone: "teal",
    },
    {
      key: "pending",
      value: numbers.pending,
      badge: "ad.badge.priority",
      tone: "amber",
    },
    {
      key: "error",
      value: numbers.flagged,
      badge: numbers.flagged ? "ad.badge.flagged" : "ad.badge.healthy",
      tone: numbers.flagged ? "amber" : "teal",
    },
  ];

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
            <strong>{loading ? "…" : s.value}</strong>
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
          </div>
          {trend.length ? (
            <TrendChart data={trend} />
          ) : (
            <p className="ps-hint">{t("ad.empty")}</p>
          )}
        </article>

        <article className="ad-card">
          <div className="ad-card-head">
            <h3>{t("ad.activity.title")}</h3>
          </div>
          {activity.length ? (
            <ul className="ad-activity">
              {activity.map((a) => (
                <li key={a.key}>
                  <span className={`ad-dot ${a.tone}`} />
                  <div>
                    <strong>{t(`ad.act.${a.kind}`)}</strong>
                    <small dir="ltr">{a.ref}</small>
                  </div>
                  <time dir="ltr">{shortDate(a.at)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ps-hint">{t("ad.empty")}</p>
          )}
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
              aria-label={`${t("ad.through.eff")} ${numbers.efficiency}%`}
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
                strokeDashoffset={C * (1 - numbers.efficiency / 100)}
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
                {numbers.efficiency}%
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
              <small>{t("ad.through.done")}</small>
              <strong>{numbers.done}</strong>
            </div>
            <div>
              <small>{t("ad.through.err")}</small>
              <strong>{numbers.flagged}</strong>
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

      {/* Latest samples table (no patient names: the lab works on samples) */}
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
                <th>{t("ad.col.hospital")}</th>
                <th>{t("ad.col.status")}</th>
                <th>{t("ad.col.date")}</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="sm-empty">
                    {loading ? "…" : t("ad.empty")}
                  </td>
                </tr>
              )}
              {recent.map((s) => (
                <tr key={s.id}>
                  <td className="mono" dir="ltr">
                    {s.id}
                  </td>
                  <td>{hospitalName(s)}</td>
                  <td>
                    <em className={`ad-status ${s.status}`}>
                      {t(`lab.st.${s.status}`)}
                    </em>
                  </td>
                  <td className="muted" dir="ltr">
                    {shortDate(s.receivedAt)}
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
