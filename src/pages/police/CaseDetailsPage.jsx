import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { getUser } from "../../auth/session";
import {
  SAMPLE_PLACES,
  addCaseNote,
  confirmMatch,
  getCase,
  markSampleReceived,
  requestSample,
  runSearch,
  setCaseClosed,
  setCasePriority,
} from "../../auth/police";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "../admin/CustodyPage.css";
import "../hospital/PatientSearch.css";
import "../lab/Lab.css";
import "./Police.css";

// Log entry type -> icon and colour of the timeline node.
const LOG_STYLE = {
  opened: { icon: "plus", tone: "teal" },
  sampleRequested: { icon: "truck", tone: "blue" },
  sampleReceived: { icon: "flask", tone: "blue" },
  searched: { icon: "search", tone: "teal" },
  confirmed: { icon: "check", tone: "teal" },
  closed: { icon: "lock", tone: "blue" },
  reopened: { icon: "arrow", tone: "blue" },
  priority: { icon: "alert", tone: "red" },
  note: { icon: "report", tone: "blue" },
};

// One case: details, sample request, database search, match, notes, log.
// Police only see "match / no match", a similarity percentage and the
// hospital name. Never a medical record.
export default function CaseDetailsPage() {
  const { t, lang } = useLanguage();
  const { caseId } = useParams();
  const staffId = getUser()?.nationalId || "unknown";

  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [placeId, setPlaceId] = useState(SAMPLE_PLACES[0].id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmNote, setConfirmNote] = useState("");
  const [noteText, setNoteText] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    let alive = true;
    getCase(caseId).then((res) => {
      if (!alive) return;
      setC(res);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [caseId]);

  useEffect(() => load(), [load]);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  async function act(name, fn, doneMsg) {
    if (busy) return;
    setBusy(name);
    try {
      const updated = await fn();
      setC(updated);
      if (doneMsg) flash(doneMsg);
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="police_investigator">
        <p className="ps-hint">{t("pol.d.loading")}</p>
      </DashboardLayout>
    );
  }

  if (!c) {
    return (
      <DashboardLayout role="police_investigator">
        <section className="ad-head">
          <div>
            <h1>{t("pol.d.notFound")}</h1>
            <p>{t("pol.d.notFoundText")}</p>
          </div>
          <Link to="/police/cases" className="sf-btn">
            {t("pol.back")}
          </Link>
        </section>
      </DashboardLayout>
    );
  }

  const isMissing = c.type === "missing";
  const isClosed = c.status === "closed";
  const isResolved = c.status === "resolved";
  const finished = isClosed || isResolved;
  const result = c.result;

  const placeName = (id) => {
    const p = SAMPLE_PLACES.find((x) => x.id === id);
    if (!p) return "";
    return lang === "ar" ? p.nameAr : p.name;
  };
  const caseWhere = lang === "ar" && c.placeAr ? c.placeAr : c.place;
  const childLabel = c.childName || t("pol.unknownChild");
  const hospitalOf = (r) =>
    lang === "ar" && r.hospitalAr ? r.hospitalAr : r.hospital;
  const stamp = (iso) => ({ date: iso.slice(0, 10), time: iso.slice(11, 16) });

  const canRequest = c.status === "open";
  const canReceive = c.status === "sampleRequested";
  const canSearch = c.status === "sampleReceived";

  // The text of one log line.
  const logText = (e) => {
    switch (e.type) {
      case "sampleRequested":
        return t("pol.d.log.sampleRequested", {
          place: placeName(e.placeId || c.samplePlace),
        });
      case "searched":
        return t(
          e.outcome === "match"
            ? "pol.d.log.searchedMatch"
            : "pol.d.log.searchedNone",
        );
      case "priority":
        return t(
          e.priority === "high"
            ? "pol.d.log.priorityHigh"
            : "pol.d.log.priorityNormal",
        );
      default:
        return t(`pol.d.log.${e.type}`);
    }
  };

  // Which step of the flow is current (for the progress strip).
  const steps = ["open", "sampleRequested", "sampleReceived", "matched", "resolved"];
  const rank = {
    open: 0,
    sampleRequested: 1,
    sampleReceived: 2,
    matched: 3,
    noMatch: 3,
    resolved: 4,
    closed: 0,
  };
  const current = rank[c.status] ?? 0;

  function printCase() {
    window.print();
  }

  return (
    <DashboardLayout role="police_investigator">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">
            <span dir="ltr">{c.id}</span>
          </span>
          <h1>
            {childLabel} <span>{t(`pol.type.${c.type}`)}</span>
          </h1>
          <p>
            <em className={`ad-status pol-st ${c.status}`}>
              {t(`pol.st.${c.status}`)}
            </em>{" "}
            <em className={`ad-status lab-prio ${c.priority}`}>
              {t(`pol.prio.${c.priority}`)}
            </em>
          </p>
        </div>
        <div className="pol-head-actions">
          <Link to="/police/cases" className="sf-btn">
            {t("pol.back")}
          </Link>
          <button type="button" className="sf-btn" onClick={printCase}>
            {t("pol.d.print")}
          </button>
        </div>
      </section>

      {/* Progress */}
      <ol className="pol-steps">
        {steps.map((s, i) => (
          <li
            key={s}
            className={
              i < current ? "done" : i === current ? "current" : ""
            }
          >
            <b>{i < current ? <Icon name="check" size={14} /> : i + 1}</b>
            <span>{t(`pol.step.${s}`)}</span>
          </li>
        ))}
      </ol>

      {/* Case details + officer actions */}
      <section className="pol-grid">
        <article className="ad-card pol-box">
          <h3>{t("pol.d.details")}</h3>
          <dl className="pol-dl">
            <div>
              <dt>{t("pol.col.type")}</dt>
              <dd>{t(`pol.type.${c.type}`)}</dd>
            </div>
            <div>
              <dt>{t("pol.new.childName")}</dt>
              <dd>{childLabel}</dd>
            </div>
            <div>
              <dt>{t("pol.new.childAge")}</dt>
              <dd dir="ltr">{c.childAge || "-"}</dd>
            </div>
            <div>
              <dt>{t("pol.new.gender")}</dt>
              <dd>
                {c.gender ? t(`pol.new.${c.gender}`) : t("pol.new.genderUnknown")}
              </dd>
            </div>
            <div>
              <dt>
                {isMissing
                  ? t("pol.new.lastSeenPlace")
                  : t("pol.new.foundPlace")}
              </dt>
              <dd>{caseWhere || "-"}</dd>
            </div>
            <div>
              <dt>
                {isMissing
                  ? t("pol.new.lastSeenDate")
                  : t("pol.new.foundDate")}
              </dt>
              <dd dir="ltr">{c.when || "-"}</dd>
            </div>
            <div>
              <dt>
                {isMissing
                  ? t("pol.new.familySection")
                  : t("pol.new.finderSection")}
              </dt>
              <dd>
                {c.reporter}
                {c.relation ? ` (${c.relation})` : ""}
              </dd>
            </div>
            <div>
              <dt>{t("pol.new.contact")}</dt>
              <dd dir="ltr">{c.contact || "-"}</dd>
            </div>
            <div className="wide">
              <dt>{t("pol.new.description")}</dt>
              <dd>{c.description || "-"}</dd>
            </div>
          </dl>
        </article>

        <article className="ad-card pol-box">
          <h3>{t("pol.d.actions")}</h3>

          {/* Step 1: request a sample */}
          <div className="pol-act">
            <b>{t("pol.d.sampleTitle")}</b>
            <small>
              {isMissing ? t("pol.d.sampleFamily") : t("pol.d.sampleChild")}
            </small>

            {canRequest && (
              <div className="pol-act-row">
                <select
                  className="sm-select"
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                >
                  {SAMPLE_PLACES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === "ar" ? p.nameAr : p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="sm-add"
                  disabled={!!busy}
                  onClick={() =>
                    act(
                      "request",
                      () => requestSample({ caseId: c.id, placeId, staffId }),
                      t("pol.d.requested"),
                    )
                  }
                >
                  {busy === "request"
                    ? t("pol.d.working")
                    : t("pol.d.request")}
                </button>
              </div>
            )}

            {c.samplePlace && !canRequest && (
              <p className="pol-state">
                <Icon name="pin" size={15} /> {placeName(c.samplePlace)}
              </p>
            )}

            {canReceive && (
              <div className="pol-act-row">
                <span className="ps-hint">{t("pol.d.waitingSample")}</span>
                <button
                  type="button"
                  className="sf-btn"
                  disabled={!!busy}
                  onClick={() =>
                    act(
                      "receive",
                      () => markSampleReceived({ caseId: c.id, staffId }),
                      t("pol.d.received"),
                    )
                  }
                >
                  {busy === "receive"
                    ? t("pol.d.working")
                    : t("pol.d.simulate")}
                </button>
              </div>
            )}
          </div>

          {/* Step 2: search the database */}
          <div className="pol-act">
            <b>{t("pol.d.searchTitle")}</b>
            <small>
              {isMissing ? t("pol.d.searchFamily") : t("pol.d.searchChild")}
            </small>
            {canSearch && (
              <div className="pol-act-row">
                <button
                  type="button"
                  className="sm-add"
                  disabled={!!busy}
                  onClick={() =>
                    act("search", () => runSearch({ caseId: c.id, staffId }))
                  }
                >
                  <Icon name="search" size={17} />{" "}
                  {busy === "search"
                    ? t("pol.d.searching")
                    : t("pol.d.search")}
                </button>
              </div>
            )}
            {!canSearch && !result && (
              <p className="ps-hint">{t("pol.d.searchLocked")}</p>
            )}
          </div>

          {/* Close / reopen / priority */}
          <div className="pol-act">
            <b>{t("pol.d.caseControl")}</b>
            <div className="pol-act-row">
              {!finished && (
                <button
                  type="button"
                  className="sf-btn"
                  disabled={!!busy}
                  onClick={() =>
                    act(
                      "prio",
                      () =>
                        setCasePriority({
                          caseId: c.id,
                          priority: c.priority === "high" ? "normal" : "high",
                          staffId,
                        }),
                      t("pol.d.prioChanged"),
                    )
                  }
                >
                  {c.priority === "high"
                    ? t("pol.d.makeNormal")
                    : t("pol.d.makeUrgent")}
                </button>
              )}
              {isResolved ? null : (
                <button
                  type="button"
                  className="sf-btn"
                  disabled={!!busy}
                  onClick={() =>
                    act(
                      "close",
                      () =>
                        setCaseClosed({
                          caseId: c.id,
                          closed: !isClosed,
                          staffId,
                        }),
                      isClosed ? t("pol.d.reopened") : t("pol.d.closed"),
                    )
                  }
                >
                  {isClosed ? t("pol.d.reopen") : t("pol.d.close")}
                </button>
              )}
            </div>
          </div>
        </article>
      </section>

      {/* Search result */}
      {result && (
        <section
          className={`ad-card pol-result ${result.outcome === "match" ? "match" : "none"}`}
        >
          <span className="pol-result-ico">
            <Icon
              name={result.outcome === "match" ? "alert" : "search"}
              size={26}
            />
          </span>
          <div className="pol-result-body">
            <h3>
              {result.outcome === "match"
                ? t("pol.d.matchTitle")
                : t("pol.d.noMatchTitle")}
            </h3>
            {result.outcome === "match" ? (
              <>
                <p>
                  {isMissing
                    ? t("pol.d.matchTextMissing")
                    : t("pol.d.matchTextFound")}
                </p>
                <ul className="pol-result-meta">
                  <li>
                    <small>{t("pol.d.similarity")}</small>
                    <b dir="ltr">{result.similarity}%</b>
                  </li>
                  <li>
                    <small>{t("pol.d.holder")}</small>
                    <b>{hospitalOf(result)}</b>
                  </li>
                  <li>
                    <small>{t("pol.d.record")}</small>
                    <b dir="ltr">{result.recordId}</b>
                  </li>
                  {result.linkedCase && (
                    <li>
                      <small>{t("pol.d.linkedCase")}</small>
                      <b dir="ltr">
                        <Link
                          to={`/police/cases/${result.linkedCase}`}
                          className="pol-link"
                        >
                          {result.linkedCase}
                        </Link>
                      </b>
                    </li>
                  )}
                </ul>
                <p className="ps-hint">{t("pol.d.privacy")}</p>

                {c.status === "matched" && (
                  <button
                    type="button"
                    className="sm-add"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Icon name="check" size={17} /> {t("pol.d.confirm")}
                  </button>
                )}

                {result.confirmedAt && (
                  <p className="pol-confirmed">
                    <Icon name="shield" size={16} />{" "}
                    {t("pol.d.confirmedBy", {
                      officer: result.confirmedBy,
                      date: result.confirmedAt.slice(0, 10),
                    })}
                    {result.confirmNote ? ` · ${result.confirmNote}` : ""}
                  </p>
                )}
              </>
            ) : (
              <p>
                {isMissing
                  ? t("pol.d.noMatchTextMissing")
                  : t("pol.d.noMatchTextFound")}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Notes */}
      <section className="ad-card pol-box pol-notes">
        <h3>{t("pol.d.notes")}</h3>
        <div className="pol-act-row">
          <input
            className="ps-input"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={t("pol.d.notePh")}
          />
          <button
            type="button"
            className="sf-btn"
            disabled={noteText.trim().length < 2 || !!busy}
            onClick={() =>
              act(
                "note",
                () =>
                  addCaseNote({ caseId: c.id, staffId, note: noteText }).then(
                    (u) => {
                      setNoteText("");
                      return u;
                    },
                  ),
                t("pol.d.noteAdded"),
              )
            }
          >
            {t("pol.d.addNote")}
          </button>
        </div>
      </section>

      {/* Case log */}
      <section className="cu-timeline" aria-label={t("pol.d.log")}>
        <h3 className="pol-log-title">{t("pol.d.log")}</h3>
        {[...c.log].reverse().map((e, i) => {
          const style = LOG_STYLE[e.type] || LOG_STYLE.opened;
          const when = stamp(e.at);
          return (
            <div
              key={`${e.type}-${e.at}-${i}`}
              className={`cu-row ${i % 2 === 0 ? "start" : "end"}`}
            >
              <div className="cu-card ad-card">
                <div className="cu-when">
                  <b dir="ltr">{when.time}</b>
                  <span dir="ltr">{when.date}</span>
                </div>
                <h3>{t(`pol.d.ev.${e.type}`)}</h3>
                <p>{logText(e)}</p>
                {e.note && (
                  <p className="lab-c-note">
                    <Icon name="report" size={14} /> {e.note}
                  </p>
                )}
                <ul className="cu-meta">
                  <li>
                    <Icon name="user" size={16} />
                    <span>
                      <b dir="ltr">
                        {e.by === "system" ? t("pol.d.system") : e.by}
                      </b>
                      <small>
                        {e.by === "system"
                          ? t("pol.d.roleSystem")
                          : t("pol.d.roleOfficer")}
                      </small>
                    </span>
                  </li>
                </ul>
              </div>
              <span className={`cu-node ${style.tone}`}>
                <Icon name={style.icon} size={18} />
              </span>
            </div>
          );
        })}
      </section>

      {/* Confirm dialog */}
      {confirmOpen && (
        <div
          className="lab-modal-back"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="ad-card lab-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {t("pol.d.confirmTitle")} <span dir="ltr">{c.id}</span>
            </h3>
            <p>{t("pol.d.confirmText")}</p>
            <textarea
              rows={4}
              value={confirmNote}
              onChange={(e) => setConfirmNote(e.target.value)}
              placeholder={t("pol.d.confirmPh")}
            />
            <div className="lab-modal-actions">
              <button
                type="button"
                className="sf-btn"
                onClick={() => setConfirmOpen(false)}
              >
                {t("pol.d.cancel")}
              </button>
              <button
                type="button"
                className="sm-add"
                disabled={confirmNote.trim().length < 3 || !!busy}
                onClick={() =>
                  act(
                    "confirm",
                    () =>
                      confirmMatch({
                        caseId: c.id,
                        staffId,
                        note: confirmNote,
                      }),
                    t("pol.d.confirmedToast"),
                  ).then(() => {
                    setConfirmOpen(false);
                    setConfirmNote("");
                  })
                }
              >
                {t("pol.d.confirmSubmit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="st-toast">{toast}</div>}
    </DashboardLayout>
  );
}
