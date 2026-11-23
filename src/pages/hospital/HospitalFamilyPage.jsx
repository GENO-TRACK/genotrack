import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout, {
  Icon,
} from "../../components/dashboard/DashboardLayout";
import { useLanguage } from "../../i18n/useLanguage";
import { CURRENT_HOSPITAL, listHospitalFamilies } from "../../auth/grants";
import "../admin/AdminDashboard.css";
import "../admin/SamplesPage.css";
import "../admin/ComparisonPage.css";
import "../admin/FamilyPage.css";
import "./HospitalFamily.css";

export default function HospitalFamilyPage() {
  const { t, lang } = useLanguage();
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");

  // Only this hospital's families are loaded.
  useEffect(() => {
    let alive = true;
    listHospitalFamilies(CURRENT_HOSPITAL.id).then((list) => {
      if (!alive) return;
      setFamilies(list);
      setSelectedId(list[0] ? list[0].recordId : "");
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const summary = useMemo(
    () => ({
      total: families.length,
      complete: families.filter((f) => f.mother && f.father).length,
      partial: families.filter((f) => (f.mother ? 1 : 0) + (f.father ? 1 : 0) === 1)
        .length,
      none: families.filter((f) => !f.mother && !f.father).length,
    }),
    [families],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return families;
    return families.filter(
      (f) =>
        f.recordId.toLowerCase().includes(q) ||
        f.childName.toLowerCase().includes(q) ||
        f.childNameAr.includes(query.trim()),
    );
  }, [families, query]);

  const selected =
    families.find((f) => f.recordId === selectedId) || filtered[0] || null;

  const childName = (f) => (lang === "ar" ? f.childNameAr : f.childName);
  const personName = (p) => (lang === "ar" && p.nameAr ? p.nameAr : p.name);

  function status(f) {
    const n = (f.mother ? 1 : 0) + (f.father ? 1 : 0);
    return n === 2 ? "complete" : n === 1 ? "partial" : "none";
  }

  return (
    <DashboardLayout role="hospital_staff">
      {/* Header */}
      <section className="ad-head">
        <div>
          <span className="ad-tag fm-online">
            <i /> {t("hf.tag")}
          </span>
          <h1>
            {t("hf.title1")} <span>{t("hf.title2")}</span>
          </h1>
          <p>{t("hf.subtitle", { hospital: CURRENT_HOSPITAL.name })}</p>
        </div>
        <Link to="/hospital/newborn" className="sm-add">
          <Icon name="plus" size={18} /> {t("hf.register")}
        </Link>
      </section>

      {/* Summary */}
      <section className="ad-stats">
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("hf.sum.total")}</span>
            <i className="sm-pip teal" />
          </div>
          <strong>{summary.total}</strong>
        </article>
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("hf.sum.complete")}</span>
            <i className="sm-pip blue" />
          </div>
          <strong>{summary.complete}</strong>
        </article>
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("hf.sum.partial")}</span>
            <i className="sm-pip amber" />
          </div>
          <strong>{summary.partial}</strong>
        </article>
        <article className="ad-card ad-stat">
          <div className="ad-stat-top">
            <span>{t("hf.sum.none")}</span>
            <i className="sm-pip red" />
          </div>
          <strong>{summary.none}</strong>
        </article>
      </section>

      {loading && <p className="ps-hint">{t("hf.loading")}</p>}

      {!loading && families.length === 0 && (
        <div className="ad-card hf-empty">
          <span className="fm-ico-sm">
            <Icon name="people" size={22} />
          </span>
          <h3>{t("hf.empty.title")}</h3>
          <p>{t("hf.empty.text")}</p>
        </div>
      )}

      {!loading && families.length > 0 && (
        <section className="hf-layout">
          {/* Left: list of newborns */}
          <aside className="ad-card hf-list">
            <label className="sm-input hf-search">
              <Icon name="search" size={18} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("hf.searchPh")}
              />
            </label>

            <ul>
              {filtered.length === 0 && (
                <li className="hf-none">{t("hf.noMatch")}</li>
              )}
              {filtered.map((f) => (
                <li key={f.recordId}>
                  <button
                    type="button"
                    className={selected && selected.recordId === f.recordId ? "on" : ""}
                    onClick={() => setSelectedId(f.recordId)}
                  >
                    <span className="hf-ico">
                      <Icon name="baby" size={20} />
                    </span>
                    <span className="hf-who">
                      <b>{childName(f)}</b>
                      <small dir="ltr">{f.recordId}</small>
                    </span>
                    <em className={`hf-state ${status(f)}`}>
                      {t(`hf.state.${status(f)}`)}
                    </em>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Right: the pedigree of the selected newborn */}
          {selected && (
            <div className="hf-detail">
              <section className="ad-card fm-tree">
                <div className="fm-parents">
                  {[
                    { id: "paternal", parent: selected.father },
                    { id: "maternal", parent: selected.mother },
                  ].map(({ id, parent }) => (
                    <article
                      key={id}
                      className={`fm-person ${id} ${parent ? "" : "hf-empty-parent"}`}
                    >
                      <header>
                        <span className="fm-link">
                          {t(`fm.${id}Source`)}
                        </span>
                        <span className="fm-ico">
                          <Icon name="user" size={22} />
                        </span>
                      </header>

                      {parent ? (
                        <>
                          <h3>{personName(parent)}</h3>
                          <code dir="ltr">{parent.nationalId}</code>
                          <div className="hf-confirmed">
                            <Icon name="check" size={14} />{" "}
                            {t("hf.parentConfirmed")}
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 className="hf-muted">{t("hf.notLinked")}</h3>
                          <small>{t("hf.notLinkedText")}</small>
                        </>
                      )}
                    </article>
                  ))}
                </div>

                <div className="fm-connector" aria-hidden="true">
                  <i className="left" />
                  <i className="center" />
                  <i className="right" />
                </div>

                <article className="fm-child">
                  <span className="fm-child-ico">
                    <Icon name="baby" size={26} />
                  </span>
                  <small>
                    {t("fm.subject")}: <b dir="ltr">{selected.recordId}</b>
                  </small>
                  <h2>{childName(selected)}</h2>
                  <em
                    className={`fm-confirmed hf-badge ${status(selected)}`}
                  >
                    <Icon name="shield" size={14} />{" "}
                    {t(`hf.lineage.${status(selected)}`)}
                  </em>
                </article>
              </section>

              {/* Details */}
              <section className="ad-card hf-facts">
                <div className="fm-card-title">
                  <span className="fm-ico-sm">
                    <Icon name="chart" size={20} />
                  </span>
                  <h3>{t("hf.details")}</h3>
                </div>
                <dl>
                  <div>
                    <dt>{t("hf.f.record")}</dt>
                    <dd dir="ltr">{selected.recordId}</dd>
                  </div>
                  <div>
                    <dt>{t("hf.f.hospitalId")}</dt>
                    <dd dir="ltr">{selected.hospitalId || "-"}</dd>
                  </div>
                  <div>
                    <dt>{t("hf.f.dob")}</dt>
                    <dd dir="ltr">{selected.dob || "-"}</dd>
                  </div>
                  <div>
                    <dt>{t("hf.f.registered")}</dt>
                    <dd dir="ltr">{selected.registeredAt}</dd>
                  </div>
                  <div>
                    <dt>{t("hf.f.by")}</dt>
                    <dd dir="ltr">{selected.staffId}</dd>
                  </div>
                </dl>
                <p className="hf-note">
                  <Icon name="lock" size={14} /> {t("hf.privacyNote")}
                </p>
              </section>
            </div>
          )}
        </section>
      )}
    </DashboardLayout>
  );
}
