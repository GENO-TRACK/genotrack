import { useEffect, useMemo, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { listLabSamples } from "../../auth/lab";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";
import "./RiskPage.css";

// The admin Genetic Risk page reads the real lab samples.
//
// Real data (from src/auth/lab.js):
//   - the list of samples to choose from
//   - the sample details: subject, case ID, specimen type, hospital, lab
//     status, storage slot, temperature, received date and the risk level the
//     admin set on the Add Sample form
//
// Demo analysis data (the demo has no sequencing results):
//   - parents, hereditary markers, risk vectors and variants exist for the
//     samples listed in ANALYSES below. Any other sample shows the
//     "waiting for analysis" card. The backend will return the real analysis.
//
// Every typed-in name in ANALYSES has an Arabic version (nameAr, mutationAr),
// so the whole page switches language, not only the labels.

const ANALYSES = {
  "GT-99281-X": {
    parents: [
      {
        id: "paternal",
        name: "John Doe #11029",
        nameAr: "جون دو #11029",
        match: "99.9",
      },
      {
        id: "maternal",
        name: "Jane Doe #11030",
        nameAr: "جين دو #11030",
        match: "99.9",
      },
    ],
    confidence: 85,
    markers: [
      { id: "snv", paternal: 62, maternal: 38 },
      { id: "mito", paternal: 5, maternal: 95 },
      { id: "k4", paternal: 50, maternal: 50, balanced: true },
    ],
    risks: [
      {
        id: "cardio",
        level: "high",
        name: "Cardiomyopathy (TTN Gene)",
        nameAr: "اعتلال عضلة القلب (جين TTN)",
        value: 92,
        chr: "2",
        loc: "178,525,989",
      },
      {
        id: "metabolic",
        level: "medium",
        name: "Metabolic Deficiency (ASL)",
        nameAr: "نقص أيضي (ASL)",
        value: 44,
      },
      {
        id: "hemo",
        level: "low",
        name: "Hemochromatosis (HFE)",
        nameAr: "داء ترسب الأصبغة الدموية (HFE)",
        value: 8,
      },
    ],
    variants: [
      {
        rs: "rs121913527",
        gene: "BRCA1",
        loc: "Chr17:43044295",
        mutation: "Nonsense (p.Glu23Ter)",
        mutationAr: "طفرة عديمة المعنى (p.Glu23Ter)",
        z: 1.22,
      },
      {
        rs: "rs1800562",
        gene: "HFE",
        loc: "Chr6:26093141",
        mutation: "Missense (C282Y)",
        mutationAr: "طفرة خاطئة المعنى (C282Y)",
        z: 4.89,
      },
      {
        rs: "rs7412",
        gene: "APOE",
        loc: "Chr19:44908822",
        mutation: "Missense (Arg176Cys)",
        mutationAr: "طفرة خاطئة المعنى (Arg176Cys)",
        z: -0.44,
      },
    ],
  },
  "GT-00129-Z": {
    parents: [
      {
        id: "paternal",
        name: "Adam Roe #20418",
        nameAr: "آدم رو #20418",
        match: "99.8",
      },
      {
        id: "maternal",
        name: "Lina Roe #20419",
        nameAr: "لينا رو #20419",
        match: "99.9",
      },
    ],
    confidence: 78,
    markers: [
      { id: "snv", paternal: 48, maternal: 52 },
      { id: "mito", paternal: 8, maternal: 92 },
      { id: "k4", paternal: 50, maternal: 50, balanced: true },
    ],
    risks: [
      {
        id: "metabolic",
        level: "medium",
        name: "Metabolic Deficiency (ASL)",
        nameAr: "نقص أيضي (ASL)",
        value: 51,
      },
      {
        id: "hemo",
        level: "low",
        name: "Hemochromatosis (HFE)",
        nameAr: "داء ترسب الأصبغة الدموية (HFE)",
        value: 12,
      },
    ],
    variants: [
      {
        rs: "rs7412",
        gene: "APOE",
        loc: "Chr19:44908822",
        mutation: "Missense (Arg176Cys)",
        mutationAr: "طفرة خاطئة المعنى (Arg176Cys)",
        z: 0.8,
      },
    ],
  },
};

const FINAL_KEY = "genotrack_admin_risk_final";
const MARKERS_KEY = "genotrack_admin_risk_markers";

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

function zTone(z) {
  const a = Math.abs(z);
  if (a >= 3) return "high";
  if (a >= 1) return "medium";
  return "low";
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

const EMPTY_MARKER = {
  rs: "",
  gene: "",
  loc: "",
  mutation: "",
  z: "",
};

export default function RiskPage() {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [finalized, setFinalized] = useState(() => readJson(FINAL_KEY, {}));
  const [extra, setExtra] = useState(() => readJson(MARKERS_KEY, {}));
  const [done, setDone] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_MARKER);
  const [draftError, setDraftError] = useState("");
  const [rapid, setRapid] = useState(false);

  useEffect(() => {
    let alive = true;
    listLabSamples().then((list) => {
      if (!alive) return;
      setSamples(list);
      // Start on a sample that has an analysis, otherwise the first one.
      const first = list.find((s) => ANALYSES[s.id]) || list[0];
      setSubject(first ? first.id : "");
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const current = samples.find((s) => s.id === subject) || null;
  const analysis = current ? ANALYSES[current.id] || null : null;
  const isFinal = Boolean(subject && finalized[subject]);

  const label = (s) => {
    const who = s.subject ? `${s.subject} - ` : "";
    return `${who}${s.id}`;
  };

  const hospitalName = (s) =>
    isAr && s.hospitalAr ? s.hospitalAr : s.hospital;

  // Arabic version of a typed-in name when the page is in Arabic.
  const pick = (en, ar) => (isAr && ar ? ar : en);

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

  // Variants = the analysis variants + the markers added on this page.
  const variants = useMemo(() => {
    if (!analysis) return [];
    return [...analysis.variants, ...(extra[subject] || [])];
  }, [analysis, extra, subject]);

  // Gauge: circle circumference for r = 52
  const C = 2 * Math.PI * 52;
  const dash = useMemo(
    () => (analysis ? (analysis.confidence / 100) * C : 0),
    [analysis, C],
  );

  // The risk the admin set on the Add Sample form, if any.
  const riskLevel = current && current.risk ? current.risk : "";

  function pickSubject(id) {
    setSubject(id);
    setDone("");
    setAdding(false);
    setRapid(false);
    setDraft(EMPTY_MARKER);
    setDraftError("");
  }

  function finalize() {
    if (!analysis || isFinal) return;
    const next = { ...finalized, [subject]: new Date().toISOString() };
    setFinalized(next);
    writeJson(FINAL_KEY, next);
    setDone(t("rk.doneFinal"));
  }

  function saveMarker(e) {
    e.preventDefault();
    const rs = draft.rs.trim();
    const gene = draft.gene.trim();
    const mutation = draft.mutation.trim();
    const z = Number(draft.z);
    if (!rs || !gene || !mutation || draft.z === "" || Number.isNaN(z)) {
      setDraftError(t("rk.markerError"));
      return;
    }
    if (variants.some((v) => v.rs === rs)) {
      setDraftError(t("rk.markerExists"));
      return;
    }
    const next = {
      ...extra,
      [subject]: [
        ...(extra[subject] || []),
        { rs, gene, loc: draft.loc.trim() || "-", mutation, z },
      ],
    };
    setExtra(next);
    writeJson(MARKERS_KEY, next);
    setDraft(EMPTY_MARKER);
    setDraftError("");
    setAdding(false);
    setDone(t("rk.doneMarker"));
  }

  function exportReport() {
    if (!current || !analysis) return;
    const line = (a, b) => `${a}: ${b}`;
    const out = [
      t("rk.rep.title"),
      "=".repeat(48),
      line(
        t("rk.rep.generated"),
        new Date().toLocaleString(isAr ? "ar-EG" : "en-GB"),
      ),
      "",
      `[ ${t("rk.primary")} ]`,
      line(t("rk.rep.sampleId"), current.id),
      line(t("rk.rep.subject"), current.subject || "-"),
      line(t("rk.f.case"), current.caseId || "-"),
      line(t("rk.f.type"), t(`lab.type.${current.type}`)),
      line(t("rk.rep.hospital"), hospitalName(current)),
      line(t("rk.rep.status"), t(`lab.st.${current.status}`)),
      line(
        t("rk.rep.risk"),
        riskLevel ? t(`rk.lvl.${riskLevel}`) : t("af.risk.none"),
      ),
      line(t("rk.confLabel"), `${analysis.confidence}%`),
      "",
      `[ ${t("rk.lineage")} ]`,
      ...analysis.parents.map((p) =>
        line(t(`rk.${p.id}`), `${pick(p.name, p.nameAr)} (${p.match}%)`),
      ),
      "",
      `[ ${t("rk.hereditary")} ]`,
      ...analysis.markers.map((m) =>
        line(
          t(`rk.mk.${m.id}`),
          m.balanced
            ? t("rk.balanced")
            : `${t("rk.paternal")} ${m.paternal}% / ${t("rk.maternal")} ${m.maternal}%`,
        ),
      ),
      "",
      `[ ${t("rk.vectors")} ]`,
      ...analysis.risks.map((r) =>
        line(
          pick(r.name, r.nameAr),
          `${r.value}% (${t(`rk.lvl.${r.level}`)})`,
        ),
      ),
      "",
      `[ ${t("rk.variants")} ]`,
      ...variants.map(
        (v) =>
          `${v.rs} | ${v.gene} | ${v.loc} | ${pick(v.mutation, v.mutationAr)} | z ${
            Number(v.z) > 0 ? "+" : ""
          }${Number(v.z).toFixed(2)}`,
      ),
      "",
      line(t("rk.rep.final"), isFinal ? t("rk.rep.yes") : t("rk.rep.no")),
      "",
      t("rk.rep.note"),
      "",
    ];
    downloadText(`${current.id}-risk-report.txt`, out.join("\n"));
    setDone(t("rk.doneExport"));
  }

  // Rapid diagnostics: a short summary computed from the page data.
  const rapidInfo = useMemo(() => {
    if (!analysis) return null;
    const top = [...analysis.risks].sort((a, b) => b.value - a.value)[0];
    const strong = variants.filter((v) => Math.abs(Number(v.z)) >= 3).length;
    return { top, strong, total: variants.length };
  }, [analysis, variants]);

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("rk.tag")}</span>
          <h1>
            {t("rk.title1")} <span>{t("rk.title2")}</span>
          </h1>
          <p>{t("rk.subtitle")}</p>
        </div>
        <div className="rk-head-actions">
          <button
            type="button"
            className="sf-btn"
            disabled={!analysis}
            onClick={exportReport}
          >
            <Icon name="download" size={16} />
            &nbsp;{t("rk.export")}
          </button>
          <button
            type="button"
            className="sm-add"
            disabled={!analysis || isFinal}
            onClick={finalize}
          >
            <Icon name="check" size={18} />{" "}
            {isFinal ? t("rk.finalized") : t("rk.finalize")}
          </button>
        </div>
      </section>

      {done && (
        <p className="rk-done" role="status">
          {done}
        </p>
      )}

      {/* Subject + lineage */}
      <section className="rk-top">
        <article className="ad-card rk-subject">
          <div className="rk-card-title">
            <span className="rk-ico teal">
              <Icon name="user" size={20} />
            </span>
            <h3>{t("rk.primary")}</h3>
          </div>

          <label className="rk-field">
            <span className="cp-label">{t("rk.target")}</span>
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
            <dl className="rk-facts">
              <div>
                <dt>{t("rk.rep.sampleId")}</dt>
                <dd dir="ltr">{current.id}</dd>
              </div>
              <div>
                <dt>{t("rk.rep.subject")}</dt>
                <dd>{current.subject || "-"}</dd>
              </div>
              <div>
                <dt>{t("rk.f.case")}</dt>
                <dd dir="ltr">{current.caseId || "-"}</dd>
              </div>
              <div>
                <dt>{t("rk.f.type")}</dt>
                <dd>{t(`lab.type.${current.type}`)}</dd>
              </div>
              <div className="wide">
                <dt>{t("rk.rep.hospital")}</dt>
                <dd>{hospitalName(current)}</dd>
              </div>
              <div>
                <dt>{t("rk.rep.status")}</dt>
                <dd>{t(`lab.st.${current.status}`)}</dd>
              </div>
              <div>
                <dt>{t("rk.f.received")}</dt>
                <dd>{dateText(current.receivedAt)}</dd>
              </div>
              <div>
                <dt>{t("rk.f.slot")}</dt>
                <dd dir="ltr">{current.storage}</dd>
              </div>
              <div>
                <dt>{t("rk.f.temp")}</dt>
                <dd dir="ltr">{current.temp} &deg;C</dd>
              </div>
              <div className="wide">
                <dt>{t("rk.rep.risk")}</dt>
                <dd>
                  {riskLevel ? (
                    <span className={`rk-level ${riskLevel}`}>
                      {t(`rk.lvl.${riskLevel}`)}
                    </span>
                  ) : (
                    t("af.risk.none")
                  )}
                </dd>
              </div>
            </dl>
          )}

          <div className="rk-seq">
            <div>
              <span className="cp-label">{t("rk.seqStatus")}</span>
              <b>{t("rk.wgs")}</b>
            </div>
            {analysis ? (
              <em>
                <i /> {t("rk.complete")}
              </em>
            ) : (
              <em className="rk-wait">
                <i /> {t("rk.waiting")}
              </em>
            )}
          </div>

          <p className="rk-hint">{t("rk.f.hint")}</p>
        </article>

        {analysis ? (
          <article className="ad-card rk-lineage">
            <div className="rk-card-title">
              <span className="rk-ico blue">
                <Icon name="people" size={20} />
              </span>
              <h3>{t("rk.lineage")}</h3>
              <em className="rk-sync">
                <i /> {t("rk.sync")}
              </em>
            </div>

            <div className="rk-parents">
              {analysis.parents.map((p) => (
                <div key={p.id} className="rk-parent">
                  <span
                    className={`rk-ico ${p.id === "paternal" ? "blue" : "violet"}`}
                  >
                    <Icon name="user" size={20} />
                  </span>
                  <div>
                    <small>{t(`rk.${p.id}`)}</small>
                    <b>{pick(p.name, p.nameAr)}</b>
                  </div>
                  <div className="rk-match" dir="ltr">
                    <strong>{p.match}%</strong>
                    <span>{t("rk.matchConfirmed")}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : (
          <article className="ad-card rk-lineage rk-empty">
            <span className="rk-ico teal">
              <Icon name="dna" size={22} />
            </span>
            <h3>{t("hr.emptyTitle")}</h3>
            <p>{loading ? t("hr.loading") : t("hr.emptyText")}</p>
          </article>
        )}
      </section>

      {analysis && (
        <>
          {/* Confidence + hereditary markers */}
          <section className="rk-mid">
            <article className="ad-card rk-conf">
              <div className="rk-gauge">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="52" className="rk-g-bg" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="rk-g-fg"
                    strokeDasharray={`${dash} ${C}`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <strong dir="ltr">
                  {analysis.confidence}
                  <small>%</small>
                </strong>
              </div>
              <span className="cp-label">{t("rk.confLabel")}</span>
              <p>{t("rk.confText")}</p>
            </article>

            <article className="ad-card rk-markers">
              <div className="rk-card-title">
                <span className="rk-ico teal">
                  <Icon name="chart" size={20} />
                </span>
                <h3>{t("rk.hereditary")}</h3>
              </div>

              <div className="rk-marker-list">
                {analysis.markers.map((m) => (
                  <div key={m.id} className="rk-marker">
                    <div className="rk-marker-head">
                      <b>{t(`rk.mk.${m.id}`)}</b>
                      <span>
                        {m.balanced
                          ? t("rk.balanced")
                          : `${t("rk.paternal")} (${m.paternal}%) / ${t("rk.maternal")} (${m.maternal}%)`}
                      </span>
                    </div>
                    <div className="rk-split" dir="ltr">
                      <i className="p" style={{ width: `${m.paternal}%` }} />
                      <i className="m" style={{ width: `${m.maternal}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rk-split-legend">
                <span>
                  <i className="p" /> {t("rk.paternal")}
                </span>
                <span>
                  <i className="m" /> {t("rk.maternal")}
                </span>
              </div>
            </article>
          </section>

          {/* Risk vectors */}
          <section className="rk-block">
            <h2 className="rk-h2">{t("rk.vectors")}</h2>
            <div className="rk-risks">
              {analysis.risks.map((r) => (
                <article key={r.id} className={`ad-card rk-risk ${r.level}`}>
                  <header>
                    <span className={`rk-level ${r.level}`}>
                      {r.level === "high" && <Icon name="alert" size={14} />}{" "}
                      {t(`rk.lvl.${r.level}`)}
                    </span>
                    {r.level === "high" && (
                      <small className="rk-priority">{t("rk.priority")}</small>
                    )}
                  </header>

                  <h3>{pick(r.name, r.nameAr)}</h3>
                  <strong className="rk-pct" dir="ltr">
                    {String(r.value).padStart(2, "0")}
                    <small>%</small>
                  </strong>
                  <div className="rk-bar" dir="ltr">
                    <i style={{ width: `${r.value}%` }} />
                  </div>

                  <p>{t(`rk.rk.${r.id}`)}</p>

                  {r.chr && (
                    <footer dir="ltr">
                      <span>CHR {r.chr}</span>
                      <span>LOC: {r.loc}</span>
                    </footer>
                  )}
                </article>
              ))}
            </div>
          </section>

          {/* Variants */}
          <section className="ad-card rk-variants">
            <div className="rk-variants-head">
              <h3>{t("rk.variants")}</h3>
              <button
                type="button"
                className="sf-btn"
                aria-expanded={adding}
                onClick={() => {
                  setAdding((a) => !a);
                  setDraftError("");
                }}
              >
                {adding ? t("rk.cancelMarker") : `+ ${t("rk.addMarker")}`}
              </button>
            </div>

            {adding && (
              <form className="rk-add" onSubmit={saveMarker} noValidate>
                <input
                  className="sf-input"
                  dir="ltr"
                  placeholder="rs0000000"
                  value={draft.rs}
                  onChange={(e) => setDraft({ ...draft, rs: e.target.value })}
                  aria-label={t("rk.col.id")}
                />
                <input
                  className="sf-input"
                  dir="ltr"
                  placeholder="BRCA1"
                  value={draft.gene}
                  onChange={(e) =>
                    setDraft({ ...draft, gene: e.target.value })
                  }
                  aria-label={t("rk.col.gene")}
                />
                <input
                  className="sf-input"
                  dir="ltr"
                  placeholder="Chr17:43044295"
                  value={draft.loc}
                  onChange={(e) => setDraft({ ...draft, loc: e.target.value })}
                  aria-label={t("rk.markerLoc")}
                />
                <input
                  className="sf-input"
                  placeholder={isAr ? "طفرة خاطئة المعنى (C282Y)" : "Missense (C282Y)"}
                  value={draft.mutation}
                  onChange={(e) =>
                    setDraft({ ...draft, mutation: e.target.value })
                  }
                  aria-label={t("rk.col.mutation")}
                />
                <input
                  className="sf-input"
                  dir="ltr"
                  type="number"
                  step="0.01"
                  placeholder="z-score"
                  value={draft.z}
                  onChange={(e) => setDraft({ ...draft, z: e.target.value })}
                  aria-label={t("rk.col.z")}
                />
                <button type="submit" className="sm-add">
                  {t("rk.saveMarker")}
                </button>
                {draftError && (
                  <p className="rk-add-error" role="alert">
                    {draftError}
                  </p>
                )}
              </form>
            )}

            <div className="ad-table-wrap">
              <table className="ad-table rk-table">
                <thead>
                  <tr>
                    <th>{t("rk.col.id")}</th>
                    <th>{t("rk.col.gene")}</th>
                    <th>{t("rk.col.mutation")}</th>
                    <th>{t("rk.col.z")}</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.rs}>
                      <td dir="ltr">
                        <code className="rk-rs">{v.rs}</code>
                      </td>
                      <td dir="ltr">
                        <b>{v.gene}</b>
                        <small className="rk-loc">/ {v.loc}</small>
                      </td>
                      <td>{pick(v.mutation, v.mutationAr)}</td>
                      <td dir="ltr">
                        <span className={`rk-z ${zTone(v.z)}`}>
                          {Number(v.z) > 0 ? "+" : ""}
                          {Number(v.z).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Rapid diagnostics */}
          <button
            type="button"
            className="rk-rapid"
            aria-expanded={rapid}
            onClick={() => setRapid((r) => !r)}
          >
            <Icon name="bolt" size={18} /> {t("rk.rapid")}
          </button>

          {rapid && rapidInfo && (
            <section className="ad-card rk-rapid-box" role="status">
              <h3>{t("rk.rapidTitle")}</h3>
              <ul>
                <li>
                  {t("rk.rapidTop")}:{" "}
                  <b>{pick(rapidInfo.top.name, rapidInfo.top.nameAr)}</b> (
                  <span dir="ltr">{rapidInfo.top.value}%</span>)
                </li>
                <li>
                  {t("rk.rapidStrong")}:{" "}
                  <b dir="ltr">
                    {rapidInfo.strong} / {rapidInfo.total}
                  </b>
                </li>
                <li>
                  {t("rk.rapidConf")}:{" "}
                  <b dir="ltr">{analysis.confidence}%</b>
                </li>
              </ul>
            </section>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
