import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { getUser } from "../../auth/session";
import { lookupParent, registerNewborn } from "../../auth/grants";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "./PatientSearch.css";
import "./NewbornPage.css";

// A parent can be: idle -> searching -> found (waiting for confirm) -> confirmed,
// or notFound (the officer may create a new profile later).
const emptyParent = () => ({
  id: "",
  status: "idle",
  patient: null,
});

export default function NewbornPage() {
  const { t, lang } = useLanguage();
  const user = getUser();
  const staffId = user?.nationalId || "unknown";

  const [name, setName] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [dob, setDob] = useState("");
  const [mother, setMother] = useState(emptyParent());
  const [father, setFather] = useState(emptyParent());
  const [fileName, setFileName] = useState("");
  const [method, setMethod] = useState("buccal");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const displayName = (p) => (lang === "ar" && p.nameAr ? p.nameAr : p.name);

  const canSubmit =
    consent && name.trim() && hospitalId.trim() && dob && !busy;

  async function identify(setter, parent) {
    if (!parent.id.trim()) return;
    setter({ ...parent, status: "searching" });
    const found = await lookupParent(parent.id);
    setter({
      ...parent,
      status: found ? "found" : "notFound",
      patient: found,
    });
  }

  function confirmParent(setter, parent) {
    setter({ ...parent, status: "confirmed" });
  }

  function clearParent(setter) {
    setter(emptyParent());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!canSubmit) {
      setError(t("nb.errRequired"));
      return;
    }
    setBusy(true);
    try {
      const record = await registerNewborn({
        name: name.trim(),
        hospitalId: hospitalId.trim(),
        dob,
        motherId: mother.status === "confirmed" ? mother.patient.nationalId : "",
        fatherId: father.status === "confirmed" ? father.patient.nationalId : "",
        sequenceFile: fileName,
        method,
        staffId,
      });
      setDone(record);
    } catch {
      setError(t("nb.errFailed"));
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    setName("");
    setHospitalId("");
    setDob("");
    setMother(emptyParent());
    setFather(emptyParent());
    setFileName("");
    setMethod("buccal");
    setConsent(false);
    setError("");
    setDone(null);
  }

  // One parent block (mother or father)
  function ParentBlock({ label, parent, setter, idPrefix }) {
    return (
      <div className="nb-parent">
        <h4>{label}</h4>

        {(parent.status === "idle" ||
          parent.status === "searching" ||
          parent.status === "notFound") && (
          <>
            <div className="ps-row">
              <input
                id={`${idPrefix}-id`}
                className="ps-input"
                dir="ltr"
                inputMode="numeric"
                autoComplete="off"
                placeholder={t("nb.parentIdPh")}
                value={parent.id}
                onChange={(e) =>
                  setter({ ...parent, id: e.target.value, status: "idle" })
                }
              />
              <button
                type="button"
                className="ps-ghost"
                disabled={parent.status === "searching"}
                onClick={() => identify(setter, parent)}
              >
                <Icon name="search" size={16} />{" "}
                {parent.status === "searching"
                  ? t("ps.searching")
                  : t("nb.identify")}
              </button>
            </div>
            {parent.status === "notFound" && (
              <p className="ps-hint nb-notfound">{t("nb.parentNotFound")}</p>
            )}
          </>
        )}

        {parent.status === "found" && parent.patient && (
          <div className="nb-match">
            <div className="ps-found">
              <span className="ps-avatar">
                <Icon name="user" size={22} />
              </span>
              <div>
                <strong>{displayName(parent.patient)}</strong>
                <small dir="ltr">{parent.patient.nationalId}</small>
              </div>
            </div>
            <p className="ps-hint">{t("nb.matchAsk")}</p>
            <div className="ps-actions">
              <button
                type="button"
                className="sm-add"
                onClick={() => confirmParent(setter, parent)}
              >
                <Icon name="check" size={16} /> {t("nb.confirmMatch")}
              </button>
              <button
                type="button"
                className="ps-ghost"
                onClick={() => clearParent(setter)}
              >
                {t("nb.notThisPerson")}
              </button>
            </div>
          </div>
        )}

        {parent.status === "confirmed" && parent.patient && (
          <div className="nb-linked">
            <span className="ps-avatar">
              <Icon name="check" size={20} />
            </span>
            <div>
              <strong>{displayName(parent.patient)}</strong>
              <small dir="ltr">{parent.patient.nationalId}</small>
              <em>{t("nb.linked")}</em>
            </div>
            <button
              type="button"
              className="ps-ghost"
              onClick={() => clearParent(setter)}
            >
              {t("nb.change")}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- Success screen ----
  if (done) {
    return (
      <DashboardLayout role="hospital_staff">
        <section className="ad-card ps-card nb-done">
          <span className="ps-avatar nb-done-ico">
            <Icon name="check" size={26} />
          </span>
          <h2>{t("nb.doneTitle")}</h2>
          <p className="ps-hint">{t("nb.doneText")}</p>
          <div className="nb-record" dir="ltr">
            {done.recordId}
          </div>
          <div className="ps-actions">
            <button type="button" className="sm-add" onClick={startOver}>
              <Icon name="baby" size={18} /> {t("nb.another")}
            </button>
            <Link to="/hospital/profile" className="ps-ghost">
              {t("nb.backDashboard")}
            </Link>
          </div>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="hospital_staff">
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("nb.tag")}</span>
          <h1>
            {t("nb.title1")} <span>{t("nb.title2")}</span>
          </h1>
          <p>{t("nb.subtitle")}</p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="nb-form">
        {/* 01 Subject identity */}
        <section className="ad-card nb-section">
          <div className="nb-step">
            <b>01</b>
            <h3>{t("nb.s1")}</h3>
          </div>
          <div className="nb-grid">
            <label className="nb-field">
              <span className="ps-label">{t("nb.fullName")}</span>
              <input
                className="ps-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("nb.fullNamePh")}
              />
            </label>
            <label className="nb-field">
              <span className="ps-label">{t("nb.hospitalId")}</span>
              <input
                className="ps-input"
                dir="ltr"
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                placeholder="HOS-000000"
              />
            </label>
            <label className="nb-field">
              <span className="ps-label">{t("nb.dob")}</span>
              <input
                className="ps-input"
                dir="ltr"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* 02 Genetic lineage */}
        <section className="ad-card nb-section">
          <div className="nb-step">
            <b>02</b>
            <h3>{t("nb.s2")}</h3>
            <small className="nb-chain">
              <Icon name="chain" size={14} /> {t("nb.chain")}
            </small>
          </div>
          <div className="nb-grid nb-grid-2">
            {ParentBlock({
              label: t("nb.mother"),
              parent: mother,
              setter: setMother,
              idPrefix: "mother",
            })}
            {ParentBlock({
              label: t("nb.father"),
              parent: father,
              setter: setFather,
              idPrefix: "father",
            })}
          </div>
        </section>

        {/* 03 Genomic payload and consent */}
        <section className="ad-card nb-section">
          <div className="nb-step">
            <b>03</b>
            <h3>{t("nb.s3")}</h3>
          </div>

          <label className="nb-upload">
            <Icon name="upload" size={22} />
            <strong>{fileName || t("nb.upload")}</strong>
            <small>{t("nb.uploadHint")}</small>
            <input
              type="file"
              accept=".fastq,.fq,.bam,.vcf,.gz"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
            />
          </label>

          <div className="nb-badges">
            <span>
              <Icon name="check" size={14} /> {t("nb.crc")}
            </span>
            <span>
              <Icon name="lock" size={14} /> {t("nb.aes")}
            </span>
          </div>

          <label className="nb-field">
            <span className="ps-label">{t("nb.method")}</span>
            <select
              className="ps-input"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="buccal">{t("nb.method.buccal")}</option>
              <option value="cord">{t("nb.method.cord")}</option>
              <option value="heel">{t("nb.method.heel")}</option>
            </select>
          </label>

          <label className="nb-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              <strong>{t("nb.consentTitle")}</strong>
              <small>{t("nb.consentText")}</small>
            </span>
          </label>
        </section>

        {error && (
          <p className="ps-error" role="alert">
            {error}
          </p>
        )}

        <div className="nb-submit">
          <button type="submit" className="sm-add" disabled={!canSubmit}>
            <Icon name="shield" size={18} />{" "}
            {busy ? t("nb.submitting") : t("nb.submit")}
          </button>
          <small>{t("nb.authNote")}</small>
        </div>
      </form>
    </DashboardLayout>
  );
}
