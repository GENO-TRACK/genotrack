import { useEffect, useMemo, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { listCases, SAMPLE_PLACES } from "../../auth/police";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./ComparisonPage.css";

// The admin DNA Comparison page reads the real police cases.
//
// Real data (from src/auth/police.js):
//   - the case, its sample place and the day the sample was received
//   - the search result: outcome, similarity %, registry record, hospital
//
// Simulated data (the demo has no DNA files):
//   - the letters of the alignment grid. They are generated from the IDs, so
//     the same case always shows the same grid. The number of mismatches
//     follows the real similarity %. The backend will return the real
//     sequences instead.
//
// Export .FASTQ and Generate Full Clinical Report build real files in the
// browser from the data shown on the page. The files follow the page language.

const BASES = ["A", "C", "G", "T"];
const LOCUS_COUNT = 2;
const BASES_PER_LOCUS = 13;

// Small deterministic number generator: same text in, same numbers out.
function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRandom(seed) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Builds the loci for one case. Returns { loci, total }.
// `mismatches` bases of the reference are changed so the grid agrees with the
// similarity %. A noMatch case gets a mostly different reference.
function buildLoci(caseId, mismatches) {
  const rand = makeRandom(seedFrom(caseId));
  const total = LOCUS_COUNT * BASES_PER_LOCUS;

  const loci = [];
  for (let l = 0; l < LOCUS_COUNT; l += 1) {
    const a = [];
    for (let i = 0; i < BASES_PER_LOCUS; i += 1) {
      a.push(BASES[Math.floor(rand() * 4)]);
    }
    loci.push({
      id: `LOC-${String(l + 1).padStart(2, "0")}`,
      a,
      b: [...a],
    });
  }

  // Pick `mismatches` distinct positions and change the base there.
  const positions = new Set();
  let guard = 0;
  while (positions.size < Math.min(mismatches, total) && guard < 500) {
    positions.add(Math.floor(rand() * total));
    guard += 1;
  }
  positions.forEach((pos) => {
    const l = Math.floor(pos / BASES_PER_LOCUS);
    const i = pos % BASES_PER_LOCUS;
    const original = loci[l].a[i];
    const options = BASES.filter((x) => x !== original);
    loci[l].b[i] = options[Math.floor(rand() * options.length)];
  });

  return { loci, total };
}

function cellState(a, b) {
  return a === b ? "full" : "mut";
}

function formatTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} // ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// Starts a browser download of a text file.
function downloadText(fileName, text, mime) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ComparisonPage() {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState("");
  const [heat, setHeat] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [signed, setSigned] = useState(false);
  const [done, setDone] = useState("");

  useEffect(() => {
    let alive = true;
    listCases().then((all) => {
      if (!alive) return;
      // Only cases that already have a search result can be compared.
      const withResult = all.filter((c) => c.result);
      setCases(withResult);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const current = useMemo(() => {
    if (!cases.length) return null;
    return cases.find((c) => c.id === picked) || cases[0];
  }, [cases, picked]);

  const view = useMemo(() => {
    if (!current) return null;
    const result = current.result;
    const isMatch = result.outcome === "match";

    // Mismatches follow the real similarity: 100% = 0, 98.9% = 1 base, etc.
    const total = LOCUS_COUNT * BASES_PER_LOCUS;
    const similarity = isMatch ? Number(result.similarity) || 0 : 0;
    const mismatches = isMatch
      ? Math.min(total, Math.round(((100 - similarity) / 100) * total * 10))
      : Math.round(total * 0.6);

    const { loci } = buildLoci(current.id, mismatches);

    let matchCount = 0;
    loci.forEach((l) =>
      l.a.forEach((base, i) => {
        if (cellState(base, l.b[i]) === "full") matchCount += 1;
      }),
    );

    // Confidence and p-value are derived from the same similarity.
    const confidence = isMatch ? (similarity / 100).toFixed(4) : "0.0000";
    const pvalue = isMatch
      ? similarity >= 99.5
        ? "< 0.0001"
        : "< 0.001"
      : "> 0.5";

    // Per-locus bars: share of matching bases in each locus.
    const alleles = loci.map((l, idx) => {
      const same = l.a.filter((base, i) => base === l.b[i]).length;
      return {
        locus: String.fromCharCode(65 + idx),
        value: Math.round((same / l.a.length) * 100),
      };
    });

    const place = SAMPLE_PLACES.find((p) => p.id === current.samplePlace);
    const received = current.log.find((e) => e.type === "sampleReceived");

    return {
      isMatch,
      similarity,
      confidence,
      pvalue,
      loci,
      alleles,
      matchCount,
      mismatchCount: total - matchCount,
      total,
      placeName: place ? (isAr ? place.nameAr : place.name) : "-",
      receivedAt: formatTime(received ? received.at : current.openedAt),
      hospital: isAr ? result.hospitalAr || result.hospital : result.hospital,
    };
  }, [current, isAr]);

  function pickCase(id) {
    setPicked(id);
    setHeat(false);
    setFlagged(false);
    setSigned(false);
    setDone("");
  }

  const sampleId = current ? `SMP-${current.id}` : "";
  const tone = view && !view.isMatch ? " no" : "";

  // ---- Export .FASTQ ----
  // Two records: the specimen and the reference. The quality line is a
  // placeholder ("I" = Phred 40) because the demo has no real quality data.
  function exportFastq() {
    if (!current || !view) return;
    const specimen = view.loci.map((l) => l.a.join("")).join("");
    const reference = view.loci.map((l) => l.b.join("")).join("");
    const refId = view.isMatch ? current.result.recordId : "NO-RECORD";
    const lines = [
      `@${sampleId} case=${current.id} role=specimen loci=${LOCUS_COUNT}`,
      specimen,
      "+",
      "I".repeat(specimen.length),
      `@${refId} case=${current.id} role=reference loci=${LOCUS_COUNT}`,
      reference,
      "+",
      "I".repeat(reference.length),
    ];
    downloadText(`${current.id}.fastq`, `${lines.join("\n")}\n`, "text/plain");
    setDone(t("cp.doneFastq"));
  }

  // ---- Generate Full Clinical Report ----
  function exportReport() {
    if (!current || !view) return;
    const yes = t("cp.rep.yes");
    const no = t("cp.rep.no");
    const line = (label, value) => `${label}: ${value}`;
    const when = new Date().toLocaleString(isAr ? "ar-EG" : "en-GB");

    const out = [
      t("cp.rep.title"),
      "=".repeat(48),
      line(t("cp.rep.generated"), when),
      "",
      `[ ${t("cp.rep.secCase")} ]`,
      line(t("cp.rep.caseId"), current.id),
      line(t("cp.rep.sampleId"), sampleId),
      line(t("cp.source"), view.placeName),
      line(t("cp.timestamp"), view.receivedAt),
      "",
      `[ ${t("cp.rep.secResult")} ]`,
      line(t("cp.prob"), `${view.similarity}%`),
      line(t("cp.confidence"), view.confidence),
      line(t("cp.pvalue"), view.pvalue),
      line(
        t("cp.autoVerdict"),
        view.isMatch ? t("cp.positive") : t("cp.negative"),
      ),
      "",
      `[ ${t("cp.reference")} ]`,
      line(t("cp.registry"), view.isMatch ? current.result.recordId : "-"),
      line(t("cp.database"), view.isMatch ? view.hospital : "-"),
      line(t("cp.subject"), t("cp.restricted")),
      "",
      `[ ${t("cp.alignment")} ]`,
      line(t("cp.lg.full"), view.matchCount),
      line(t("cp.lg.mut"), view.mismatchCount),
      ...view.alleles.map((a) => line(`${t("cp.locus")} ${a.locus}`, `${a.value}%`)),
      "",
      `[ ${t("cp.rep.secReview")} ]`,
      line(t("cp.flag"), flagged ? yes : no),
      line(t("cp.sign"), signed ? yes : no),
      "",
      t("cp.simulated"),
      "",
    ];

    downloadText(
      `${current.id}-clinical-report.txt`,
      out.join("\n"),
      "text/plain",
    );
    setDone(t("cp.doneReport"));
  }

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

          {cases.length > 0 && (
            <div className="cp-pick">
              <select
                className="sm-select cp-select"
                aria-label={t("cp.pick")}
                value={current ? current.id : ""}
                onChange={(e) => pickCase(e.target.value)}
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}
                    {c.childName ? ` - ${c.childName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {view && (
          <article className={`cp-prob${tone}`} aria-label={t("cp.prob")}>
            <span className="cp-label">{t("cp.prob")}</span>
            <strong dir="ltr">
              {view.similarity}
              <small>%</small>
            </strong>
            <em className="cp-verified">
              <Icon name="shield" size={14} />{" "}
              {view.isMatch ? t("cp.verifiedMatch") : t("cp.noMatch")}
            </em>
          </article>
        )}
      </section>

      {loading && <p className="cp-note">{t("cp.loading")}</p>}

      {!loading && !current && (
        <section className="ad-card">
          <p className="cp-note">{t("cp.empty")}</p>
        </section>
      )}

      {view && current && (
        <>
          {/* Specimens + score */}
          <section className="cp-grid">
            {/* Specimen Alpha: the sample taken for the case */}
            <article className="ad-card cp-spec">
              <header className="cp-spec-head">
                <span className="cp-spec-ico teal">
                  <Icon name="flask" size={22} />
                </span>
                <div>
                  <small>{t("cp.specimen")}</small>
                  <h3>{current.id}</h3>
                  <code dir="ltr">{sampleId}</code>
                </div>
                <Icon name="check" size={22} className="cp-ok" />
              </header>

              <dl className="cp-facts">
                <div>
                  <dt>{t("cp.source")}</dt>
                  <dd>{view.placeName}</dd>
                </div>
                <div>
                  <dt>{t("cp.timestamp")}</dt>
                  <dd dir="ltr">{view.receivedAt}</dd>
                </div>
              </dl>

              <div className="cp-seq" dir="ltr">
                <b>{view.loci[0].a.slice(0, 4).join("-")}</b>
                <span>STR-L3</span>
                <em>{t("cp.stable")}</em>
              </div>
            </article>

            {/* Sentinel score */}
            <article className={`ad-card cp-score${tone}`}>
              <span className="cp-score-ico">
                <Icon name="shield" size={22} />
              </span>
              <small className="cp-label">{t("cp.sentinel")}</small>
              <h3>{t("cp.confidence")}</h3>
              <strong dir="ltr">{view.confidence}</strong>
              <p dir="ltr">
                {t("cp.pvalue")}: <b>{view.pvalue}</b>
              </p>

              <div className="cp-alleles">
                <span className="cp-label">{t("cp.alleles")}</span>
                {view.alleles.map((a) => (
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

            {/* Reference Omega: the registry record */}
            <article className="ad-card cp-spec">
              <header className="cp-spec-head">
                <span className="cp-spec-ico blue">
                  <Icon name="user" size={22} />
                </span>
                <div>
                  <small>{t("cp.reference")}</small>
                  <h3>{view.isMatch ? t("cp.registry") : t("cp.noRecord")}</h3>
                  <code dir="ltr">
                    {view.isMatch ? current.result.recordId : "-"}
                  </code>
                </div>
                {view.isMatch && <Icon name="check" size={22} className="cp-ok" />}
              </header>

              <dl className="cp-facts">
                <div>
                  <dt>{t("cp.database")}</dt>
                  <dd>{view.isMatch ? view.hospital : "-"}</dd>
                </div>
                <div>
                  <dt>{t("cp.subject")}</dt>
                  <dd>{t("cp.restricted")}</dd>
                </div>
              </dl>

              <div className="cp-seq" dir="ltr">
                <b>{view.loci[0].b.slice(0, 4).join("-")}</b>
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
                <p className="cp-sim">{t("cp.simulated")}</p>
              </div>
              <div className="cp-align-actions">
                <button type="button" className="sf-btn" onClick={exportFastq}>
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
              {view.loci.map((l) => (
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
                <i className="full" /> {t("cp.lg.full")} ({view.matchCount})
              </span>
              <span>
                <i className="mut" /> {t("cp.lg.mut")} ({view.mismatchCount})
              </span>
              <span>
                <i className="inc" /> {t("cp.lg.inc")} (0)
              </span>
            </div>
          </section>

          {/* Verdict */}
          <section className={`ad-card cp-verdict${tone}`}>
            <div className="cp-verdict-text">
              <span className="cp-label">{t("cp.autoVerdict")}</span>
              <strong>
                <Icon name="shield" size={24} />{" "}
                {view.isMatch ? t("cp.positive") : t("cp.negative")}
              </strong>
              {flagged && <em className="cp-flagged">{t("cp.flagged")}</em>}
              {signed && <em className="cp-signed">{t("cp.signed")}</em>}
              {done && (
                <em className="cp-signed" role="status">
                  {done}
                </em>
              )}
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
              <button type="button" className="sf-btn" onClick={exportReport}>
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
        </>
      )}
    </DashboardLayout>
  );
}
