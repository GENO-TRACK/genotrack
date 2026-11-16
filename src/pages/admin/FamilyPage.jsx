import { useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/LanguageContext";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";
import "./FamilyPage.css";

// ---- Demo data: replace with API calls later ----
const PARENTS = [
  {
    id: "paternal",
    link: "P-102",
    name: "Marcus Vance",
    sample: "GT-ALPHA-09",
    match: "99.98",
  },
  {
    id: "maternal",
    link: "M-304",
    name: "Elena Vance",
    sample: "GT-BETA-12",
    match: "99.99",
  },
];

const CHILD = {
  id: "GT-GAMMA-01",
  name: "Julian Vance",
};

const CONSISTENCY = {
  paternal: 48.2,
  maternal: 51.8,
  mutation: "0.002%",
};

const SAMPLES = [
  {
    id: "DNA-V-99",
    type: "buccal",
    side: "paternal",
    status: "verified",
    icon: "flask",
  },
  {
    id: "DNA-M-42",
    type: "blood",
    side: "maternal",
    status: "verified",
    icon: "flask",
  },
];

const FOOTER = {
  date: "24 OCT 2023 | 14:22 GMT",
  analyst: "SENTINEL-77-DELTA",
};

export default function FamilyPage() {
  const { t } = useLanguage();
  const [exported, setExported] = useState(false);

  function exportPedigree() {
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
        <button type="button" className="sm-add" onClick={exportPedigree}>
          <Icon name="download" size={18} />{" "}
          {exported ? t("fm.exported") : t("fm.export")}
        </button>
      </section>

      {/* Pedigree */}
      <section className="ad-card fm-tree">
        <div className="fm-parents">
          {PARENTS.map((p) => (
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
              <h3>{p.name}</h3>
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
            {t("fm.subject")}: <b dir="ltr">{CHILD.id}</b>
          </small>
          <h2>{CHILD.name}</h2>
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
              <b dir="ltr">{CONSISTENCY.paternal}%</b>
            </div>
            <div className="fm-snp-row">
              <span>{t("fm.snpMaternal")}</span>
              <b dir="ltr">{CONSISTENCY.maternal}%</b>
            </div>

            <div className="fm-split" dir="ltr">
              <i className="p" style={{ width: `${CONSISTENCY.paternal}%` }} />
              <i className="m" style={{ width: `${CONSISTENCY.maternal}%` }} />
            </div>
          </div>

          <div className="fm-mutation">
            <span>{t("fm.mutation")}</span>
            <strong dir="ltr">{CONSISTENCY.mutation}</strong>
          </div>
        </article>

        <article className="ad-card fm-forensic">
          <div className="fm-card-title">
            <span className="fm-ico-sm">
              <Icon name="flask" size={20} />
            </span>
            <h3>{t("fm.forensic")}</h3>
            <strong className="fm-count" dir="ltr">
              {SAMPLES.length + 1}
            </strong>
          </div>
          <p>{t("fm.forensicText")}</p>

          <ul className="fm-samples">
            {SAMPLES.map((s) => (
              <li key={s.id}>
                <span className="fm-ico-sm">
                  <Icon name={s.icon} size={18} />
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

            <li className="pending">
              <span className="fm-ico-sm">
                <Icon name="upload" size={18} />
              </span>
              <div>
                <b>{t("fm.attach")}</b>
              </div>
              <em className="fm-status pending">{t("fm.st.pending")}</em>
            </li>
          </ul>

          <button type="button" className="sf-btn fm-attach">
            + {t("fm.attachNew")}
          </button>
        </article>
      </section>

      {/* Footer */}
      <footer className="ad-card fm-foot">
        <div>
          <span className="cp-label">{t("fm.lastAnalysis")}</span>
          <b dir="ltr">{FOOTER.date}</b>
        </div>
        <div>
          <span className="cp-label">{t("fm.analystId")}</span>
          <b dir="ltr">{FOOTER.analyst}</b>
        </div>
        <div>
          <span className="cp-label">{t("fm.caseStatus")}</span>
          <b className="fm-closed">{t("fm.closed")}</b>
        </div>
        <em className="fm-enc">
          <Icon name="lock" size={14} /> {t("fm.encrypted")}
        </em>
      </footer>
    </DashboardLayout>
  );
}
