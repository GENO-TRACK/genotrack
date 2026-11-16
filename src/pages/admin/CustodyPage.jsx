import { useState } from "react";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/LanguageContext";
import "./AdminDashboard.css";
import "./CustodyPage.css";

// ---- Demo data: replace with API calls later ----
const SAMPLE_REF = "GTX-99283-DELTA";
const CHECKSUM =
  "8f2d9e1a4c5b3d6f7e8a9c0b1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0";
const DOC_ID = "GT-COC-2023-X99";

const STATS = [
  { key: "transitions", value: "04", unit: "nodes" },
  { key: "transit", value: "18h 42m" },
  { key: "temp", value: "-80.4°C" },
];

// side: which side of the timeline the card sits on (desktop); alternates
const EVENTS = [
  {
    id: "collected",
    time: "08:12 AM",
    date: "Oct 24, 2023",
    icon: "pin",
    tone: "teal",
    person: "Nurse Sarah Jenkins",
    role: "fieldSpecialist",
    place: "St. Jude Medical Center",
    badge: { kind: "signature", value: "verified" },
  },
  {
    id: "transferred",
    time: "11:45 AM",
    date: "Oct 24, 2023",
    icon: "truck",
    tone: "blue",
    person: "Biogen Logistics Unit 4",
    role: "courier",
    place: null,
    badge: { kind: "auth", value: "BIO-4922" },
    live: true,
  },
  {
    id: "analysis",
    time: "02:30 PM",
    date: "Oct 24, 2023",
    icon: "flask",
    tone: "teal",
    person: "Dr. Marcus Vane",
    role: "analyst",
    place: "GenoTrack Lab HQ",
    badge: { kind: "signature", value: "verified" },
  },
  {
    id: "archived",
    time: "05:50 PM",
    date: "Oct 24, 2023",
    icon: "vault",
    tone: "violet",
    person: "Automated Bio-Vault",
    role: "cryo",
    place: "C-09 / Slot: 442",
    badge: { kind: "status", value: "locked" },
  },
];

export default function CustodyPage() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function copyChecksum() {
    try {
      await navigator.clipboard.writeText(CHECKSUM);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: ignore */
    }
  }

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
              {SAMPLE_REF}
            </b>
          </p>
        </div>
        <button type="button" className="sm-add">
          <Icon name="plus" size={18} /> {t("cu.add")}
        </button>
      </section>

      {/* Summary */}
      <section className="cu-summary">
        <article className="ad-card cu-status">
          <span className="cu-label">{t("cu.status")}</span>
          <strong>
            <Icon name="shield" size={22} /> {t("cu.verified")}
          </strong>
        </article>

        {STATS.map((s) => (
          <article key={s.key} className="ad-card cu-stat">
            <span className="cu-label">{t(`cu.stat.${s.key}`)}</span>
            <strong dir="ltr">
              {s.value}
              {s.unit && <small>{t("cu.stat.nodes")}</small>}
            </strong>
          </article>
        ))}
      </section>

      {/* Integrity checksum */}
      <section className="ad-card cu-hash">
        <div className="cu-hash-text">
          <span className="cu-label">{t("cu.checksum")}</span>
          <code dir="ltr">SHA-256: {CHECKSUM}</code>
        </div>
        <div className="cu-hash-side">
          <span className="cu-enc">
            <Icon name="lock" size={16} /> {t("cu.encrypted")}
          </span>
          <button type="button" className="sf-btn" onClick={copyChecksum}>
            {copied ? t("cu.copied") : t("cu.copy")}
          </button>
        </div>
      </section>

      {/* Timeline */}
      <section className="cu-timeline" aria-label={t("cu.title1")}>
        {EVENTS.map((e, i) => (
          <div key={e.id} className={`cu-row ${i % 2 === 0 ? "start" : "end"}`}>
            <div className="cu-card ad-card">
              <div className="cu-when">
                <b dir="ltr">{e.time}</b>
                <span>{e.date}</span>
              </div>
              <h3>{t(`cu.ev.${e.id}.title`)}</h3>
              <p>{t(`cu.ev.${e.id}.text`)}</p>

              <ul className="cu-meta">
                <li>
                  <Icon name={e.icon} size={16} />
                  <span>
                    <b>{e.person}</b>
                    <small>{t(`cu.role.${e.role}`)}</small>
                  </span>
                </li>
                {e.place && (
                  <li>
                    <Icon name="pin" size={16} />
                    <span>{e.place}</span>
                  </li>
                )}
                {e.live && (
                  <li className="cu-live">
                    <i /> <span>{t("cu.gps")}</span>
                  </li>
                )}
              </ul>

              <em className={`cu-badge ${e.badge.kind}`}>
                {t(`cu.badge.${e.badge.kind}`)}:{" "}
                <b dir="ltr">
                  {e.badge.kind === "auth"
                    ? e.badge.value
                    : t(`cu.badge.${e.badge.value}`)}
                </b>
              </em>
            </div>

            <span className={`cu-node ${e.tone}`}>
              <Icon name={e.icon} size={18} />
            </span>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="cu-foot">
        <small dir="ltr">
          {t("cu.docId")}: {DOC_ID}
        </small>
        <div className="cu-foot-actions">
          <button type="button" className="sf-btn">
            <Icon name="download" size={16} />
            &nbsp;{t("cu.export")}
          </button>
          <button type="button" className="sf-btn">
            {t("cu.audit")}
          </button>
        </div>
      </footer>
    </DashboardLayout>
  );
}
