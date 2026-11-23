import { useEffect, useMemo, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { getUser } from "../../auth/session";
import { advanceLabSample, flagLabSample, listLabSamples } from "../../auth/lab";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "./Lab.css";

const PAGE_SIZE = 10;

// Lab DNA Samples: every sample sent to the lab. The technician moves a
// sample received -> sequencing -> done and can flag a problem with a note.
// No patient name is ever shown here.
export default function LabSamplesPage() {
  const { t, lang } = useLanguage();
  const staffId = getUser()?.nationalId || "unknown";

  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState("");
  const [flagFor, setFlagFor] = useState(null);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");

  function reload() {
    return listLabSamples().then((list) => {
      setSamples(list);
      setLoading(false);
    });
  }

  useEffect(() => {
    let alive = true;
    listLabSamples().then((list) => {
      if (!alive) return;
      setSamples(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Every filter goes back to page 1 when it changes (done in the handlers,
  // not in an effect).
  const changeQuery = (v) => {
    setQuery(v);
    setPage(1);
  };
  const changeStatus = (v) => {
    setStatus(v);
    setPage(1);
  };
  const changeType = (v) => {
    setType(v);
    setPage(1);
  };

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  async function advance(sample) {
    setBusy(sample.id);
    const next = await advanceLabSample({ sampleId: sample.id, staffId });
    await reload();
    setBusy("");
    flash(next === "sequencing" ? t("lab.toast.sequencing") : t("lab.toast.done"));
  }

  async function submitFlag() {
    if (note.trim().length < 3) return;
    setBusy(flagFor.id);
    await flagLabSample({ sampleId: flagFor.id, staffId, note });
    await reload();
    setBusy("");
    setFlagFor(null);
    setNote("");
    flash(t("lab.toast.flagged"));
  }

  const summary = useMemo(
    () => [
      { key: "total", value: samples.length, tone: "teal" },
      {
        key: "received",
        value: samples.filter((s) => s.status === "received").length,
        tone: "amber",
      },
      {
        key: "sequencing",
        value: samples.filter((s) => s.status === "sequencing").length,
        tone: "blue",
      },
      {
        key: "flagged",
        value: samples.filter((s) => s.flagged).length,
        tone: "red",
      },
    ],
    [samples],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return samples.filter(
      (s) =>
        (status === "all" || s.status === status) &&
        (type === "all" || s.type === type) &&
        (!q ||
          s.id.toLowerCase().includes(q) ||
          s.hospital.toLowerCase().includes(q) ||
          (s.hospitalAr || "").includes(query.trim())),
    );
  }, [samples, query, status, type]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : start + 1;
  const to = Math.min(start + PAGE_SIZE, filtered.length);

  const hospitalName = (s) =>
    lang === "ar" && s.hospitalAr ? s.hospitalAr : s.hospital;

  return (
    <DashboardLayout role="lab_technician">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("lab.s.tag")}</span>
          <h1>
            {t("lab.s.title1")} <span>{t("lab.s.title2")}</span>
          </h1>
          <p>{t("lab.s.subtitle")}</p>
        </div>
      </section>

      {/* Summary */}
      <section className="ad-stats">
        {summary.map((s) => (
          <article key={s.key} className="ad-card ad-stat">
            <div className="ad-stat-top">
              <span>{t(`lab.s.sum.${s.key}`)}</span>
              <i className={`sm-pip ${s.tone}`} />
            </div>
            <strong>{s.value.toLocaleString("en-US")}</strong>
          </article>
        ))}
      </section>

      {/* Filters */}
      <section className="ad-card sm-filters">
        <label className="sm-field sm-field-search">
          <span>{t("sm.f.search")}</span>
          <div className="sm-input">
            <Icon name="search" size={18} />
            <input
              type="search"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder={t("lab.s.searchPh")}
            />
          </div>
        </label>

        <label className="sm-field">
          <span>{t("sm.f.status")}</span>
          <select
            className="sm-select"
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
          >
            <option value="all">{t("sm.f.allStatus")}</option>
            <option value="received">{t("lab.st.received")}</option>
            <option value="sequencing">{t("lab.st.sequencing")}</option>
            <option value="done">{t("lab.st.done")}</option>
          </select>
        </label>

        <label className="sm-field">
          <span>{t("sm.f.type")}</span>
          <select
            className="sm-select"
            value={type}
            onChange={(e) => changeType(e.target.value)}
          >
            <option value="all">{t("sm.f.allType")}</option>
            <option value="buccal">{t("sm.type.buccal")}</option>
            <option value="blood">{t("sm.type.blood")}</option>
            <option value="tissue">{t("sm.type.tissue")}</option>
          </select>
        </label>
      </section>

      {/* Table */}
      <section className="ad-card sm-table-card">
        <div className="ad-table-wrap lab-table-wrap">
          <table className="ad-table sm-table">
            <thead>
              <tr>
                <th>{t("lab.col.sample")}</th>
                <th>{t("lab.col.type")}</th>
                <th>{t("lab.col.hospital")}</th>
                <th>{t("lab.col.received")}</th>
                <th>{t("lab.col.priority")}</th>
                <th>{t("lab.col.status")}</th>
                <th>{t("lab.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="sm-empty">
                    {t("sm.empty")}
                  </td>
                </tr>
              )}
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="mono" dir="ltr">
                    {s.id}
                    {s.flagged && (
                      <em className="lab-flag-dot" title={s.flagNote} />
                    )}
                  </td>
                  <td className="muted">{t(`sm.type.${s.type}`)}</td>
                  <td className="muted">{hospitalName(s)}</td>
                  <td className="muted" dir="ltr">
                    {s.receivedAt.slice(0, 10)}
                  </td>
                  <td>
                    <em className={`ad-status lab-prio ${s.priority}`}>
                      {t(`lab.prio.${s.priority}`)}
                    </em>
                  </td>
                  <td>
                    <em className={`ad-status lab-st ${s.status}`}>
                      {t(`lab.st.${s.status}`)}
                    </em>
                  </td>
                  <td>
                    <div className="lab-actions">
                      {s.status !== "done" && (
                        <button
                          type="button"
                          className="primary"
                          disabled={busy === s.id}
                          onClick={() => advance(s)}
                        >
                          {s.status === "received"
                            ? t("lab.act.start")
                            : t("lab.act.finish")}
                        </button>
                      )}
                      <button
                        type="button"
                        className="warn"
                        disabled={busy === s.id}
                        onClick={() => {
                          setFlagFor(s);
                          setNote(s.flagNote || "");
                        }}
                      >
                        <Icon name="alert" size={14} /> {t("lab.act.flag")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm-foot">
          <small>
            {t("sm.showing")} {from}-{to} {t("sm.of")}{" "}
            {filtered.length.toLocaleString("en-US")} {t("sm.specimens")}
          </small>
          <div className="sm-pager">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label={t("sm.prev")}
            >
              <Icon name="chevron" size={16} />
            </button>
            {Array.from({ length: Math.min(pages, 3) }, (_, i) => i + 1).map(
              (n) => (
                <button
                  key={n}
                  type="button"
                  className={safePage === n ? "on" : ""}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={safePage === pages}
              aria-label={t("sm.next")}
            >
              <Icon name="chevron" size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Flag dialog */}
      {flagFor && (
        <div
          className="lab-modal-back"
          role="dialog"
          aria-modal="true"
          onClick={() => setFlagFor(null)}
        >
          <div className="lab-modal ad-card" onClick={(e) => e.stopPropagation()}>
            <h3>
              {t("lab.flag.title")} <span dir="ltr">{flagFor.id}</span>
            </h3>
            <p>{t("lab.flag.text")}</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("lab.flag.ph")}
              rows={4}
            />
            <div className="lab-modal-actions">
              <button
                type="button"
                className="sf-btn"
                onClick={() => setFlagFor(null)}
              >
                {t("lab.flag.cancel")}
              </button>
              <button
                type="button"
                className="sm-add"
                disabled={note.trim().length < 3}
                onClick={submitFlag}
              >
                {t("lab.flag.submit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="st-toast">{toast}</div>}
    </DashboardLayout>
  );
}
