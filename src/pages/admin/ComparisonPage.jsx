import { useMemo, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/LanguageContext";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";

// ---- Demo data: replace with API calls later ----
const MATCH = 99.8;
const CONFIDENCE = "0.9997";
const PVALUE = "< 0.0001";

const ALLELES = [
  { locus: "A", value: 92 },
  { locus: "B", value: 100 },
  { locus: "C", value: 100 },
];

const SPECIMEN_A = {
  tone: "teal",
  icon: "flask",
  name: "Alpha",
  id: "GT-99283-X",
  source: "postmortem",
  time: "2023.10.24 // 08:42:11",
  seq: "A-C-G-T",
};

const SPECIMEN_B = {
  tone: "blue",
  icon: "user",
  name: "Omega",
  id: "REF-S-7721",
  database: "CODIS-Sentinel",
  subject: "Doe, Jonathan (Restricted)",
  seq: "A-T-G-C",
};

// Two aligned loci. In `b`, the 1 marks a mismatch at that position.
const LOCI = [
  {
    id: "LOC-01",
    a: ["A", "T", "G", "G", "C", "A", "T", "G", "G", "A", "C", "C", "T"],
    b: ["A", "T", "G", "G", "C", "A", "T", "G", "G", "A", "C", "C", "T"],
  },
  {
    id: "LOC-02",
    a: ["C", "G", "T", "A", "A", "G", "G", "C", "T", "A", "G", "G", "C"],
    b: ["C", "G", "T", "A", "T", "G", "G", "C", "T", "A", "G", "G", "C"],
  },
];

function cellState(a, b) {
  if (a === b) return "full";
  return "mut";
}

export default function ComparisonPage() {
  const { t } = useLanguage();
  const [heat, setHeat] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [signed, setSigned] = useState(false);

  const stats = useMemo(() => {
    let total = 0;
    let match = 0;
    LOCI.forEach((l) =>
      l.a.forEach((base, i) => {
        total += 1;
        if (cellState(base, l.b[i]) === "full") match += 1;
      }),
    );
    return { total, match, mismatch: total - match };
  }, []);

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag cp-engine">
            <i /> {t("cp.engine")}
          </span>
          <h1>
            {t("cp.title1")} <span>{t("cp.title2")}</span>
          </h1>
          <p>{t("cp.subtitle")}</p>
        </div>

        <article className="cp-prob" aria-label={t("cp.prob")}>
          <span className="cp-label">{t("cp.prob")}</span>
          <strong dir="ltr">
            {MATCH}
            <small>%</small>
          </strong>
          <em className="cp-verified">
            <Icon name="shield" size={14} /> {t("cp.verifiedMatch")}
          </em>
        </article>
      </section>

      {/* Specimens + score */}
      <section className="cp-grid">
        {/* Specimen Alpha */}
        <article className="ad-card cp-spec">
          <header className="cp-spec-head">
            <span className={`cp-spec-ico ${SPECIMEN_A.tone}`}>
              <Icon name={SPECIMEN_A.icon} size={22} />
            </span>
            <div>
              <small>{t("cp.specimen")}</small>
              <h3>{SPECIMEN_A.name}</h3>
              <code dir="ltr">{SPECIMEN_A.id}</code>
            </div>
            <Icon name="check" size={22} className="cp-ok" />
          </header>

          <dl className="cp-facts">
            <div>
              <dt>{t("cp.source")}</dt>
              <dd>{t(`cp.src.${SPECIMEN_A.source}`)}</dd>
            </div>
            <div>
              <dt>{t("cp.timestamp")}</dt>
              <dd dir="ltr">{SPECIMEN_A.time}</dd>
            </div>
          </dl>

          <div className="cp-seq" dir="ltr">
            <b>{SPECIMEN_A.seq}</b>
            <span>STR-L3</span>
            <em>{t("cp.stable")}</em>
          </div>
        </article>

        {/* Sentinel score */}
        <article className="ad-card cp-score">
          <span className="cp-score-ico">
            <Icon name="shield" size={22} />
          </span>
          <small className="cp-label">{t("cp.sentinel")}</small>
          <h3>{t("cp.confidence")}</h3>
          <strong dir="ltr">{CONFIDENCE}</strong>
          <p dir="ltr">
            {t("cp.pvalue")}: <b>{PVALUE}</b>
          </p>

          <div className="cp-alleles">
            <span className="cp-label">{t("cp.alleles")}</span>
            {ALLELES.map((a) => (
              <div key={a.locus} className="cp-allele">
                <span>
                  {t("cp.locus")} {a.locus}
                </span>
                <div className="cp-bar">
                  <i style={{ width: `${a.value}%` }} />
                </div>
                <b dir="ltr">{a.value}%</b>
              </div>
            ))}
          </div>
        </article>

        {/* Reference Omega */}
        <article className="ad-card cp-spec">
          <header className="cp-spec-head">
            <span className={`cp-spec-ico ${SPECIMEN_B.tone}`}>
              <Icon name={SPECIMEN_B.icon} size={22} />
            </span>
            <div>
              <small>{t("cp.reference")}</small>
              <h3>{SPECIMEN_B.name}</h3>
              <code dir="ltr">{SPECIMEN_B.id}</code>
            </div>
            <Icon name="check" size={22} className="cp-ok" />
          </header>

          <dl className="cp-facts">
            <div>
              <dt>{t("cp.database")}</dt>
              <dd dir="ltr">{SPECIMEN_B.database}</dd>
            </div>
            <div>
              <dt>{t("cp.subject")}</dt>
              <dd>{SPECIMEN_B.subject}</dd>
            </div>
          </dl>

          <div className="cp-seq" dir="ltr">
            <b>{SPECIMEN_B.seq}</b>
            <span>STR-L3</span>
            <em>{t("cp.stable")}</em>
          </div>
        </article>
      </section>

      {/* Alignment */}
      <section className="ad-card cp-align">
        <div className="cp-align-head">
          <div>
            <h3>{t("cp.alignment")}</h3>
            <p>{t("cp.alignText")}</p>
          </div>
          <div className="cp-align-actions">
            <button type="button" className="sf-btn">
              <Icon name="download" size={16} />
              &nbsp;{t("cp.export")}
            </button>
            <button
              type="button"
              className={`sf-btn${heat ? " cp-on" : ""}`}
              aria-pressed={heat}
              onClick={() => setHeat((h) => !h)}
            >
              {t("cp.heatmap")}
            </button>
          </div>
        </div>

        <div className={`cp-loci${heat ? " heat" : ""}`} dir="ltr">
          {LOCI.map((l) => (
            <div key={l.id} className="cp-locus">
              <span className="cp-locus-id">{l.id}</span>
              <div className="cp-bases">
                {l.a.map((base, i) => (
                  <span
                    key={i}
                    className={`cp-base ${cellState(base, l.b[i])}`}
                    title={`${base} / ${l.b[i]}`}
                  >
                    {heat ? "" : base}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="cp-legend">
          <span>
            <i className="full" /> {t("cp.lg.full")} ({stats.match})
          </span>
          <span>
            <i className="mut" /> {t("cp.lg.mut")} ({stats.mismatch})
          </span>
          <span>
            <i className="inc" /> {t("cp.lg.inc")} (0)
          </span>
        </div>
      </section>

      {/* Verdict */}
      <section className="ad-card cp-verdict">
        <div className="cp-verdict-text">
          <span className="cp-label">{t("cp.autoVerdict")}</span>
          <strong>
            <Icon name="shield" size={24} /> {t("cp.positive")}
          </strong>
          {flagged && <em className="cp-flagged">{t("cp.flagged")}</em>}
          {signed && <em className="cp-signed">{t("cp.signed")}</em>}
        </div>

        <div className="cp-verdict-actions">
          <button
            type="button"
            className="sf-btn"
            onClick={() => setFlagged((f) => !f)}
            aria-pressed={flagged}
          >
            {t("cp.flag")}
          </button>
          <button type="button" className="sf-btn">
            {t("cp.report")}
          </button>
          <button
            type="button"
            className="sf-btn primary"
            disabled={signed}
            onClick={() => setSigned(true)}
          >
            {t("cp.sign")}
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}
