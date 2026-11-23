import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { findPatient, getGrant, revokeGrant } from "../../auth/grants";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "./PatientSearch.css";

export default function PatientProfilePage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { patientId } = useParams();

  const patient = findPatient(patientId);
  const grant = patient ? getGrant(patient.nationalId) : null;

  // No patient, or no valid grant (never opened, or expired): back to search.
  if (!patient || !grant) {
    return <Navigate to="/hospital/search" replace />;
  }

  const isEmergency = grant.type === "emergency";
  const name = lang === "ar" && patient.nameAr ? patient.nameAr : patient.name;
  const expires = new Date(grant.expiresAt).toLocaleString(
    lang === "ar" ? "ar-EG" : "en-GB",
    { dateStyle: "medium", timeStyle: "short" },
  );

  function closeRecord() {
    revokeGrant(patient.nationalId);
    navigate("/hospital/search", { replace: true });
  }

  const sections = [
    { key: "conditions", icon: "heart", items: patient.conditions },
    { key: "allergies", icon: "alert", items: patient.allergies },
    { key: "medications", icon: "flask", items: patient.medications },
  ];

  return (
    <DashboardLayout role="hospital_staff">
      {/* Access banner: always visible, red for emergency */}
      <div className={`ps-access ${isEmergency ? "emergency" : "otp"}`}>
        <Icon name={isEmergency ? "alert" : "shield"} size={18} />
        <span>
          <strong>
            {isEmergency ? t("pp.emergencyBanner") : t("pp.otpBanner")}
          </strong>{" "}
          {t("pp.expires")} {expires}
        </span>
      </div>

      <section className="ad-head">
        <div>
          <span className="ad-tag" dir="ltr">
            {patient.nationalId}
          </span>
          <h1>
            {name} <span>{patient.age === 0 ? t("pp.newborn") : ""}</span>
          </h1>
          <p>
            {t("pp.registeredAt")} {patient.hospital} · {t("pp.lastVisit")}{" "}
            {patient.lastVisit}
          </p>
        </div>
        <button type="button" className="ps-ghost" onClick={closeRecord}>
          <Icon name="lock" size={16} /> {t("pp.close")}
        </button>
      </section>

      <section className="ad-stats">
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("pp.age")}</span>
          </div>
          <strong>{patient.age}</strong>
        </article>
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("pp.blood")}</span>
          </div>
          <strong dir="ltr">{patient.blood}</strong>
        </article>
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("pp.risk")}</span>
          </div>
          <strong>
            <em className={`ad-status sm-risk ${patient.risk}`}>
              {t(`sm.risk.${patient.risk}`)}
            </em>
          </strong>
        </article>
      </section>

      <section className="pp-grid">
        {sections.map((s) => (
          <article key={s.key} className="ad-card pp-card">
            <h3>
              <Icon name={s.icon} size={18} /> {t(`pp.${s.key}`)}
            </h3>
            {s.items.length === 0 ? (
              <p className="ps-hint">{t("pp.none")}</p>
            ) : (
              <ul>
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      <p className="ps-hint">
        <Link to="/hospital/search">{t("pp.anotherPatient")}</Link>
      </p>
    </DashboardLayout>
  );
}
