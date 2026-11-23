import { useEffect, useMemo, useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { getLabCustody, listLabSamples } from "../../auth/lab";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "../admin/CustodyPage.css";
import "./Lab.css";

// Event type -> icon and colour of the timeline node.
const EVENT_STYLE = {
  received: { icon: "truck", tone: "blue" },
  sequencing: { icon: "dna", tone: "teal" },
  done: { icon: "check", tone: "teal" },
  flagged: { icon: "alert", tone: "red" },
};

// Lab Chain of Custody: pick a sample and read its timeline.
// Only sample data is shown: no patient name, ever.
export default function LabCustodyPage() {
  const { t, lang } = useLanguage();

  const [samples, setSamples] = useState([]);
  const [sampleId, setSampleId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // The list of samples for the dropdown.
  useEffect(() => {
    let alive = true;
    listLabSamples().then((list) => {
      if (!alive) return;
      setSamples(list);
      if (list.length) setSampleId(list[0].id);
      else setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

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
    <DashboardLayout role="lab_technician">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag">{t("lab.c.tag")}</span>
          <h1>
            {t("lab.c.title1")} <span>{t("lab.c.title2")}</span>
          </h1>
          <p>{t("lab.c.subtitle")}</p>
        </div>
      </section>

      {/* Sample picker */}
      <section className="ad-card sm-filters">
        <label className="sm-field sm-field-search">
          <span>{t("lab.c.pick")}</span>
          <select
            className="sm-select"
            value={sampleId}
            onChange={(e) => pickSample(e.target.value)}
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {t(`sm.type.${s.type}`)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {!loading && !data && (
        <p className="ps-hint">{t("lab.c.empty")}</p>
      )}

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
          <section className="cu-timeline" aria-label={t("lab.c.title1")}>
            {events.map((e, i) => {
              const style = EVENT_STYLE[e.type] || EVENT_STYLE.received;
              const when = stamp(e.at);
              const byWho =
                e.by === "courier" ? t("lab.c.courier") : e.by;
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
        </>
      )}
    </DashboardLayout>
  );
}
