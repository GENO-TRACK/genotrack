import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { getLabCustody, listLabSamples } from "../../auth/lab";
import "./AdminDashboard.css";
import "./SamplesPage.css";
import "./CustodyPage.css";
import "../lab/Lab.css";

// Event type -> icon and colour of the timeline node.
// Same events the lab writes: received, sequencing, done, flagged.
const EVENT_STYLE = {
  received: { icon: "truck", tone: "blue" },
  sequencing: { icon: "dna", tone: "teal" },
  done: { icon: "check", tone: "teal" },
  flagged: { icon: "alert", tone: "red" },
};

// Admin Chain of Custody: pick any sample the lab holds and read its real
// timeline. It reads the same demo data as the lab's Chain of Custody page,
// so a Start sequencing or a flag raised in the lab shows up here too.
// The "received" step shows who transferred the sample (typed on Add Sample).
// The DNA Samples list opens this page with ?sample=<id>.
export default function CustodyPage() {
  const { t, lang } = useLanguage();
  const [params] = useSearchParams();
  const wanted = params.get("sample") || "";

  const [samples, setSamples] = useState([]);
  const [sampleId, setSampleId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // The list of samples for the dropdown. A ?sample= id that exists wins.
  useEffect(() => {
    let alive = true;
    listLabSamples().then((list) => {
      if (!alive) return;
      setSamples(list);
      const match = list.find((s) => s.id === wanted);
      if (match) setSampleId(match.id);
      else if (list.length) setSampleId(list[0].id);
      else setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [wanted]);

  // The custody timeline of the chosen sample. "loading" is switched on in
  // the dropdown handler, so the effect only sets state after the data arrives.
  useEffect(() => {
    if (!sampleId) return undefined;
    let alive = true;
    getLabCustody(sampleId).then((res) => {
      if (!alive) return;
      setData(res);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [sampleId]);

  function pickSample(id) {
    if (id === sampleId) return;
    setLoading(true);
    setSampleId(id);
  }

  const events = useMemo(() => (data ? data.events : []), [data]);

  const hospitalName = (s) =>
    lang === "ar" && s.hospitalAr ? s.hospitalAr : s.hospital;

  const stamp = (iso) => ({
    date: iso.slice(0, 10),
    time: iso.slice(11, 16),
  });

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("cu.tag")}</span>
          <h1>
            {t("cu.title1")} <span>{t("cu.title2")}</span>
          </h1>
          <p>
            {t("cu.ref")}:{" "}
            <b className="cu-ref" dir="ltr">
              {sampleId || "-"}
            </b>
          </p>
        </div>
      </section>

      {/* Sample picker */}
      <section className="ad-card sm-filters">
        <label className="sm-field sm-field-search">
          <span>{t("cu.pick")}</span>
          <select
            className="sm-select"
            value={sampleId}
            onChange={(e) => pickSample(e.target.value)}
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {t(`sm.type.${s.type}`)} · {hospitalName(s)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {!loading && !data && <p className="ps-hint">{t("cu.empty")}</p>}

      {data && (
        <>
          {/* Summary */}
          <section className="cu-summary">
            <article className="ad-card cu-status">
              <span className="cu-label">{t("lab.c.status")}</span>
              <strong>
                <Icon name="shield" size={22} />{" "}
                {t(`lab.st.${data.sample.status}`)}
              </strong>
            </article>
            <article className="ad-card cu-stat">
              <span className="cu-label">{t("lab.c.hospital")}</span>
              <strong className="lab-c-small">
                {hospitalName(data.sample)}
              </strong>
            </article>
            <article className="ad-card cu-stat">
              <span className="cu-label">{t("lab.c.storage")}</span>
              <strong dir="ltr" className="lab-c-small">
                {data.sample.storage}
              </strong>
            </article>
            <article className="ad-card cu-stat">
              <span className="cu-label">{t("lab.c.temp")}</span>
              <strong dir="ltr">{data.sample.temp}°C</strong>
            </article>
          </section>

          {/* Timeline */}
          <section className="cu-timeline" aria-label={t("cu.title1")}>
            {events.map((e, i) => {
              const style = EVENT_STYLE[e.type] || EVENT_STYLE.received;
              const when = stamp(e.at);
              const byWho = e.by === "courier" ? t("lab.c.courier") : e.by;
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
                    <h3>{t(`lab.c.ev.${e.type}.title`)}</h3>
                    <p>{t(`lab.c.ev.${e.type}.text`)}</p>

                    {e.note && (
                      <p className="lab-c-note">
                        <Icon name="alert" size={14} /> {e.note}
                      </p>
                    )}

                    <ul className="cu-meta">
                      <li>
                        <Icon name="user" size={16} />
                        <span>
                          <b dir="ltr">{byWho}</b>
                          <small>
                            {e.by === "courier"
                              ? t("lab.c.roleCourier")
                              : t("lab.c.roleTech")}
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

          {/* Footer */}
          <footer className="cu-foot">
            <small dir="ltr">
              {t("cu.events")}: {events.length}
            </small>
          </footer>
        </>
      )}
    </DashboardLayout>
  );
}
