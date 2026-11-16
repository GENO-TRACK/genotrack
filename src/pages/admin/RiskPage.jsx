import { useMemo, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/LanguageContext";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./RiskPage.css";

// ---- Demo data: replace with API calls later ----
const SUBJECTS = [
  { id: "baby", label: "Baby Doe #99281 (NICU-A)" },
  { id: "forensic", label: "Sample #88273 - Forensic" },
  { id: "clinical", label: "Subject #10022 - Clinical" },
];

const PARENTS = [
  { id: "paternal", icon: "user", name: "John Doe #11029", match: "99.9" },
  { id: "maternal", icon: "user", name: "Jane Doe #11030", match: "99.9" },
];

const CONFIDENCE = 85;

// paternal / maternal shares per marker. Balanced = 50 / 50.
const MARKERS = [
  { id: "snv", name: "SNV-2291 Cluster", paternal: 62, maternal: 38 },
  { id: "mito", name: "Mitochondrial DNA Ref-X", paternal: 5, maternal: 95 },
  {
    id: "k4",
    name: "Allele Variant-K4",
    paternal: 50,
    maternal: 50,
    balanced: true,
  },
];

const RISKS = [
  {
    id: "cardio",
    level: "high",
    name: "Cardiomyopathy (TTN Gene)",
    value: 92,
    chr: "2",
    loc: "178,525,989",
  },
  {
    id: "metabolic",
    level: "medium",
    name: "Metabolic Deficiency (ASL)",
    value: 44,
  },
  { id: "hemo", level: "low", name: "Hemochromatosis (HFE)", value: 8 },
];

const VARIANTS = [
  {
    rs: "rs121913527",
    gene: "BRCA1",
    loc: "Chr17:43044295",
    mutation: "Nonsense (p.Glu23Ter)",
    z: 1.22,
  },
  {
    rs: "rs1800562",
    gene: "HFE",
    loc: "Chr6:26093141",
    mutation: "Missense (C282Y)",
    z: 4.89,
  },
  {
    rs: "rs7412",
    gene: "APOE",
    loc: "Chr19:44908822",
    mutation: "Missense (Arg176Cys)",
    z: -0.44,
  },
];

function zTone(z) {
  const a = Math.abs(z);
  if (a >= 3) return "high";
  if (a >= 1) return "medium";
  return "low";
}

export default function RiskPage() {
  const { t } = useLanguage();
  const [subject, setSubject] = useState(SUBJECTS[0].id);
  const [finalized, setFinalized] = useState(false);

  // Gauge: circle circumference for r = 52
  const C = 2 * Math.PI * 52;
  const dash = useMemo(() => (CONFIDENCE / 100) * C, [C]);

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
          <button type="button" className="sf-btn">
            <Icon name="download" size={16} />
            &nbsp;{t("rk.export")}
          </button>
          <button
            type="button"
            className="sm-add"
            disabled={finalized}
            onClick={() => setFinalized(true)}
          >
            <Icon name="check" size={18} />{" "}
            {finalized ? t("rk.finalized") : t("rk.finalize")}
          </button>
        </div>
      </section>

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
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rk-seq">
            <div>
              <span className="cp-label">{t("rk.seqStatus")}</span>
              <b>{t("rk.wgs")}</b>
            </div>
            <em>
              <i /> {t("rk.complete")}
            </em>
          </div>
        </article>

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
            {PARENTS.map((p) => (
              <div key={p.id} className="rk-parent">
                <span
                  className={`rk-ico ${p.id === "paternal" ? "blue" : "violet"}`}
                >
                  <Icon name={p.icon} size={20} />
                </span>
                <div>
                  <small>{t(`rk.${p.id}`)}</small>
                  <b>{p.name}</b>
                </div>
                <div className="rk-match" dir="ltr">
                  <strong>{p.match}%</strong>
                  <span>{t("rk.matchConfirmed")}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

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
              {CONFIDENCE}
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
            {MARKERS.map((m) => (
              <div key={m.id} className="rk-marker">
                <div className="rk-marker-head">
                  <b>{t(`rk.mk.${m.id}`)}</b>
                  <span dir="ltr">
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
          {RISKS.map((r) => (
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

              <h3>{r.name}</h3>
              <strong className="rk-pct" dir="ltr">
                {String(r.value).padStart(2, "0")}
                <small>%</small>
              </strong>
              <div className="rk-bar">
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
          <button type="button" className="sf-btn">
            + {t("rk.addMarker")}
          </button>
        </div>

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
              {VARIANTS.map((v) => (
                <tr key={v.rs}>
                  <td dir="ltr">
                    <code className="rk-rs">{v.rs}</code>
                  </td>
                  <td dir="ltr">
                    <b>{v.gene}</b>
                    <small className="rk-loc">/ {v.loc}</small>
                  </td>
                  <td dir="ltr">{v.mutation}</td>
                  <td dir="ltr">
                    <span className={`rk-z ${zTone(v.z)}`}>
                      {v.z > 0 ? "+" : ""}
                      {v.z.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rapid diagnostics */}
      <button type="button" className="rk-rapid">
        <Icon name="bolt" size={18} /> {t("rk.rapid")}
      </button>
    </DashboardLayout>
  );
}
