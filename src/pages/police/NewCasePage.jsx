import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { getUser } from "../../auth/session";
import { createCase } from "../../auth/police";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "../hospital/PatientSearch.css";
import "../hospital/NewbornPage.css";
import "./Police.css";

const EMPTY = {
  childName: "",
  childAge: "",
  gender: "",
  place: "",
  when: "",
  reporter: "",
  relation: "",
  contact: "",
  description: "",
  priority: "normal",
};

// Open a new case. Two kinds:
//   missing -> a family reports a missing child
//   found   -> someone found a child and handed him / her to the police
// The officer picks the kind first, then fills in the form.
export default function NewCasePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const staffId = getUser()?.nationalId || "unknown";

  const [type, setType] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function pickType(next) {
    setType(next);
    setError("");
  }

  // Missing child: the child's name and the family contact are required.
  // Found child: where / when he was found and who handed him in are required.
  const ready =
    type === "missing"
      ? form.childName.trim() && form.reporter.trim() && form.contact.trim()
      : type === "found"
        ? form.place.trim() && form.when && form.reporter.trim()
        : false;

  async function submit(e) {
    e.preventDefault();
    if (!ready || saving) return;
    setSaving(true);
    setError("");
    try {
      const record = await createCase({ ...form, type, staffId });
      navigate(`/police/cases/${record.id}`, { replace: true });
    } catch {
      setError(t("pol.new.error"));
      setSaving(false);
    }
  }

  const isMissing = type === "missing";

  return (
    <DashboardLayout role="police_investigator">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("pol.new.tag")}</span>
          <h1>
            {t("pol.new.title1")} <span>{t("pol.new.title2")}</span>
          </h1>
          <p>{t("pol.new.subtitle")}</p>
        </div>
        <Link to="/police/cases" className="sf-btn">
          {t("pol.back")}
        </Link>
      </section>

      {/* Step 1: the kind of case */}
      <section className="pol-types">
        <button
          type="button"
          className={`ad-card pol-type-card ${isMissing ? "on" : ""}`}
          onClick={() => pickType("missing")}
        >
          <span className="pol-type-ico">
            <Icon name="people" size={26} />
          </span>
          <b>{t("pol.type.missing")}</b>
          <small>{t("pol.new.missingText")}</small>
        </button>
        <button
          type="button"
          className={`ad-card pol-type-card ${type === "found" ? "on" : ""}`}
          onClick={() => pickType("found")}
        >
          <span className="pol-type-ico">
            <Icon name="baby" size={26} />
          </span>
          <b>{t("pol.type.found")}</b>
          <small>{t("pol.new.foundText")}</small>
        </button>
      </section>

      {!type && <p className="ps-hint">{t("pol.new.pick")}</p>}

      {/* Step 2: the form */}
      {type && (
        <form className="nb-form" onSubmit={submit}>
          {/* The child */}
          <section className="ad-card nb-section">
            <div className="nb-step">
              <b>1</b>
              <h3>{t("pol.new.childSection")}</h3>
            </div>
            <div className="nb-grid">
              <label className="nb-field">
                <span className="ps-label">
                  {t("pol.new.childName")}
                  {isMissing ? " *" : ""}
                </span>
                <input
                  className="ps-input"
                  value={form.childName}
                  onChange={(e) => setField("childName", e.target.value)}
                  placeholder={
                    isMissing
                      ? t("pol.new.childNamePh")
                      : t("pol.new.childNameFoundPh")
                  }
                />
              </label>
              <label className="nb-field">
                <span className="ps-label">{t("pol.new.childAge")}</span>
                <input
                  className="ps-input"
                  type="number"
                  min="0"
                  max="18"
                  dir="ltr"
                  value={form.childAge}
                  onChange={(e) => setField("childAge", e.target.value)}
                  placeholder={t("pol.new.childAgePh")}
                />
              </label>
              <label className="nb-field">
                <span className="ps-label">{t("pol.new.gender")}</span>
                <select
                  className="ps-input"
                  value={form.gender}
                  onChange={(e) => setField("gender", e.target.value)}
                >
                  <option value="">{t("pol.new.genderUnknown")}</option>
                  <option value="male">{t("pol.new.male")}</option>
                  <option value="female">{t("pol.new.female")}</option>
                </select>
              </label>
            </div>
            <label className="nb-field">
              <span className="ps-label">{t("pol.new.description")}</span>
              <textarea
                className="ps-input ps-textarea"
                rows={3}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder={t("pol.new.descriptionPh")}
              />
            </label>
          </section>

          {/* Where and when */}
          <section className="ad-card nb-section">
            <div className="nb-step">
              <b>2</b>
              <h3>
                {isMissing
                  ? t("pol.new.lastSeenSection")
                  : t("pol.new.foundSection")}
              </h3>
            </div>
            <div className="nb-grid nb-grid-2">
              <label className="nb-field">
                <span className="ps-label">
                  {isMissing ? t("pol.new.lastSeenPlace") : t("pol.new.foundPlace")}
                  {isMissing ? "" : " *"}
                </span>
                <input
                  className="ps-input"
                  value={form.place}
                  onChange={(e) => setField("place", e.target.value)}
                  placeholder={t("pol.new.placePh")}
                />
              </label>
              <label className="nb-field">
                <span className="ps-label">
                  {isMissing ? t("pol.new.lastSeenDate") : t("pol.new.foundDate")}
                  {isMissing ? "" : " *"}
                </span>
                <input
                  className="ps-input"
                  type="date"
                  dir="ltr"
                  value={form.when}
                  onChange={(e) => setField("when", e.target.value)}
                />
              </label>
            </div>
          </section>

          {/* The person who reports or hands the child in */}
          <section className="ad-card nb-section">
            <div className="nb-step">
              <b>3</b>
              <h3>
                {isMissing
                  ? t("pol.new.familySection")
                  : t("pol.new.finderSection")}
              </h3>
            </div>
            <div className="nb-grid">
              <label className="nb-field">
                <span className="ps-label">{t("pol.new.reporter")} *</span>
                <input
                  className="ps-input"
                  value={form.reporter}
                  onChange={(e) => setField("reporter", e.target.value)}
                />
              </label>
              <label className="nb-field">
                <span className="ps-label">
                  {isMissing
                    ? t("pol.new.relation")
                    : t("pol.new.relationFound")}
                </span>
                <input
                  className="ps-input"
                  value={form.relation}
                  onChange={(e) => setField("relation", e.target.value)}
                  placeholder={
                    isMissing
                      ? t("pol.new.relationPh")
                      : t("pol.new.relationFoundPh")
                  }
                />
              </label>
              <label className="nb-field">
                <span className="ps-label">
                  {t("pol.new.contact")}
                  {isMissing ? " *" : ""}
                </span>
                <input
                  className="ps-input"
                  dir="ltr"
                  inputMode="tel"
                  value={form.contact}
                  onChange={(e) => setField("contact", e.target.value)}
                />
              </label>
            </div>
          </section>

          {/* Priority */}
          <section className="ad-card nb-section">
            <label className="nb-consent">
              <input
                type="checkbox"
                checked={form.priority === "high"}
                onChange={(e) =>
                  setField("priority", e.target.checked ? "high" : "normal")
                }
              />
              <div>
                <strong>{t("pol.new.urgent")}</strong>
                <small>{t("pol.new.urgentText")}</small>
              </div>
            </label>
          </section>

          {error && <p className="ps-error">{error}</p>}

          <div className="nb-submit">
            <button
              type="submit"
              className="sm-add"
              disabled={!ready || saving}
            >
              <Icon name="check" size={18} />{" "}
              {saving ? t("pol.new.saving") : t("pol.new.submit")}
            </button>
            <small>{t("pol.new.next")}</small>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}
