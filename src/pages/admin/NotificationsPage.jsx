import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { listLabSamples } from "../../auth/lab";
import { listCases } from "../../auth/police";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";
import "./NotificationsPage.css";

// Read / dismissed state of the admin's notifications (kept in this browser).
const STATE_KEY = "genotrack_admin_notif_state";

function readState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      read: Array.isArray(parsed?.read) ? parsed.read : [],
      dismissed: Array.isArray(parsed?.dismissed) ? parsed.dismissed : [],
    };
  } catch {
    return { read: [], dismissed: [] };
  }
}

function writeState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

const TABS = ["all", "matches", "system", "audit"];

// Which plural form the Arabic / English phrases use for a number.
function pluralForm(n) {
  if (n === 1) return "one";
  if (n === 2) return "two";
  if (n >= 3 && n <= 10) return "few";
  return "many";
}

// "just now", "N minutes ago", ... built from the timestamp.
function agoParts(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return { key: "nt.ago.now", n: 0 };
  if (mins < 60) return { key: "nt.ago.min", n: mins };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { key: "nt.ago.hour", n: hours };
  return { key: "nt.ago.day", n: Math.floor(hours / 24) };
}

// Builds the admin's notifications from the real demo data:
//  - police cases that have a match         -> Matches tab
//  - samples the lab flagged                -> System tab
//  - samples that are still waiting / done  -> System tab
//  - custody events of the lab samples      -> Audit Trail tab
function buildNotifications(samples, cases) {
  const out = [];

  cases.forEach((c) => {
    if (c.result && c.result.outcome === "match") {
      const last = c.log[c.log.length - 1];
      out.push({
        id: `match-${c.id}`,
        kind: "match",
        category: "matches",
        tone: "match",
        icon: "alert",
        at: last ? last.at : c.openedAt,
        caseId: c.id,
        sampleId: c.result.recordId || "",
        similarity: c.result.similarity,
        confirmed: Boolean(c.result.confirmedAt),
        actions: ["viewComparison", "markRead"],
      });
    }
  });

  samples.forEach((s) => {
    if (s.flagged) {
      out.push({
        id: `flag-${s.id}`,
        kind: "flag",
        category: "system",
        tone: "alert",
        icon: "flask",
        at: s.flagAt || s.receivedAt,
        sampleId: s.id,
        hospital: s.hospital,
        hospitalAr: s.hospitalAr,
        actions: ["auditLog", "markRead"],
      });
    }
    if (s.status === "done") {
      out.push({
        id: `done-${s.id}`,
        kind: "done",
        category: "system",
        tone: "system",
        icon: "check",
        at: s.receivedAt,
        sampleId: s.id,
        hospital: s.hospital,
        hospitalAr: s.hospitalAr,
        actions: ["fullReport", "markRead"],
      });
    }
    if (s.status === "received") {
      out.push({
        id: `new-${s.id}`,
        kind: "newSample",
        category: "system",
        tone: "system",
        icon: "dna",
        at: s.receivedAt,
        sampleId: s.id,
        hospital: s.hospital,
        hospitalAr: s.hospitalAr,
        actions: ["auditLog", "markRead"],
      });
    }
    // The last custody step of the sample (a lab action) -> Audit Trail.
    const step = (s.history || [])[0];
    if (step && step.type !== "flagged") {
      out.push({
        id: `audit-${s.id}-${step.at}`,
        kind: "custody",
        category: "audit",
        tone: "custody",
        icon: "chain",
        at: step.at,
        sampleId: s.id,
        step: step.type,
        by: step.staffId || "",
        actions: ["auditLog", "dismiss"],
      });
    }
  });

  return out.sort((a, b) => (a.at < b.at ? 1 : -1));
}

export default function NotificationsPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [limit, setLimit] = useState(6);

  useEffect(() => {
    let alive = true;
    Promise.all([listLabSamples(), listCases()]).then(([samples, cases]) => {
      if (!alive) return;
      const state = readState();
      setItems(
        buildNotifications(samples, cases)
          .filter((n) => !state.dismissed.includes(n.id))
          .map((n) => ({ ...n, unread: !state.read.includes(n.id) })),
      );
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: items.length,
      matches: items.filter((i) => i.category === "matches").length,
      system: items.filter((i) => i.category === "system").length,
      audit: items.filter((i) => i.category === "audit").length,
    }),
    [items],
  );

  const filtered = items.filter((i) => tab === "all" || i.category === tab);
  const visible = filtered.slice(0, limit);
  const unreadCount = items.filter((i) => i.unread).length;

  function markRead(id) {
    const state = readState();
    if (!state.read.includes(id)) state.read.push(id);
    writeState(state);
    setItems((list) =>
      list.map((i) => (i.id === id ? { ...i, unread: false } : i)),
    );
  }

  function markAll() {
    const state = readState();
    items.forEach((i) => {
      if (!state.read.includes(i.id)) state.read.push(i.id);
    });
    writeState(state);
    setItems((list) => list.map((i) => ({ ...i, unread: false })));
  }

  function dismiss(id) {
    const state = readState();
    if (!state.dismissed.includes(id)) state.dismissed.push(id);
    writeState(state);
    setItems((list) => list.filter((i) => i.id !== id));
  }

  function runAction(item, action) {
    if (action === "markRead") return markRead(item.id);
    if (action === "dismiss") return dismiss(item.id);
    markRead(item.id);
    if (action === "viewComparison") return navigate("/admin/comparison");
    if (action === "fullReport") return navigate("/admin/reports");
    if (action === "auditLog") {
      return navigate(`/admin/custody?sample=${item.sampleId}`);
    }
    return undefined;
  }

  function timeAgo(iso) {
    const { key, n } = agoParts(iso);
    if (key === "nt.ago.now") return t(key);
    return t(`${key}.${pluralForm(n)}`, { n });
  }

  // Wrap Latin IDs so they do not flip inside Arabic sentences.
  const iso = (v) => `\u2066${v}\u2069`;

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
            onClick={() => {
              setTab(k);
              setLimit(6);
            }}
          >
            {t(`nt.tab.${k}`)}
            <b dir="ltr">{counts[k]}</b>
          </button>
        ))}
      </div>

      {/* List */}
      <section className="nt-list">
        {loading && <p className="ps-hint">{t("nt.loading")}</p>}

        {!loading &&
          visible.map((n) => {
            const hospital =
              lang === "ar" && n.hospitalAr ? n.hospitalAr : n.hospital;
            return (
              <article
                key={n.id}
                className={`ad-card nt-item ${n.tone} ${n.unread ? "unread" : ""}`}
              >
                <span className="nt-ico">
                  <Icon name={n.icon} size={22} />
                </span>

                <div className="nt-body">
                  <header>
                    <h3>{t(`nt.${n.kind}.title`)}</h3>
                    <span className="nt-time">
                      <Icon name="clock" size={13} /> {timeAgo(n.at)}
                    </span>
                  </header>

                  {n.kind === "match" ? (
                    <dl className="nt-meta">
                      <div>
                        <dt>{t("nt.meta.caseId")}</dt>
                        <dd dir="ltr">{n.caseId}</dd>
                      </div>
                      <div>
                        <dt>{t("nt.meta.sampleId")}</dt>
                        <dd dir="ltr">{n.sampleId}</dd>
                      </div>
                      <div>
                        <dt>{t("nt.meta.confidence")}</dt>
                        <dd dir="ltr">{n.similarity}%</dd>
                      </div>
                    </dl>
                  ) : (
                    <p>
                      {t(`nt.${n.kind}.text`, {
                        sample: iso(n.sampleId),
                        hospital,
                        by: iso(n.by || ""),
                        step: n.step ? t(`nt.step.${n.step}`) : "",
                      })}
                    </p>
                  )}

                  <div className="nt-actions">
                    {n.actions
                      .filter((a) => a !== "markRead" || n.unread)
                      .map((a, i) => (
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
            );
          })}

        {!loading && filtered.length === 0 && (
          <div className="ad-card nt-clear">
            <span className="nt-ico">
              <Icon name="shield" size={26} />
            </span>
            <h3>{t("nt.clear.title")}</h3>
            <p>{t("nt.clear.text")}</p>
          </div>
        )}
      </section>

      {!loading && filtered.length > limit && (
        <button
          type="button"
          className="nt-older"
          onClick={() => setLimit((l) => l + 6)}
        >
          {t("nt.older")} <Icon name="chevronDown" size={16} />
        </button>
      )}
    </DashboardLayout>
  );
}
