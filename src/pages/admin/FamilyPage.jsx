import { useEffect, useMemo, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { listLabSamples } from "../../auth/lab";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";
import "./FamilyPage.css";

// The admin Family Linking page reads the real lab samples.
//
// Real data (from src/auth/lab.js):
//   - the list of subjects to choose from (one per lab sample)
//   - the subject name, sample ID, case ID, hospital, specimen type,
//     received date and lab status
//
// Demo analysis data (the demo has no relationship testing):
//   - parents, match percentages, SNP split and mutation probability exist
//     for the samples listed in FAMILIES below (the same two samples that
//     have a risk analysis). Any other sample shows "waiting for analysis".
//     The backend will return the real kinship result.
//
// Every typed-in name has an Arabic version (nameAr), so the whole page
// switches language, not only the labels.

const FAMILIES = {
  "GT-99281-X": {
    parents: [
      {
        id: "paternal",
        link: "P-102",
        name: "John Doe #11029",
        nameAr: "جون دو #11029",
        sample: "GT-ALPHA-09",
        match: "99.9",
      },
      {
        id: "maternal",
        link: "M-304",
        name: "Jane Doe #11030",
        nameAr: "جين دو #11030",
        sample: "GT-BETA-12",
        match: "99.9",
      },
    ],
    paternal: 62,
    maternal: 38,
    mutation: "0.002%",
    linked: [
      { id: "DNA-V-99", type: "buccal", side: "paternal" },
      { id: "DNA-M-42", type: "blood", side: "maternal" },
    ],
    analyst: "SENTINEL-77-DELTA",
  },
  "GT-00129-Z": {
    parents: [
      {
        id: "paternal",
        link: "P-208",
        name: "Adam Roe #20418",
        nameAr: "آدم رو #20418",
        sample: "GT-ALPHA-21",
        match: "99.8",
      },
      {
        id: "maternal",
        link: "M-311",
        name: "Lina Roe #20419",
        nameAr: "لينا رو #20419",
        sample: "GT-BETA-27",
        match: "99.9",
      },
    ],
    paternal: 48,
    maternal: 52,
    mutation: "0.004%",
    linked: [
      { id: "DNA-V-61", type: "blood", side: "paternal" },
      { id: "DNA-M-18", type: "buccal", side: "maternal" },
    ],
    analyst: "SENTINEL-77-DELTA",
  },
};

const ATTACH_KEY = "genotrack_admin_family_attached";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Starts a browser download of a text file.
function downloadText(fileName, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function FamilyPage() {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [exported, setExported] = useState(false);
  const [attached, setAttached] = useState(() => readJson(ATTACH_KEY, {}));
  const [adding, setAdding] = useState(false);
  const [draftId, setDraftId] = useState("");
  const [draftType, setDraftType] = useState("blood");
  const [draftSide, setDraftSide] = useState("paternal");
  const [draftError, setDraftError] = useState("");

  useEffect(() => {
    let alive = true;
    listLabSamples().then((list) => {
      if (!alive) return;
      setSamples(list);
      // Start on a sample that has a kinship result, otherwise the first one.
      const first = list.find((s) => FAMILIES[s.id]) || list[0];
      setSubject(first ? first.id : "");
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const current = samples.find((s) => s.id === subject) || null;
  const family = current ? FAMILIES[current.id] || null : null;

  const label = (s) => {
    const who = s.subject ? `${s.subject} - ` : "";
    return `${who}${s.id}`;
  };

  // Arabic version of a typed-in name when the page is in Arabic.
  const pick = (en, ar) => (isAr && ar ? ar : en);

  const hospitalName = (s) =>
    isAr && s.hospitalAr ? s.hospitalAr : s.hospital;

  const dateText = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Linked forensic samples = the ones from the kinship result + the ones
  // the admin attached on this page.
  const linked = useMemo(() => {
    if (!family) return [];
    return [
      ...family.linked.map((s) => ({ ...s, status: "verified" })),
      ...(attached[subject] || []).map((s) => ({ ...s, status: "pending" })),
    ];
  }, [family, attached, subject]);

  // The case is closed once the lab finished the sample.
  const caseClosed = Boolean(current && current.status === "done");

  function pickSubject(id) {
    setSubject(id);
    setAdding(false);
    setDraftId("");
    setDraftError("");
  }

  function saveAttach(e) {
    e.preventDefault();
    const id = draftId.trim();
    if (!id) {
      setDraftError(t("fm.attachError"));
      return;
    }
    if (linked.some((s) => s.id === id)) {
      setDraftError(t("fm.attachExists"));
      return;
    }
    const next = {
      ...attached,
      [subject]: [
        ...(attached[subject] || []),
        { id, type: draftType, side: draftSide },
      ],
    };
    setAttached(next);
    writeJson(ATTACH_KEY, next);
    setDraftId("");
    setDraftError("");
    setAdding(false);
  }

  function exportPedigree() {
    if (!current || !family) return;
    const line = (a, b) => `${a}: ${b}`;
    const out = [
      t("fm.rep.title"),
      "=".repeat(48),
      line(
        t("fm.rep.generated"),
        new Date().toLocaleString(isAr ? "ar-EG" : "en-GB"),
      ),
      "",
      `[ ${t("fm.subject")} ]`,
      line(t("fm.rep.name"), current.subject || "-"),
      line(t("fm.rep.sample"), current.id),
      line(t("fm.rep.case"), current.caseId || "-"),
      line(t("fm.rep.hospital"), hospitalName(current)),
      "",
      `[ ${t("fm.rep.parents")} ]`,
      ...family.parents.map((p) =>
        line(
          t(`fm.${p.id}Source`),
          `${pick(p.name, p.nameAr)} - ${p.sample} (${p.match}%)`,
        ),
      ),
      "",
      `[ ${t("fm.consistency")} ]`,
      line(t("fm.snpPaternal"), `${family.paternal}%`),
      line(t("fm.snpMaternal"), `${family.maternal}%`),
      line(t("fm.mutation"), family.mutation),
      "",
      `[ ${t("fm.forensic")} ]`,
      ...linked.map(
        (s) =>
          `${s.id} | ${t(`fm.type.${s.type}`)} | ${t(`fm.side.${s.side}`)} | ${t(`fm.st.${s.status}`)}`,
      ),
      "",
      line(
        t("fm.caseStatus"),
        caseClosed ? t("fm.closed") : t("fm.open"),
      ),
      "",
    ];
    downloadText(`${current.id}-pedigree.txt`, out.join("\n"));
    setExported(true);
    setTimeout(() => setExported(false), 1800);
  }

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag fm-online">
            <i /> {t("fm.online")}
          </span>
          <h1>
            {t("fm.title1")} <span>{t("fm.title2")}</span>
          </h1>
          <p>{t("fm.subtitle")}</p>
        </div>
        <button
          type="button"
          className="sm-add"
          disabled={!family}
          onClick={exportPedigree}
        >
          <Icon name="download" size={18} />{" "}
          {exported ? t("fm.exported") : t("fm.export")}
        </button>
      </section>

      {/* Subject picker */}
      <section className="ad-card fm-pick">
        <label className="rk-field fm-pick-field">
          <span className="cp-label">{t("fm.pick")}</span>
          <select
            className="sm-select rk-select"
            value={subject}
            onChange={(e) => pickSubject(e.target.value)}
            disabled={loading || samples.length === 0}
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {label(s)}
              </option>
            ))}
          </select>
        </label>

        {current && (
          <dl className="fm-facts">
            <div>
              <dt>{t("fm.rep.case")}</dt>
              <dd dir="ltr">{current.caseId || "-"}</dd>
            </div>
            <div>
              <dt>{t("fm.rep.hospital")}</dt>
              <dd>{hospitalName(current)}</dd>
            </div>
            <div>
              <dt>{t("rk.f.received")}</dt>
              <dd>{dateText(current.receivedAt)}</dd>
            </div>
            <div>
              <dt>{t("rk.rep.status")}</dt>
              <dd>{t(`lab.st.${current.status}`)}</dd>
            </div>
          </dl>
        )}
      </section>

      {!family && (
        <section className="ad-card rk-empty">
          <span className="fm-ico-sm">
            <Icon name="people" size={22} />
          </span>
          <h3>{t("fm.emptyTitle")}</h3>
          <p>{loading ? t("hr.loading") : t("fm.emptyText")}</p>
        </section>
      )}

      {family && current && (
        <>
          {/* Pedigree */}
          <section className="ad-card fm-tree">
            <div className="fm-parents">
              {family.parents.map((p) => (
                <article key={p.id} className={`fm-person ${p.id}`}>
                  <header>
                    <span className="fm-link">
                      {t("fm.linkSample")} <b dir="ltr">{p.link}</b>
                    </span>
                    <span className="fm-ico">
                      <Icon name="user" size={22} />
                    </span>
                  </header>
                  <small>{t(`fm.${p.id}Source`)}</small>
                  <h3>{pick(p.name, p.nameAr)}</h3>
                  <code dir="ltr">{p.sample}</code>

                  <div className="fm-match" dir="ltr">
                    <span>{t(`fm.${p.id}Match`)}</span>
                    <strong>{p.match}%</strong>
                  </div>
                </article>
              ))}
            </div>

            {/* connector lines */}
            <div className="fm-connector" aria-hidden="true">
              <i className="left" />
              <i className="center" />
              <i className="right" />
            </div>

            <article className="fm-child">
              <span className="fm-child-ico">
                <Icon name="people" size={26} />
              </span>
              <small>
                {t("fm.subject")}: <b dir="ltr">{current.id}</b>
              </small>
              <h2>{current.subject || current.id}</h2>
              <em className="fm-confirmed">
                <Icon name="shield" size={14} /> {t("fm.confirmed")}
              </em>
            </article>
          </section>

          {/* Consistency + forensic samples */}
          <section className="fm-mid">
            <article className="ad-card fm-consistency">
              <div className="fm-card-title">
                <span className="fm-ico-sm">
                  <Icon name="chart" size={20} />
                </span>
                <h3>{t("fm.consistency")}</h3>
              </div>

              <div className="fm-snp">
                <div className="fm-snp-row">
                  <span>{t("fm.snpPaternal")}</span>
                  <b dir="ltr">{family.paternal}%</b>
                </div>
                <div className="fm-snp-row">
                  <span>{t("fm.snpMaternal")}</span>
                  <b dir="ltr">{family.maternal}%</b>
                </div>

                <div className="fm-split" dir="ltr">
                  <i className="p" style={{ width: `${family.paternal}%` }} />
                  <i className="m" style={{ width: `${family.maternal}%` }} />
                </div>
              </div>

              <div className="fm-mutation">
                <span>{t("fm.mutation")}</span>
                <strong dir="ltr">{family.mutation}</strong>
              </div>
            </article>

            <article className="ad-card fm-forensic">
              <div className="fm-card-title">
                <span className="fm-ico-sm">
                  <Icon name="flask" size={20} />
                </span>
                <h3>{t("fm.forensic")}</h3>
                <strong className="fm-count" dir="ltr">
                  {linked.length}
                </strong>
              </div>
              <p>{t("fm.forensicText", { count: linked.length })}</p>

              <ul className="fm-samples">
                {linked.map((s) => (
                  <li key={s.id}>
                    <span className="fm-ico-sm">
                      <Icon name="flask" size={18} />
                    </span>
                    <div>
                      <b dir="ltr">{s.id}</b>
                      <small>
                        {t(`fm.type.${s.type}`)} - {t(`fm.side.${s.side}`)}
                      </small>
                    </div>
                    <em className={`fm-status ${s.status}`}>
                      {t(`fm.st.${s.status}`)}
                    </em>
                  </li>
                ))}
              </ul>

              {adding && (
                <form className="fm-add" onSubmit={saveAttach} noValidate>
                  <input
                    className="sf-input"
                    dir="ltr"
                    placeholder="DNA-X-00"
                    value={draftId}
                    onChange={(e) => setDraftId(e.target.value)}
                    aria-label={t("fm.attach")}
                  />
                  <select
                    className="sm-select"
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value)}
                    aria-label={t("rk.f.type")}
                  >
                    <option value="blood">{t("fm.type.blood")}</option>
                    <option value="buccal">{t("fm.type.buccal")}</option>
                  </select>
                  <select
                    className="sm-select"
                    value={draftSide}
                    onChange={(e) => setDraftSide(e.target.value)}
                    aria-label={t("fm.side")}
                  >
                    <option value="paternal">{t("fm.side.paternal")}</option>
                    <option value="maternal">{t("fm.side.maternal")}</option>
                  </select>
                  <button type="submit" className="sm-add">
                    {t("fm.attachSave")}
                  </button>
                  {draftError && (
                    <p className="rk-add-error" role="alert">
                      {draftError}
                    </p>
                  )}
                </form>
              )}

              <button
                type="button"
                className="sf-btn fm-attach"
                aria-expanded={adding}
                onClick={() => {
                  setAdding((a) => !a);
                  setDraftError("");
                }}
              >
                {adding ? t("fm.attachCancel") : `+ ${t("fm.attachNew")}`}
              </button>
            </article>
          </section>

          {/* Footer */}
          <footer className="ad-card fm-foot">
            <div>
              <span className="cp-label">{t("fm.lastAnalysis")}</span>
              <b>{dateText(current.receivedAt)}</b>
            </div>
            <div>
              <span className="cp-label">{t("fm.analystId")}</span>
              <b dir="ltr">{family.analyst}</b>
            </div>
            <div>
              <span className="cp-label">{t("fm.caseStatus")}</span>
              <b className={caseClosed ? "fm-closed" : "fm-open"}>
                {caseClosed ? t("fm.closed") : t("fm.open")}
              </b>
            </div>
            <em className="fm-enc">
              <Icon name="lock" size={14} /> {t("fm.encrypted")}
            </em>
          </footer>
        </>
      )}
    </DashboardLayout>
  );
}
