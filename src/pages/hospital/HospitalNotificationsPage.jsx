import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { getUser } from "../../auth/session";
import {
  CURRENT_HOSPITAL,
  dismissNotification,
  listHospitalNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../auth/grants";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "../admin/ComparisonPage.css";
import "../admin/NotificationsPage.css";
import "./HospitalNotifications.css";

// Tab -> which notification kinds it shows.
const TABS = {
  all: null,
  alerts: ["labFlag", "emergency"],
  reports: ["reportWaiting", "reportReleased"],
  activity: ["otpOpen", "newborn"],
};
const TAB_KEYS = Object.keys(TABS);

// "just now", "N minutes ago", ... built from the timestamp, with the
// same per-number Arabic phrases used on the admin notifications page.
function agoKey(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return { key: "hn.ago.now", n: 0 };
  if (mins < 60) return { key: "hn.ago.min", n: mins };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { key: "hn.ago.hour", n: hours };
  return { key: "hn.ago.day", n: Math.floor(hours / 24) };
}

function pluralForm(n) {
  if (n === 1) return "one";
  if (n === 2) return "two";
  if (n >= 3 && n <= 10) return "few";
  return "many";
}

export default function HospitalNotificationsPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const user = getUser();
  const userId = user?.nationalId || "unknown";
  const hospitalRole = user?.hospitalRole || "staff";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  // Only this hospital's notifications are built.
  useEffect(() => {
    let alive = true;
    listHospitalNotifications({
      hospitalId: CURRENT_HOSPITAL.id,
      userId,
      hospitalRole,
    }).then((list) => {
      if (!alive) return;
      setItems(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [userId, hospitalRole]);

  const counts = useMemo(() => {
    const result = {};
    TAB_KEYS.forEach((k) => {
      result[k] = TABS[k]
        ? items.filter((i) => TABS[k].includes(i.kind)).length
        : items.length;
    });
    return result;
  }, [items]);

  const visible = items.filter(
    (i) => !TABS[tab] || TABS[tab].includes(i.kind),
  );
  const unreadCount = items.filter((i) => i.unread).length;

  function markRead(id) {
    markNotificationRead(userId, id);
    setItems((list) =>
      list.map((i) => (i.id === id ? { ...i, unread: false } : i)),
    );
  }

  function markAll() {
    markAllNotificationsRead(
      userId,
      items.map((i) => i.id),
    );
    setItems((list) => list.map((i) => ({ ...i, unread: false })));
  }

  function dismiss(id) {
    dismissNotification(userId, id);
    setItems((list) => list.filter((i) => i.id !== id));
  }

  function open(item) {
    markRead(item.id);
    navigate(item.link);
  }

  function timeAgo(iso) {
    const { key, n } = agoKey(iso);
    if (key === "hn.ago.now") return t(key);
    return t(`${key}.${pluralForm(n)}`, { n });
  }

  // Wrap Latin IDs so they do not flip inside Arabic sentences.
  const iso = (v) => `\u2066${v}\u2069`;

  return (
    <DashboardLayout role="hospital_staff">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("hn.tag")}</span>
          <h1>
            {t("hn.title1")} <span>{t("hn.title2")}</span>
          </h1>
          <p>{t("hn.subtitle", { hospital: CURRENT_HOSPITAL.name })}</p>
        </div>
        <div className="nt-head-actions">
          <button
            type="button"
            className="sf-btn"
            onClick={markAll}
            disabled={unreadCount === 0}
          >
            <Icon name="check" size={16} />
            &nbsp;{t("hn.markAll")}
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="nt-tabs" role="tablist">
        {TAB_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={tab === k ? "active" : ""}
            onClick={() => setTab(k)}
          >
            {t(`hn.tab.${k}`)}
            <b dir="ltr">{counts[k]}</b>
          </button>
        ))}
      </div>

      {/* List */}
      <section className="nt-list">
        {loading && <p className="ps-hint">{t("hn.loading")}</p>}

        {!loading &&
          visible.map((n) => {
            const name = lang === "ar" ? n.subjectAr : n.subject;
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
                    <h3>{t(`hn.${n.kind}.title`)}</h3>
                    <span className="nt-time">
                      <Icon name="clock" size={13} /> {timeAgo(n.at)}
                    </span>
                  </header>

                  <p>
                    {t(`hn.${n.kind}.text`, {
                      subject: iso(name),
                      ref: iso(n.ref),
                      by: iso(n.by || ""),
                    })}
                  </p>

                  {n.reason && (
                    <p className="hn-reason">
                      <Icon name="alert" size={14} />{" "}
                      {t("hn.reasonLabel")}: {n.reason}
                    </p>
                  )}

                  <div className="nt-actions">
                    <button
                      type="button"
                      className="primary"
                      onClick={() => open(n)}
                    >
                      {t(`hn.${n.kind}.action`)}
                    </button>
                    {n.unread && (
                      <button type="button" onClick={() => markRead(n.id)}>
                        {t("hn.markRead")}
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="nt-close"
                  aria-label={t("hn.dismiss")}
                  onClick={() => dismiss(n.id)}
                >
                  <Icon name="close" size={16} />
                </button>
              </article>
            );
          })}

        {!loading && visible.length === 0 && (
          <div className="ad-card nt-clear">
            <span className="nt-ico">
              <Icon name="shield" size={26} />
            </span>
            <h3>{t("hn.clear.title")}</h3>
            <p>{t("hn.clear.text")}</p>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
