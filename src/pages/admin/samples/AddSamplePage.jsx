import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../../i18n/LanguageContext";
import "./../AdminDashboard.css";
import "./../SamplesPage.css";

const makeSampleId = () => `GT-${Math.floor(10000 + Math.random() * 90000)}-X`;
const ACCEPTED = [".fastq", ".fq", ".bam", ".gz"];

export default function AddSamplePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [sampleId] = useState(makeSampleId);
  const [form, setForm] = useState({
    type: "buccal",
    date: "",
    location: "",
    caseId: "",
    subject: "",
    priority: "standard",
    storage: "cold04",
  });
  const [file, setFile] = useState(null);
  const [over, setOver] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");

  const set = (name) => (e) =>
    setForm((f) => ({ ...f, [name]: e.target.value }));

  function pickFile(f) {
    if (!f) return;
    const ok = ACCEPTED.some((ext) => f.name.toLowerCase().endsWith(ext));
    setErrors((er) => ({ ...er, file: ok ? "" : t("af.err.file") }));
    setFile(ok ? f : null);
  }

  function validate() {
    const er = {};
    if (!form.date) er.date = t("af.err.required");
    if (!form.location.trim()) er.location = t("af.err.required");
    if (!form.caseId.trim()) er.caseId = t("af.err.required");
    if (!file) er.file = t("af.err.fileRequired");
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  async function submit(e, draft = false) {
    e.preventDefault();
    if (!draft && !validate()) return;
    setBusy(true);
    // TODO real backend: POST the form + file here.
    await new Promise((r) => setTimeout(r, 700));
    console.log(draft ? "draft" : "initialize", {
      sampleId,
      ...form,
      file: file?.name,
    });
    setBusy(false);
    if (draft) {
      setSaved(t("af.draftSaved"));
    } else {
      navigate("/admin/samples");
    }
  }

  const field = (name, label, input) => (
    <label className="sm-field">
      <span>{label}</span>
      {input}
      {errors[name] && <em className="sf-err">{errors[name]}</em>}
    </label>
  );

  return (
    <DashboardLayout role="admin">
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("af.tag")}</span>
          <h1>
            {t("af.title1")} <span>{t("af.title2")}</span>
          </h1>
          <p>{t("af.subtitle")}</p>
        </div>
        <span className="ad-monitor">
          <i /> {t("af.secure")}
        </span>
      </section>

      {saved && <div className="sf-saved">{saved}</div>}

      <form onSubmit={(e) => submit(e, false)} noValidate>
        <div className="sf-grid">
          {/* Specimen details */}
          <article className="ad-card">
            <div className="ad-card-head">
              <h3>{t("af.s1")}</h3>
            </div>
            <div className="sf-fields">
              <div className="full">
                {field(
                  "id",
                  t("af.f.sampleId"),
                  <input
                    className="sf-input"
                    value={sampleId}
                    readOnly
                    dir="ltr"
                  />,
                )}
              </div>
              {field(
                "type",
                t("af.f.type"),
                <select
                  className="sf-input"
                  value={form.type}
                  onChange={set("type")}
                >
                  <option value="buccal">{t("sm.type.buccal")}</option>
                  <option value="blood">{t("sm.type.blood")}</option>
                  <option value="hair">{t("af.type.hair")}</option>
                  <option value="tissue">{t("af.type.skin")}</option>
                </select>,
              )}
              {field(
                "date",
                t("af.f.date"),
                <input
                  type="date"
                  className={`sf-input${errors.date ? " err" : ""}`}
                  value={form.date}
                  onChange={set("date")}
                />,
              )}
              <div className="full">
                {field(
                  "location",
                  t("af.f.location"),
                  <input
                    className={`sf-input${errors.location ? " err" : ""}`}
                    value={form.location}
                    onChange={set("location")}
                    placeholder={t("af.f.locationPh")}
                  />,
                )}
              </div>
            </div>
          </article>

          {/* DNA upload */}
          <article className="ad-card">
            <div className="ad-card-head">
              <h3>{t("af.s2")}</h3>
              <small>.FASTQ · .BAM</small>
            </div>
            <div
              className={`sf-drop${over ? " over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && fileRef.current?.click()
              }
            >
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 18 18M12 12v8M9 15l3-3 3 3" />
              </svg>
              <strong>{t("af.drop")}</strong>
              <small>{t("af.encrypted")}</small>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED.join(",")}
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>
            {file && (
              <div className="sf-file">
                <span dir="ltr">{file.name}</span>
                <button type="button" onClick={() => setFile(null)}>
                  {t("af.remove")}
                </button>
              </div>
            )}
            {errors.file && <em className="sf-err">{errors.file}</em>}
          </article>

          {/* Metadata */}
          <article className="ad-card">
            <div className="ad-card-head">
              <h3>{t("af.s3")}</h3>
            </div>
            <div className="sf-fields">
              {field(
                "caseId",
                t("af.f.caseId"),
                <input
                  className={`sf-input${errors.caseId ? " err" : ""}`}
                  value={form.caseId}
                  onChange={set("caseId")}
                  placeholder="C-0000-A"
                  dir="ltr"
                />,
              )}
              {field(
                "subject",
                t("af.f.subject"),
                <input
                  className="sf-input"
                  value={form.subject}
                  onChange={set("subject")}
                />,
              )}
              <div className="full">
                {field(
                  "priority",
                  t("af.f.priority"),
                  <select
                    className="sf-input"
                    value={form.priority}
                    onChange={set("priority")}
                  >
                    <option value="standard">{t("af.p.standard")}</option>
                    <option value="urgent">{t("af.p.urgent")}</option>
                    <option value="forensic">{t("af.p.forensic")}</option>
                    <option value="critical">{t("af.p.critical")}</option>
                  </select>,
                )}
              </div>
            </div>
          </article>

          {/* Chain of custody */}
          <article className="ad-card">
            <div className="ad-card-head">
              <h3>{t("af.s4")}</h3>
            </div>
            <div className="sf-fields">
              <div className="full">
                {field(
                  "by",
                  t("af.f.by"),
                  <input
                    className="sf-input"
                    value={t("af.f.byValue")}
                    readOnly
                  />,
                )}
              </div>
              <div className="full">
                {field(
                  "storage",
                  t("af.f.storage"),
                  <select
                    className="sf-input"
                    value={form.storage}
                    onChange={set("storage")}
                  >
                    <option value="cold04">{t("af.st.cold")}</option>
                    <option value="queue1">{t("af.st.queue")}</option>
                    <option value="locker09">{t("af.st.locker")}</option>
                  </select>,
                )}
              </div>
            </div>
          </article>
        </div>

        <div className="sf-ledger">
          <Icon name="user" size={20} />
          <span>{t("af.ledger")}</span>
        </div>

        <div className="sf-actions">
          <Link to="/admin/samples" className="sf-btn">
            {t("af.cancel")}
          </Link>
          <button
            type="button"
            className="sf-btn"
            disabled={busy}
            onClick={(e) => submit(e, true)}
          >
            {t("af.draft")}
          </button>
          <button type="submit" className="sf-btn primary" disabled={busy}>
            {busy ? t("af.working") : t("af.submit")}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
