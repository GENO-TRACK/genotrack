import { useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/LanguageContext";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";
import "./ReportsPage.css";

// ---- Demo data: replace with API calls later ----
const REPORT_ID = "GR-9942-B";

const CHILD = {
  name: "Liam H. Vance",
  id: "883-9201-CV",
  age: "4 Years, 2 Months",
  phenotype: "Caucasian / Nordic",
  blood: "A Positive",
  sampleDate: "Oct 24, 2023",
};

const PARENTS = [
  { id: "maternal", name: "Sarah Vance", finding: "carrier", match: 88 },
  { id: "paternal", name: "Marcus Vance", finding: "clear", match: 94 },
];

const RISK = {
  score: 7.2,
  level: "high",
  items: [
    { id: "cardio", level: "high", value: "elevated" },
    { id: "metabolic", level: "low", value: "normal" },
    { id: "neuro", level: "low", value: "lowRisk" },
  ],
};

const RECOMMENDATIONS = [
  { id: "screening", icon: "calendar" },
  { id: "metabolic", icon: "monitor" },
  { id: "dietary", icon: "food" },
];

const SECURITY = {
  protocol: "L6",
  encryption: "AES-256-GCM",
  hash: "8f92-c8e1-d55a-4402",
};

export default function ReportsPage() {
  const { t } = useLanguage();
  const [shared, setShared] = useState(false);

  // Risk gauge: circle of r = 52
  const C = 2 * Math.PI * 52;
  const dash = (RISK.score / 10) * C;

  function share() {
    setShared(true);
    setTimeout(() => setShared(false), 1800);
  }

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag rp-valid">
            <Icon name="shield" size={14} /> {t("rp.validated")}
          </span>
          <h1>
            {t("rp.title1")} <span dir="ltr">{REPORT_ID}</span>
          </h1>
          <p>{t("rp.subtitle")}</p>
        </div>
        <div className="rp-head-actions">
          <button type="button" className="sf-btn" onClick={share}>
            <Icon name="share" size={16} />
            &nbsp;
            {shared ? t("rp.shared") : t("rp.share")}
          </button>
          <button type="button" className="sm-add">
            <Icon name="pdf" size={18} /> {t("rp.exportPdf")}
          </button>
        </div>
      </section>

      {/* Child + parents */}
      <section className="rp-top">
        <article className="ad-card rp-child">
          <div className="rp-card-title">
            <span className="rp-ico teal">
              <Icon name="child" size={22} />
            </span>
            <div>
              <small>{t("rp.childProfile")}</small>
              <h3 dir="ltr">{CHILD.name}</h3>
            </div>
          </div>
          <span className="rp-tag">{t("rp.primarySubject")}</span>

          <dl className="rp-facts">
            <div>
              <dt>ID</dt>
              <dd dir="ltr">{CHILD.id}</dd>
            </div>
            <div>
              <dt>{t("rp.age")}</dt>
              <dd dir="ltr">{CHILD.age}</dd>
            </div>
            <div>
              <dt>{t("rp.phenotype")}</dt>
              <dd dir="ltr">{CHILD.phenotype}</dd>
            </div>
            <div>
              <dt>{t("rp.blood")}</dt>
              <dd dir="ltr">{CHILD.blood}</dd>
            </div>
            <div>
              <dt>{t("rp.sampleDate")}</dt>
              <dd dir="ltr">{CHILD.sampleDate}</dd>
            </div>
          </dl>
        </article>

        <article className="ad-card rp-parents">
          <div className="rp-card-title">
            <span className="rp-ico blue">
              <Icon name="people" size={22} />
            </span>
            <h3>{t("rp.parental")}</h3>
          </div>

          <div className="rp-parent-list">
            {PARENTS.map((p) => (
              <div key={p.id} className={`rp-parent ${p.id}`}>
                <span className="rp-ico-sm">
                  <Icon name="user" size={20} />
                </span>
                <div>
                  <small>{t(`rp.${p.id}`)}</small>
                  <b dir="ltr">{p.name}</b>
                  <p className={p.finding}>{t(`rp.finding.${p.finding}`)}</p>
                </div>
                <div className="rp-pmatch" dir="ltr">
                  <strong>{p.match}%</strong>
                  <span>{t("rp.match")}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Risk summary */}
      <section className="ad-card rp-risk">
        <div className="rp-risk-head">
          <div>
            <h3>{t("rp.riskSummary")}</h3>
            <p>{t("rp.gwas")}</p>
          </div>
        </div>

        <div className="rp-risk-body">
          <div className="rp-gauge-wrap">
            <div className="rp-gauge">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="52" className="rp-g-bg" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="rp-g-fg"
                  strokeDasharray={`${dash} ${C}`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <strong dir="ltr">
                {RISK.score}
                <small>/10</small>
              </strong>
            </div>
            <span className={`rp-level ${RISK.level}`}>{t("rp.lvl.high")}</span>
          </div>

          <ul className="rp-risk-list">
            {RISK.items.map((r) => (
              <li key={r.id} className={r.level}>
                <b>{t(`rp.ri.${r.id}`)}</b>
                <span>{t(`rp.rv.${r.value}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Variant + mutation flag */}
      <section className="rp-flags">
        <article className="ad-card rp-flag">
          <div className="rp-card-title">
            <span className="rp-ico teal">
              <Icon name="dna" size={20} />
            </span>
            <div>
              <small>{t("rp.allelic")}</small>
              <h3 dir="ltr">CHRM2 (rs17929)</h3>
            </div>
          </div>
          <p>{t("rp.chrm2")}</p>
        </article>

        <article className="ad-card rp-flag warn">
          <div className="rp-card-title">
            <span className="rp-ico amber">
              <Icon name="alert" size={20} />
            </span>
            <div>
              <small>{t("rp.mutationFlag")}</small>
              <h3 dir="ltr">MTHFR C677T</h3>
            </div>
          </div>
          <p>{t("rp.mthfr")}</p>
        </article>
      </section>

      {/* Recommendations */}
      <section className="rp-block">
        <div className="rp-recs-head">
          <div>
            <h2 className="rp-h2">{t("rp.recs")}</h2>
            <p>{t("rp.recsSub")}</p>
          </div>
          <em className="rp-peer">
            <Icon name="check" size={14} /> {t("rp.peer")}
          </em>
        </div>

        <div className="rp-recs">
          {RECOMMENDATIONS.map((r) => (
            <article key={r.id} className="ad-card rp-rec">
              <span className="rp-ico teal">
                <Icon name={r.icon} size={20} />
              </span>
              <h3>{t(`rp.rec.${r.id}.title`)}</h3>
              <p>{t(`rp.rec.${r.id}.text`)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="ad-card rp-foot">
        <div>
          <span className="cp-label">{t("rp.secProtocol")}</span>
          <b dir="ltr">{SECURITY.protocol}</b>
        </div>
        <div>
          <span className="cp-label">{t("rp.encryption")}</span>
          <b dir="ltr">{SECURITY.encryption}</b>
        </div>
        <div>
          <span className="cp-label">{t("rp.hash")}</span>
          <b dir="ltr">{SECURITY.hash}</b>
        </div>
        <p>{t("rp.copyright")}</p>
      </footer>
    </DashboardLayout>
  );
}
