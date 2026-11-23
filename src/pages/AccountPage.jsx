import { useNavigate } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../components/dashboard/DashboardLayout";
import { useLanguage } from "../i18n/useLanguage";
import { getUser } from "../auth/session";
import "./admin/AdminDashboard.css";
import "./admin/SamplesPage.css";
import "./admin/SettingsPage.css";
import "./AccountPage.css";

// One profile page for every role. It only shows the signed-in account:
// name, ID, role and access level. Preferences stay on the Settings page.
const SETTINGS_BY_ROLE = {
  admin: "/admin/settings",
  hospital_staff: "/hospital/settings",
  lab_technician: "/lab/settings",
  police_investigator: "/police/settings",
};

const HOME_BY_ROLE = {
  admin: "/admin/profile",
  hospital_staff: "/hospital/profile",
  lab_technician: "/lab/profile",
  police_investigator: "/police/profile",
};

export default function AccountPage({ role = "admin" }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const user = getUser();

  const fallbackName = {
    admin: lang === "ar" ? "مدير الوزارة" : "Ministry Admin",
    hospital_staff: lang === "ar" ? "طاقم المستشفى" : "Hospital Staff",
    lab_technician: lang === "ar" ? "فني المختبر" : "Lab Technician",
    police_investigator: lang === "ar" ? "ضابط التحقيق" : "Police Investigator",
  }[role];

  const name = user?.name || fallbackName;
  const nationalId = user?.nationalId || "—";
  const hospitalRole = user?.hospitalRole;

  return (
    <DashboardLayout role={role}>
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("acc.tag")}</span>
          <h1>
            {t("acc.title1")} <span>{t("acc.title2")}</span>
          </h1>
          <p>{t("acc.subtitle")}</p>
        </div>
        <div className="st-head-actions">
          <button
            type="button"
            className="sm-add"
            onClick={() => navigate(SETTINGS_BY_ROLE[role])}
          >
            <Icon name="settings" size={18} /> {t("acc.openSettings")}
          </button>
        </div>
      </section>

      <section className="ad-card acc-card">
        <div className="acc-hero">
          <div className="acc-avatar">{String(name).charAt(0)}</div>
          <div className="acc-hero-text">
            <h2>{name}</h2>
            <span className="acc-role">{t(`role.${role}`)}</span>
            <small>{t(`role.${role}.level`)}</small>
          </div>
        </div>

        <dl className="acc-fields">
          <div>
            <dt>{t("acc.fullName")}</dt>
            <dd>{name}</dd>
          </div>
          <div>
            <dt>{t("acc.nationalId")}</dt>
            <dd dir="ltr">{nationalId}</dd>
          </div>
          <div>
            <dt>{t("acc.role")}</dt>
            <dd>{t(`role.${role}`)}</dd>
          </div>
          {hospitalRole && (
            <div>
              <dt>{t("acc.hospitalRole")}</dt>
              <dd>{hospitalRole}</dd>
            </div>
          )}
          <div>
            <dt>{t("acc.accessLevel")}</dt>
            <dd>{t(`role.${role}.level`)}</dd>
          </div>
          <div>
            <dt>{t("acc.language")}</dt>
            <dd>{lang === "ar" ? "العربية" : "English"}</dd>
          </div>
        </dl>

        <div className="acc-actions">
          <button
            type="button"
            className="sf-btn"
            onClick={() => navigate(HOME_BY_ROLE[role])}
          >
            <Icon name="grid" size={16} /> {t("acc.backToDashboard")}
          </button>
          <button
            type="button"
            className="sm-add"
            onClick={() => navigate(SETTINGS_BY_ROLE[role])}
          >
            <Icon name="settings" size={16} /> {t("acc.openSettings")}
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}
