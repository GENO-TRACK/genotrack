import { useEffect, useMemo, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { listLabSamples } from "../../auth/lab";
import { openReportPdf } from "./reportPdf";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";
import "./RiskPage.css";
import "./ReportsPage.css";

// The admin Genetic Report page reads the real lab samples.
//
// Real data (from src/auth/lab.js):
//   - the list of subjects to choose from (one per lab sample)
//   - the subject name, sample ID, case ID, hospital, specimen type,
//     received date, lab status and the risk level the admin chose
//
// Demo analysis data (the demo has no genetic analysis engine):
//   - the report ID, parents, risk score, variants and recommendations exist
//     for the two samples listed in REPORTS below (the same two samples that
//     have a risk analysis and a kinship result). Any other sample shows
//     "waiting for analysis". The backend will return the real report.
//
// Every typed-in text has an Arabic version (...Ar), so the whole page
// switches language, not only the labels.
//
// Icons: only names that exist in DashboardLayout's icon set are used here.
// (The old names "child", "monitor", "food" and "pdf" do not exist there,
// which is why those icons were empty.)

const REPORTS = {
  "GT-99281-X": {
    reportId: "GR-99281-A",
    score: 8.1,
    level: "high",
    parents: [
      {
        id: "maternal",
        name: "Jane Doe #11030",
        nameAr: "جين دو #11030",
        finding: "carrier",
        match: 99.9,
      },
      {
        id: "paternal",
        name: "John Doe #11029",
        nameAr: "جون دو #11029",
        finding: "clear",
        match: 99.9,
      },
    ],
    items: [
      { id: "cardio", level: "high", value: "elevated" },
      { id: "metabolic", level: "low", value: "normal" },
      { id: "neuro", level: "low", value: "lowRisk" },
    ],
    variant: { gene: "TTN", ref: "rs72648898", textKey: "ttn" },
    flag: { gene: "MTHFR C677T", textKey: "mthfr" },
    recs: [
      { id: "screening", icon: "clock" },
      { id: "metabolic", icon: "chart" },
      { id: "dietary", icon: "heart" },
    ],
  },
  "GT-00129-Z": {
    reportId: "GR-00129-B",
    score: 5.4,
    level: "medium",
    parents: [
      {
        id: "maternal",
        name: "Lina Roe #20419",
        nameAr: "لينا رو #20419",
        finding: "carrier",
        match: 99.9,
      },
      {
        id: "paternal",
        name: "Adam Roe #20418",
        nameAr: "آدم رو #20418",
        finding: "clear",
        match: 99.8,
      },
    ],
    items: [
      { id: "cardio", level: "low", value: "normal" },
      { id: "metabolic", level: "medium", value: "carrier" },
      { id: "neuro", level: "low", value: "lowRisk" },
    ],
    variant: { gene: "ASL", ref: "rs1801181", textKey: "asl" },
    flag: { gene: "MTHFR C677T", textKey: "mthfr" },
    recs: [
      { id: "metabolic", icon: "chart" },
      { id: "dietary", icon: "heart" },
      { id: "screening", icon: "clock" },
    ],
  },
};

const SECURITY = {
  protocol: "L6",
  encryption: "AES-256-GCM",
  hash: "8f92-c8e1-d55a-4402",
};

export default function ReportsPage() {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [shared, setShared] = useState(false);
  const [exported, setExported] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let alive = true;
    listLabSamples().then((list) => {
      if (!alive) return;
      setSamples(list);
      // Start on a sample that has a report, otherwise the first one.
      const first = list.find((s) => REPORTS[s.id]) || list[0];
      setSubject(first ? first.id : "");
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const current = samples.find((s) => s.id === subject) || null;
  const report = current ? REPORTS[current.id] || null : null;

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

  const riskText = (s) =>
    s.risk ? t(`sm.risk.${s.risk}`) : t("rk.notAssessed");

  // Risk gauge: circle of r = 52
  const C = 2 * Math.PI * 52;
  const score = report ? report.score : 0;
  const dash = (score / 10) * C;

  const carrierParent = useMemo(
    () => (report ? report.parents.find((p) => p.finding === "carrier") : null),
    [report],
  );

  function share() {
    if (!report) return;
    const link = `${window.location.origin}/admin/reports?sample=${current.id}`;
    const done = () => {
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(done, done);
    } else {
      done();
    }
  }

  // Opens the designed report in a new window; "Save as PDF" in the print
  // dialog gives the PDF file.
  function exportReport() {
    if (!current || !report) return;

    const data = {
      isAr,
      logoUrl: `${window.location.origin}/images/logo/secondary-logo.png`,
      labels: {
        validated: t("rp.validated"),
        title: t("rp.title1"),
        subtitle: t("rp.subtitle"),
        generated: t("rp.rep.generated"),
        childProfile: t("rp.childProfile"),
        parental: t("rp.parental"),
        riskSummary: t("rp.riskSummary"),
        recs: t("rp.recs"),
        recsSub: t("rp.recsSub"),
        save: t("rp.pdf.save"),
        close: t("rp.pdf.close"),
      },
      report: {
        id: report.reportId,
        generated: new Date().toLocaleString(isAr ? "ar-EG" : "en-GB"),
        score: report.score,
        level: report.level,
        levelText: t(`rp.lvl.${report.level}`),
      },
      child: [
        { k: t("rp.rep.name"), v: current.subject || "-" },
        { k: t("rp.rep.sample"), v: current.id },
        { k: t("rp.rep.case"), v: current.caseId || "-" },
        { k: t("rp.rep.hospital"), v: hospitalName(current) },
        { k: t("rp.sampleType"), v: t(`lab.type.${current.type}`) },
        { k: t("rp.sampleDate"), v: dateText(current.receivedAt) },
        { k: t("rp.rep.status"), v: t(`lab.st.${current.status}`) },
        { k: t("rp.rep.adminRisk"), v: riskText(current) },
      ],
      parents: report.parents.map((p) => ({
        role: t(`rp.${p.id}`),
        name: pick(p.name, p.nameAr),
        finding: t(`rp.finding.${p.finding}`),
        findingTone: p.finding,
        match: p.match,
        matchLabel: t("rp.match"),
      })),
      risks: report.items.map((r) => ({
        name: t(`rp.ri.${r.id}`),
        value: t(`rp.rv.${r.value}`),
        level: r.level,
      })),
      adminRisk: t("rp.adminRiskNote", { level: riskText(current) }),
      variant: {
        title: t("rp.allelic"),
        gene: `${report.variant.gene} (${report.variant.ref})`,
        text: t(`rp.v.${report.variant.textKey}`),
      },
      flag: {
        title: t("rp.mutationFlag"),
        gene: report.flag.gene,
        text: `${t(`rp.${report.flag.textKey}`)}${
          carrierParent
            ? ` ${t("rp.carrierFrom", {
                parent: pick(carrierParent.name, carrierParent.nameAr),
              })}`
            : ""
        }`,
      },
      recs: report.recs.map((r) => ({
        title: t(`rp.rec.${r.id}.title`),
        text: t(`rp.rec.${r.id}.text`),
      })),
      security: [
        { k: t("rp.secProtocol"), v: SECURITY.protocol },
        { k: t("rp.encryption"), v: SECURITY.encryption },
        { k: t("rp.hash"), v: SECURITY.hash },
      ],
      copyright: t("rp.copyright"),
    };

    const ok = openReportPdf(data);
    if (!ok) {
      setBlocked(true);
      setTimeout(() => setBlocked(false), 4000);
      return;
    }
    setExported(true);
    setTimeout(() => setExported(false), 1800);
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
            {t("rp.title1")}{" "}
            <span dir="ltr">{report ? report.reportId : "-"}</span>
          </h1>
          <p>{t("rp.subtitle")}</p>
        </div>
        <div className="rp-head-actions">
          <button
            type="button"
            className="sf-btn"
            disabled={!report}
            onClick={share}
          >
            <Icon name="share" size={16} />
            &nbsp;
            {shared ? t("rp.shared") : t("rp.share")}
          </button>
          <button
            type="button"
            className="sm-add"
            disabled={!report}
            onClick={exportReport}
          >
            <Icon name="download" size={18} />{" "}
            {exported ? t("rp.exported") : t("rp.exportPdf")}
          </button>
        </div>
      </section>

      {blocked && <p className="rk-done rp-blocked">{t("rp.pdf.blocked")}</p>}

      {/* Subject picker */}
      <section className="ad-card rp-pick">
        <label className="rk-field rp-pick-field">
          <span className="cp-label">{t("rp.pick")}</span>
          <select
            className="sm-select rk-select"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading || samples.length === 0}
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {label(s)}
              </option>
            ))}
          </select>
        </label>
        {report && <span className="rp-note-ok">{t("rp.ready")}</span>}
      </section>

      {!report && (
        <section className="ad-card rk-empty">
          <span className="rp-ico teal">
            <Icon name="dna" size={22} />
          </span>
          <h3>{t("rp.emptyTitle")}</h3>
          <p>{loading ? t("hr.loading") : t("rp.emptyText")}</p>
        </section>
      )}

      {report && current && (
        <>
          {/* Child + parents */}
          <section className="rp-top">
            <article className="ad-card rp-child">
              <div className="rp-card-title">
                <span className="rp-ico teal">
                  <Icon name="baby" size={22} />
                </span>
                <div>
                  <small>{t("rp.childProfile")}</small>
                  <h3>{current.subject || current.id}</h3>
                </div>
              </div>
              <span className="rp-tag">{t("rp.primarySubject")}</span>

              <dl className="rp-facts">
                <div>
                  <dt>{t("rp.rep.sample")}</dt>
                  <dd dir="ltr">{current.id}</dd>
                </div>
                <div>
                  <dt>{t("rp.rep.case")}</dt>
                  <dd dir="ltr">{current.caseId || "-"}</dd>
                </div>
                <div>
                  <dt>{t("rp.rep.hospital")}</dt>
                  <dd>{hospitalName(current)}</dd>
                </div>
                <div>
                  <dt>{t("rp.sampleType")}</dt>
                  <dd>{t(`lab.type.${current.type}`)}</dd>
                </div>
                <div>
                  <dt>{t("rp.sampleDate")}</dt>
                  <dd>{dateText(current.receivedAt)}</dd>
                </div>
                <div>
                  <dt>{t("rp.rep.status")}</dt>
                  <dd>{t(`lab.st.${current.status}`)}</dd>
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
                {report.parents.map((p) => (
                  <div key={p.id} className={`rp-parent ${p.id}`}>
                    <span className="rp-ico-sm">
                      <Icon name="user" size={20} />
                    </span>
                    <div>
                      <small>{t(`rp.${p.id}`)}</small>
                      <b>{pick(p.name, p.nameAr)}</b>
                      <p className={p.finding}>
                        {t(`rp.finding.${p.finding}`)}
                      </p>
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
                    {report.score}
                    <small>/10</small>
                  </strong>
                </div>
                <span className={`rp-level ${report.level}`}>
                  {t(`rp.lvl.${report.level}`)}
                </span>
              </div>

              <ul className="rp-risk-list">
                {report.items.map((r) => (
                  <li key={r.id} className={r.level}>
                    <b>{t(`rp.ri.${r.id}`)}</b>
                    <span>{t(`rp.rv.${r.value}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="rp-admin-risk">
              {t("rp.adminRiskNote", { level: riskText(current) })}
            </p>
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
                  <h3 dir="ltr">
                    {report.variant.gene} ({report.variant.ref})
                  </h3>
                </div>
              </div>
              <p>{t(`rp.v.${report.variant.textKey}`)}</p>
            </article>

            <article className="ad-card rp-flag warn">
              <div className="rp-card-title">
                <span className="rp-ico amber">
                  <Icon name="alert" size={20} />
                </span>
                <div>
                  <small>{t("rp.mutationFlag")}</small>
                  <h3 dir="ltr">{report.flag.gene}</h3>
                </div>
              </div>
              <p>
                {t(`rp.${report.flag.textKey}`)}
                {carrierParent && (
                  <>
                    {" "}
                    {t("rp.carrierFrom", {
                      parent: pick(carrierParent.name, carrierParent.nameAr),
                    })}
                  </>
                )}
              </p>
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
              {report.recs.map((r) => (
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
        </>
      )}
    </DashboardLayout>
  );
}
