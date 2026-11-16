import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import DnaHelix from "../DnaHelix";
import { useLanguage } from "../../i18n/LanguageContext";
import "./DashboardLayout.css";

// Menu per role. Hospital / Lab / Police will reuse the same dock with fewer items.
export const NAV_BY_ROLE = {
  admin: [
    { to: "/admin/profile", key: "nav.dashboard", icon: "grid", end: true },
    { to: "/admin/samples", key: "nav.samples", icon: "dna" },
    { to: "/admin/comparison", key: "nav.comparison", icon: "compare" },
    { to: "/admin/custody", key: "nav.custody", icon: "chain" },
    { to: "/admin/risk", key: "nav.risk", icon: "risk" },
    { to: "/admin/family", key: "nav.family", icon: "family" },
    { to: "/admin/reports", key: "nav.reports", icon: "report" },
    { to: "/admin/notifications", key: "nav.notifications", icon: "bell" },
    { to: "/admin/settings", key: "nav.settings", icon: "settings" },
  ],
};

const ICONS = {
  grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  dna: (
    <path d="M7 3c0 6 10 6 10 12s-10 6-10 6M17 3c0 6-10 6-10 12M8 8h8M8 16h8" />
  ),
  compare: <path d="M7 4 3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7" />,
  chain: (
    <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3A4 4 0 0 0 11 18.6l1-1" />
  ),
  risk: <path d="M12 3 2 20h20L12 3zM12 10v5M12 17.5v.5" />,
  family: (
    <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 12a2.5 2.5 0 1 0 0-5M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 14c2.5 0 4 1.8 4 5" />
  ),
  report: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" />,
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />,
  settings: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 .6-1.5-1L15 4h-4l-.5 2.6-1.5 1L7 7 5 11l2 1v1l-2 1 2 4 2-.6 1.5 1L11 20h4l.5-2.6 1.5-1 2 .6 2-4-2-1z" />
  ),
  search: <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5" />,
  logout: <path d="M10 4H5v16h5M16 8l4 4-4 4M20 12H9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  user: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  eye: (
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
  ),
  shield: (
    <path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3zM9 12l2 2 4-4" />
  ),
  lock: <path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3" />,
  pin: (
    <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
  ),
  truck: (
    <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
  ),
  flask: (
    <path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3M7.5 15h9" />
  ),
  vault: (
    <path d="M4 5h16v14H4zM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM12 9v1M12 14v1M7 19v2M17 19v2" />
  ),
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  check: <path d="M5 12.5 10 17.5 19 7" />,
  alert: <path d="M12 3 2.5 20h19L12 3zM12 10v4M12 17.5v.5" />,
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3z" />,
  upload: <path d="M12 16V5M7 9l5-5 5 5M5 20h14" />,
  people: (
    <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 12a2.5 2.5 0 1 0 0-5M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 14c2.5 0 4 1.8 4 5" />
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  share: (
    <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  ),
  pdf: (
    <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 14h2a1.5 1.5 0 0 0 0-3H9v6M14 17v-6h1.5a2.5 2.5 0 0 1 0 6H14" />
  ),
  child: (
    <path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM6 21c0-3.5 2.7-6 6-6s6 2.5 6 6M10 7.5h.01M14 7.5h.01" />
  ),
  calendar: <path d="M5 5h14v15H5zM5 10h14M9 3v4M15 3v4" />,
  monitor: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  food: (
    <path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8a2 2 0 0 1-2 2M7 7h4M17 3c-2 2-2.5 5-2.5 8h2.5v10" />
  ),
  doubleCheck: <path d="M2 13l4 4L14 8M10 15l2 2L21 8" />,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  sync: (
    <path d="M20 11a8 8 0 0 0-14-4M4 5v4h4M4 13a8 8 0 0 0 14 4M20 19v-4h-4" />
  ),
  database: (
    <path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  ),
  server: <path d="M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01" />,
  roles: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-7 8-7M17 15l1.2 2.3 2.5.4-1.8 1.8.4 2.5-2.3-1.2-2.3 1.2.4-2.5-1.8-1.8 2.5-.4z" />
  ),
  export: <path d="M12 15V4M8 8l4-4 4 4M5 13v7h14v-7" />,
  tune: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6" />,
  globe: (
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
  ),
  history: <path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4M12 8v4l3 2" />,
  fingerprint: (
    <path d="M7 11a5 5 0 0 1 10 0v2M5 14v-3a7 7 0 0 1 14 0v2M9 20c.5-2 .5-4 .5-6a2.5 2.5 0 0 1 5 0c0 3 .5 5 1.5 7M12 14v2" />
  ),
  desktop: <path d="M3 5h18v11H3zM8 21h8M12 16v5" />,
  phone: <path d="M8 3h8v18H8zM11 18h2" />,
  key: (
    <path d="M14 10a4 4 0 1 0-3.5 4L14 17.5h2.5V20H19v-2.5l1.5-1.5v-3h-3l-2-2" />
  ),
  userPlus: (
    <path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 21c0-4 3-6.5 7-6.5M18 9v6M15 12h6" />
  ),
  back: <path d="M15 5 8 12l7 7" />,
};

export function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

export default function DashboardLayout({ role = "admin", children }) {
  const navigate = useNavigate();
  const { t, toggleLang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const items = NAV_BY_ROLE[role] || [];
  const roleKey = `role.${role}`;

  // Close the profile menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function handleLogout() {
    // Demo only: replace with real session handling when the backend exists.
    localStorage.removeItem("genotrack_user");
    navigate("/login", { replace: true });
  }

  return (
    <div className="dash-shell">
      <div className="login-bg dash-bg" aria-hidden="true">
        <span className="bg-orb bg-orb-a" />
        <span className="bg-orb bg-orb-b" />
        <DnaHelix />
      </div>

      {/* Slim icon rail: expands on hover / keyboard focus */}
      <aside className="dash-dock" aria-label="Main navigation">
        <Link to="/login" className="dock-logo" aria-label="GenoTrack">
          <img src="/images/logo/secondary-logo.png" alt="GenoTrack" />
        </Link>

        <nav className="dock-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={t(item.key)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="dock-ico">
                <Icon name={item.icon} />
              </span>
              <span className="dock-label">{t(item.key)}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="dock-intake"
          title={t("nav.newIntake")}
          onClick={() => navigate("/admin/samples/new")}
        >
          <span className="dock-ico">
            <Icon name="plus" />
          </span>
          <span className="dock-label">{t("nav.newIntake")}</span>
        </button>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <label className="dash-search">
            <Icon name="search" size={18} />
            <input type="search" placeholder={t("top.search")} />
          </label>

          <div className="dash-top-actions">
            <span className="dash-live">
              <i /> {t("top.status")}
            </span>

            <button
              type="button"
              className="dash-lang-btn"
              onClick={toggleLang}
              aria-label="Switch language"
            >
              {t("lang.shortcut")}
            </button>

            <button
              type="button"
              className="dash-icon-btn"
              aria-label={t("nav.notifications")}
              title={t("nav.notifications")}
              onClick={() => navigate("/admin/notifications")}
            >
              <Icon name="bell" />
              <b />
            </button>

            <div className="dash-profile" ref={menuRef}>
              <button
                type="button"
                className="dash-profile-btn"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="dash-avatar">M</span>
                <span className="dash-profile-text">
                  <strong>{t(roleKey)}</strong>
                  <small>{t(`${roleKey}.level`)}</small>
                </span>
                <Icon name="chevron" size={16} />
              </button>

              {menuOpen && (
                <div className="dash-menu" role="menu">
                  <button type="button" role="menuitem">
                    <Icon name="user" size={18} /> {t("top.profile")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/admin/settings");
                    }}
                  >
                    <Icon name="settings" size={18} /> {t("nav.settings")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="danger"
                    onClick={handleLogout}
                  >
                    <Icon name="logout" size={18} /> {t("top.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
}
