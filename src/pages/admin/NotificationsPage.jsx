import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/LanguageContext";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";
import "./NotificationsPage.css";

// ---- Demo data: replace with API calls later ----
const INITIAL = [
  {
    id: "n1",
    category: "matches",
    tone: "match",
    icon: "alert",
    time: { n: 2, unit: "min" },
    unread: true,
    meta: [
      { k: "caseId", v: "#FR-901-2024" },
      { k: "sampleId", v: "GTX-77291-B" },
      { k: "confidence", v: "99.98%" },
    ],
    actions: ["viewComparison", "markRead"],
  },
  {
    id: "n2",
    category: "audit",
    tone: "custody",
    icon: "chain",
    time: { n: 45, unit: "min" },
    unread: true,
    sample: "GTX-77291-B",
    signer: "Dr. Elias Vance",
    actions: ["auditLog", "dismiss"],
  },
  {
    id: "n3",
    category: "system",
    tone: "system",
    icon: "info",
    time: { n: 3, unit: "hour" },
    unread: false,
    records: "1.4M",
    actions: ["fullReport", "markRead"],
  },
];

const TABS = ["all", "matches", "system", "audit"];

export default function NotificationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState(INITIAL);
  const [tab, setTab] = useState("all");

  const counts = useMemo(
    () => ({
      all: items.length,
      matches: items.filter((i) => i.category === "matches").length,
      system: items.filter((i) => i.category === "system").length,
      audit: items.filter((i) => i.category === "audit").length,
    }),
    [items],
  );

  const visible = items.filter((i) => tab === "all" || i.category === tab);
  const unreadCount = items.filter((i) => i.unread).length;

  function markRead(id) {
    setItems((list) =>
      list.map((i) => (i.id === id ? { ...i, unread: false } : i)),
    );
  }

  function markAll() {
    setItems((list) => list.map((i) => ({ ...i, unread: false })));
  }

  function dismiss(id) {
    setItems((list) => list.filter((i) => i.id !== id));
  }

  function runAction(item, action) {
    if (action === "markRead") return markRead(item.id);
    if (action === "dismiss") return dismiss(item.id);
    if (action === "viewComparison") {
      markRead(item.id);
      return navigate("/admin/comparison");
    }
    if (action === "auditLog") {
      markRead(item.id);
      return navigate("/admin/custody");
    }
    return markRead(item.id);
  }

  function timeAgo({ n, unit }) {
    if (n === 1) return t(`nt.ago.${unit}.one`);
    if (n === 2) return t(`nt.ago.${unit}.two`);
    if (n >= 3 && n <= 10) return t(`nt.ago.${unit}.few`, { n });
    return t(`nt.ago.${unit}.many`, { n });
  }
  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("nt.tag")}</span>
          <h1>
            {t("nt.title1")} <span>{t("nt.title2")}</span>
          </h1>
          <p>{t("nt.subtitle")}</p>
        </div>
        <div className="nt-head-actions">
          <button
            type="button"
            className="sf-btn"
            onClick={markAll}
            disabled={unreadCount === 0}
          >
            <Icon name="doubleCheck" size={16} />
            &nbsp;{t("nt.markAll")}
          </button>
          <button
            type="button"
            className="sf-btn"
            onClick={() => navigate("/admin/settings")}
          >
            <Icon name="filter" size={16} />
            &nbsp;{t("nt.preferences")}
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="nt-tabs" role="tablist">
        {TABS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={tab === k ? "active" : ""}
            onClick={() => setTab(k)}
          >
            {t(`nt.tab.${k}`)}
            {k !== "audit" && (
              <b dir="ltr">{k === "all" ? counts.all : counts[k]}</b>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <section className="nt-list">
        {visible.map((n) => (
          <article
            key={n.id}
            className={`ad-card nt-item ${n.tone} ${n.unread ? "unread" : ""}`}
          >
            <span className="nt-ico">
              <Icon name={n.icon} size={22} />
            </span>

            <div className="nt-body">
              <header>
                <h3>{t(`nt.${n.id}.title`)}</h3>
                <span className="nt-time">
                  <Icon name="clock" size={13} /> {timeAgo(n.time)}
                </span>
              </header>

              {n.meta ? (
                <dl className="nt-meta">
                  {n.meta.map((m) => (
                    <div key={m.k}>
                      <dt>{t(`nt.meta.${m.k}`)}</dt>
                      <dd dir="ltr">{m.v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p>
                  {t(`nt.${n.id}.text`, {
                    sample: n.sample,
                    signer: n.signer,
                    records: n.records,
                  })}
                </p>
              )}

              <div className="nt-actions">
                {n.actions.map((a, i) => (
                  <button
                    key={a}
                    type="button"
                    className={i === 0 ? "primary" : ""}
                    onClick={() => runAction(n, a)}
                  >
                    {t(`nt.act.${a}`)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="nt-close"
              aria-label={t("nt.act.dismiss")}
              onClick={() => dismiss(n.id)}
            >
              <Icon name="close" size={16} />
            </button>
          </article>
        ))}

        {visible.length === 0 && (
          <div className="ad-card nt-clear">
            <span className="nt-ico">
              <Icon name="shield" size={26} />
            </span>
            <h3>{t("nt.clear.title")}</h3>
            <p>{t("nt.clear.text")}</p>
          </div>
        )}
      </section>

      <button type="button" className="nt-older">
        {t("nt.older")} <Icon name="chevronDown" size={16} />
      </button>
    </DashboardLayout>
  );
}
