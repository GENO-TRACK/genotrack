// src/auth/grants.js
// Demo access-grant helpers. Replace with real API calls when the backend exists.
//
// A "grant" lets one staff member open one patient's global record for a limited time.
//   type: "otp"       -> the patient confirmed with a one-time code (normal visit)
//   type: "emergency" -> opened without OTP, with a written reason (logged)

import { listRaisedLabFlags } from "./lab";

const GRANTS_KEY = "genotrack_grants";
const LOG_KEY = "genotrack_access_log";
const NEWBORNS_KEY = "genotrack_newborns";
const RELEASES_KEY = "genotrack_report_releases";
const NOTIF_STATE_KEY = "genotrack_hospital_notif_state";
const PREFS_KEY = "genotrack_hospital_prefs";
const STAFF_KEY = "genotrack_hospital_staff";
const SESSIONS_KEY = "genotrack_hospital_sessions";

// How long an OTP grant lasts, and an emergency grant (milliseconds).
export const OTP_GRANT_MS = 24 * 60 * 60 * 1000;
export const EMERGENCY_GRANT_MS = 2 * 60 * 60 * 1000;

// Demo patients. The backend returns these from the global registry.
export const DEMO_PATIENTS = [
  {
    nationalId: "29801011234567",
    name: "Mariam Hassan",
    nameAr: "مريم حسن",
    age: 28,
    blood: "O+",
    hospital: "Cairo University Hospital",
    risk: "low",
    conditions: ["Gestational diabetes (2024)"],
    allergies: ["Penicillin"],
    medications: ["Folic acid 5 mg"],
    lastVisit: "2026-09-02",
  },
  {
    nationalId: "30511150123456",
    name: "Baby Doe #99281",
    nameAr: "المولود دو #99281",
    age: 0,
    blood: "A+",
    hospital: "Ain Shams Maternity",
    risk: "high",
    conditions: ["Lab flag: variant of interest in sample"],
    allergies: [],
    medications: [],
    lastVisit: "2026-11-14",
  },
  {
    nationalId: "27504201987654",
    name: "Omar Khaled",
    nameAr: "عمر خالد",
    age: 51,
    blood: "B+",
    hospital: "Alexandria Main Hospital",
    risk: "medium",
    conditions: ["Hypertension", "Family history of cardiomyopathy"],
    allergies: ["None known"],
    medications: ["Amlodipine 5 mg"],
    lastVisit: "2026-10-21",
  },
];

export function findPatient(nationalId) {
  const id = String(nationalId || "").trim();
  return DEMO_PATIENTS.find((p) => p.nationalId === id) || null;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- Access log (the patient sees this in the mobile app too) ----
export function getAccessLog() {
  return readJson(LOG_KEY, []);
}

export function logAccess(entry) {
  const log = getAccessLog();
  log.unshift({ ...entry, at: new Date().toISOString() });
  writeJson(LOG_KEY, log.slice(0, 200));
}

// ---- Grants ----
function allGrants() {
  return readJson(GRANTS_KEY, {});
}

export function getGrant(nationalId) {
  const grant = allGrants()[nationalId];
  if (!grant) return null;
  if (new Date(grant.expiresAt).getTime() <= Date.now()) return null;
  return grant;
}

export function createGrant({ patientId, type, staffId, reason = "" }) {
  const ms = type === "emergency" ? EMERGENCY_GRANT_MS : OTP_GRANT_MS;
  const grant = {
    patientId,
    type,
    staffId,
    reason,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ms).toISOString(),
  };
  const grants = allGrants();
  grants[patientId] = grant;
  writeJson(GRANTS_KEY, grants);
  logAccess({ patientId, type, staffId, reason });
  return grant;
}

export function revokeGrant(patientId) {
  const grants = allGrants();
  delete grants[patientId];
  writeJson(GRANTS_KEY, grants);
}

// ---- OTP (demo) ----
// The real backend sends the code to the patient's mobile app and checks it.
// Demo rule: any 4-digit code passes.
export async function requestPatientOtp(patientId) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log("OTP sent to patient app:", patientId);
}

export async function verifyPatientOtp(patientId, code) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!/^\d{4}$/.test(String(code))) {
    throw new Error("invalid");
  }
  return true;
}

// ---- Newborn registration (demo) ----
// The backend creates ONE global record, visible to every hospital.
// Here the newborns are kept in localStorage so you can see the flow.

// Looks a parent up in the global registry by National ID.
// Returns the patient (demo registry + newborns registered here) or null.
export async function lookupParent(nationalId) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const found = findPatient(nationalId);
  return found || null;
}

export function getNewborns() {
  return readJson(NEWBORNS_KEY, []);
}

// data: { name, hospitalId, dob, motherId, fatherId, staffId, hospital }
export async function registerNewborn(data) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const list = getNewborns();
  const record = {
    recordId: `GT-NB-${String(10000 + list.length + 1)}`,
    registeredAt: new Date().toISOString(),
    consent: true,
    ...data,
  };
  list.unshift(record);
  writeJson(NEWBORNS_KEY, list.slice(0, 200));
  logAccess({
    patientId: record.recordId,
    type: "registration",
    staffId: data.staffId || "unknown",
    reason: "",
  });
  return record;
}

// ---- Hospital samples (demo) ----
// Hospital operational data is PRIVATE per hospital: each hospital only sees
// its own samples. The backend filters by the signed-in staff member's hospital.
// Demo: the signed-in hospital is fixed here. Replace with the real value
// from the session / API later.
export const CURRENT_HOSPITAL = {
  id: "cairo-uni",
  name: "Cairo University Hospital",
  nameAr: "مستشفى القاهرة الجامعي",
};

// Demo samples for several hospitals. Only the current hospital's are shown.
const DEMO_SAMPLES = [
  {
    id: "GT-99281-X",
    hospitalId: "cairo-uni",
    name: "Baby Doe #99281",
    nameAr: "المولود دو #99281",
    ward: "NICU · Bed 12-A",
    wardAr: "العناية المركزة · سرير 12-A",
    type: "buccal",
    date: "2026-11-14",
    caseId: "C-4421-B",
    risk: "high",
    status: "matched",
  },
  {
    id: "GT-48210-L",
    hospitalId: "cairo-uni",
    name: "Sarah Jenkins",
    nameAr: "سارة جنكينز",
    ward: "Post-Op Recovery",
    wardAr: "التعافي بعد الجراحة",
    type: "blood",
    date: "2026-11-13",
    caseId: "C-1290-A",
    risk: "low",
    status: "pending",
  },
  {
    id: "GT-00129-Z",
    hospitalId: "cairo-uni",
    name: "Baby Roe #00129",
    nameAr: "المولود رو #00129",
    ward: "NICU · Bed 04-B",
    wardAr: "العناية المركزة · سرير 04-B",
    type: "blood",
    date: "2026-11-12",
    caseId: "C-9910-K",
    risk: "medium",
    status: "analyzed",
  },
  {
    id: "GT-88219-W",
    hospitalId: "cairo-uni",
    name: "Mark Thompson",
    nameAr: "مارك تومسون",
    ward: "General Ward 3",
    wardAr: "العنبر العام 3",
    type: "tissue",
    date: "2026-11-11",
    caseId: "C-0021-M",
    risk: "low",
    status: "matched",
  },
  // Another hospital: must NEVER appear for Cairo University Hospital.
  {
    id: "GT-77310-Q",
    hospitalId: "alex-main",
    name: "Hidden Patient",
    nameAr: "مريض آخر",
    ward: "Ward 2",
    wardAr: "العنبر 2",
    type: "blood",
    date: "2026-11-10",
    caseId: "C-7731-Q",
    risk: "low",
    status: "pending",
  },
];

// Newborns registered on the Newborn page become samples of this hospital.
function newbornToSample(nb) {
  return {
    id: nb.recordId,
    hospitalId: CURRENT_HOSPITAL.id,
    name: nb.name,
    nameAr: nb.name,
    ward: "Newborn registry",
    wardAr: "سجل المواليد",
    type: nb.method === "buccal" ? "buccal" : "blood",
    date: String(nb.registeredAt || "").slice(0, 10),
    caseId: nb.hospitalId || "-",
    risk: "low",
    status: "pending",
  };
}

// Returns only the samples of the given hospital (newest first).
export async function listHospitalSamples(hospitalId = CURRENT_HOSPITAL.id) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const own = DEMO_SAMPLES.filter((s) => s.hospitalId === hospitalId);
  const born = getNewborns()
    .map(newbornToSample)
    .filter((s) => s.hospitalId === hospitalId);
  return [...born, ...own].sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---- Report release (demo) ----
// A genetic report stays a DRAFT until the geneticist releases it to the patient.
// Only a geneticist may release. Each release is written to the access log
// with type "release".
//
// Demo reports: one per analysed sample of the hospital.
const DEMO_REPORTS = [
  {
    sampleId: "GT-99281-X",
    hospitalId: "cairo-uni",
    reportId: "GR-99281-A",
    score: 8.1,
    level: "high",
    finding: "Cardiomyopathy (TTN gene)",
    findingAr: "اعتلال عضلة القلب (جين TTN)",
    date: "2026-11-14",
  },
  {
    sampleId: "GT-00129-Z",
    hospitalId: "cairo-uni",
    reportId: "GR-00129-B",
    score: 5.4,
    level: "medium",
    finding: "Metabolic deficiency (ASL)",
    findingAr: "قصور أيضي (ASL)",
    date: "2026-11-12",
  },
];

function allReleases() {
  return readJson(RELEASES_KEY, {});
}

// Returns only this hospital's reports, each with its release state.
export async function listHospitalReports(hospitalId = CURRENT_HOSPITAL.id) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const releases = allReleases();
  const samples = DEMO_SAMPLES.filter((s) => s.hospitalId === hospitalId);
  return DEMO_REPORTS.filter((r) => r.hospitalId === hospitalId)
    .map((r) => {
      const sample = samples.find((s) => s.id === r.sampleId);
      const release = releases[r.reportId] || null;
      return {
        ...r,
        patientName: sample ? sample.name : r.sampleId,
        patientNameAr: sample ? sample.nameAr : r.sampleId,
        released: Boolean(release),
        releasedAt: release ? release.at : null,
        releasedBy: release ? release.by : null,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Releases a report to the patient. The caller must be a geneticist;
// the page also hides the button for everyone else.
export async function releaseReport({ reportId, staffId }) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const releases = allReleases();
  if (releases[reportId]) return releases[reportId];
  const entry = { at: new Date().toISOString(), by: staffId || "unknown" };
  releases[reportId] = entry;
  writeJson(RELEASES_KEY, releases);
  logAccess({
    patientId: reportId,
    type: "release",
    staffId: entry.by,
    reason: "",
  });
  return entry;
}

// ---- Hospital families (demo) ----
// One entry per newborn registered at this hospital, with the parents the
// officer CONFIRMED at registration (the parent match is never automatic).
// The backend returns only the signed-in hospital's newborns.

// Demo newborns so the page is not empty before you register one.
const DEMO_FAMILIES = [
  {
    recordId: "GT-NB-09001",
    hospitalId: "cairo-uni",
    hospitalNumber: "CU-2026-1187",
    childName: "Baby Hassan",
    childNameAr: "المولود حسن",
    dob: "2026-11-10",
    registeredAt: "2026-11-10",
    staffId: "H1",
    motherId: "29801011234567",
    fatherId: "27504201987654",
  },
  {
    recordId: "GT-NB-09002",
    hospitalId: "cairo-uni",
    hospitalNumber: "CU-2026-1203",
    childName: "Baby Khaled",
    childNameAr: "المولود خالد",
    dob: "2026-11-12",
    registeredAt: "2026-11-12",
    staffId: "H1",
    motherId: "29801011234567",
    fatherId: "",
  },
  {
    recordId: "GT-NB-09003",
    hospitalId: "cairo-uni",
    hospitalNumber: "CU-2026-1219",
    childName: "Baby Noor",
    childNameAr: "المولودة نور",
    dob: "2026-11-13",
    registeredAt: "2026-11-13",
    staffId: "HA1",
    motherId: "",
    fatherId: "",
  },
  // Another hospital: must NEVER appear for Cairo University Hospital.
  {
    recordId: "GT-NB-09100",
    hospitalId: "alex-main",
    hospitalNumber: "AM-2026-0042",
    childName: "Hidden Baby",
    childNameAr: "مولود آخر",
    dob: "2026-11-09",
    registeredAt: "2026-11-09",
    staffId: "H9",
    motherId: "27504201987654",
    fatherId: "",
  },
];

function parentInfo(nationalId) {
  if (!nationalId) return null;
  const p = findPatient(nationalId);
  // A parent that is not in the demo registry still shows, with the ID only.
  return p
    ? { nationalId: p.nationalId, name: p.name, nameAr: p.nameAr }
    : { nationalId, name: nationalId, nameAr: nationalId };
}

// Newborns registered on the Newborn page for this hospital.
function newbornToFamily(nb) {
  return {
    recordId: nb.recordId,
    hospitalId: CURRENT_HOSPITAL.id,
    hospitalNumber: nb.hospitalId || "",
    childName: nb.name,
    childNameAr: nb.name,
    dob: nb.dob || "",
    registeredAt: String(nb.registeredAt || "").slice(0, 10),
    staffId: nb.staffId || "unknown",
    motherId: nb.motherId || "",
    fatherId: nb.fatherId || "",
  };
}

// Returns only the families of the given hospital (newest first).
export async function listHospitalFamilies(hospitalId = CURRENT_HOSPITAL.id) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const own = DEMO_FAMILIES.filter((f) => f.hospitalId === hospitalId);
  const born = getNewborns()
    .map(newbornToFamily)
    .filter((f) => f.hospitalId === hospitalId);
  return [...born, ...own]
    .map((f) => ({
      recordId: f.recordId,
      hospitalId: f.hospitalNumber,
      childName: f.childName,
      childNameAr: f.childNameAr,
      dob: f.dob,
      registeredAt: f.registeredAt,
      staffId: f.staffId,
      mother: parentInfo(f.motherId),
      father: parentInfo(f.fatherId),
    }))
    .sort((a, b) => (a.registeredAt < b.registeredAt ? 1 : -1));
}

// ---- Hospital notifications (demo) ----
// Notifications are DERIVED from what already happens in the hospital:
//   - lab flags on this hospital's samples
//   - reports waiting for release / reports released
//   - patient records opened by OTP or in an emergency (access log)
//   - newborns registered
// The backend would push real events. Here they are rebuilt from the demo
// data and the local access log every time the page opens.
//
// Read / dismissed state is kept per signed-in user in localStorage.

// Lab flags (demo): a flag the lab raised on one of this hospital's samples.
const DEMO_LAB_FLAGS = [
  {
    id: "lab-GT-99281-X",
    hospitalId: "cairo-uni",
    sampleId: "GT-99281-X",
    at: "2026-11-14T09:30:00.000Z",
  },
];

// Hospital names the lab stores (text) -> hospital ids used here.
// The backend would send the hospital id with the flag.
const HOSPITAL_IDS_BY_NAME = {
  "Cairo University Hospital": "cairo-uni",
  "Alexandria Main Hospital": "alex-main",
};

// Flags the lab technicians really raised in the lab pages, for one hospital.
// Only flags on samples sent by that hospital are returned.
function raisedLabFlagsFor(hospitalId) {
  return listRaisedLabFlags()
    .filter((f) => HOSPITAL_IDS_BY_NAME[f.hospital] === hospitalId)
    .map((f) => ({
      id: `lab-${f.sampleId}`,
      hospitalId,
      sampleId: f.sampleId,
      at: f.at,
      by: f.by,
      note: f.note,
    }));
}

function notifState(userId) {
  return readJson(NOTIF_STATE_KEY, {})[userId] || { read: [], dismissed: [] };
}

function saveNotifState(userId, state) {
  const all = readJson(NOTIF_STATE_KEY, {});
  all[userId] = state;
  writeJson(NOTIF_STATE_KEY, all);
}

// Builds the notification list for the signed-in staff member.
// hospitalRole decides which kinds they receive:
//   geneticist      -> lab flags + reports waiting + reports released
//   hospital_admin  -> emergency openings + OTP openings + newborns + reports released
//   staff           -> newborns registered + reports released
export async function listHospitalNotifications({
  hospitalId = CURRENT_HOSPITAL.id,
  userId = "unknown",
  hospitalRole = "staff",
} = {}) {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const state = notifState(userId);
  const releases = allReleases();
  const samples = DEMO_SAMPLES.filter((s) => s.hospitalId === hospitalId);
  const reports = DEMO_REPORTS.filter((r) => r.hospitalId === hospitalId);
  const out = [];

  // Lab flags: the demo flag plus the flags raised in the lab pages.
  // A real flag on the same sample replaces the demo one (one alert per sample).
  if (hospitalRole === "geneticist") {
    const raised = raisedLabFlagsFor(hospitalId);
    const raisedSamples = raised.map((f) => f.sampleId);
    const flags = [
      ...DEMO_LAB_FLAGS.filter(
        (f) =>
          f.hospitalId === hospitalId && !raisedSamples.includes(f.sampleId),
      ),
      ...raised,
    ];
    flags.forEach((f) => {
      const sample = samples.find((s) => s.id === f.sampleId);
      out.push({
        id: f.id,
        kind: "labFlag",
        tone: "alert",
        icon: "flask",
        at: f.at,
        subject: sample ? sample.name : f.sampleId,
        subjectAr: sample ? sample.nameAr : f.sampleId,
        ref: f.sampleId,
        by: f.by || "",
        reason: f.note || "",
        link: "/hospital/risk",
      });
    });
  }

  // Reports waiting for release (geneticist) / released (everyone)
  reports.forEach((r) => {
    const sample = samples.find((s) => s.id === r.sampleId);
    const release = releases[r.reportId];
    const subject = sample ? sample.name : r.sampleId;
    const subjectAr = sample ? sample.nameAr : r.sampleId;
    if (!release && hospitalRole === "geneticist") {
      out.push({
        id: `wait-${r.reportId}`,
        kind: "reportWaiting",
        tone: "system",
        icon: "report",
        at: `${r.date}T12:00:00.000Z`,
        subject,
        subjectAr,
        ref: r.reportId,
        link: "/hospital/reports",
      });
    }
    if (release) {
      out.push({
        id: `rel-${r.reportId}`,
        kind: "reportReleased",
        tone: "match",
        icon: "share",
        at: release.at,
        subject,
        subjectAr,
        ref: r.reportId,
        by: release.by,
        link: "/hospital/reports",
      });
    }
  });

  // Access-log based (hospital admin only)
  const log = getAccessLog();
  if (hospitalRole === "hospital_admin") {
    log.forEach((e, i) => {
      if (e.type === "emergency" || e.type === "otp") {
        const p = findPatient(e.patientId);
        out.push({
          id: `log-${e.at}-${i}`,
          kind: e.type === "emergency" ? "emergency" : "otpOpen",
          tone: e.type === "emergency" ? "alert" : "custody",
          icon: e.type === "emergency" ? "alert" : "lock",
          at: e.at,
          subject: p ? p.name : e.patientId,
          subjectAr: p ? p.nameAr : e.patientId,
          ref: e.patientId,
          by: e.staffId,
          reason: e.reason || "",
          link: "/hospital/accesslog",
        });
      }
    });
  }

  // Newborns registered (hospital admin + staff)
  if (hospitalRole === "hospital_admin" || hospitalRole === "staff") {
    getNewborns()
      .filter(() => true)
      .forEach((nb) => {
        out.push({
          id: `nb-${nb.recordId}`,
          kind: "newborn",
          tone: "match",
          icon: "baby",
          at: nb.registeredAt,
          subject: nb.name,
          subjectAr: nb.name,
          ref: nb.recordId,
          by: nb.staffId || "unknown",
          link: "/hospital/family",
        });
      });
  }

  return out
    .filter((n) => !state.dismissed.includes(n.id))
    .map((n) => ({ ...n, unread: !state.read.includes(n.id) }))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function markNotificationRead(userId, id) {
  const state = notifState(userId);
  if (!state.read.includes(id)) state.read.push(id);
  saveNotifState(userId, state);
}

export function markAllNotificationsRead(userId, ids) {
  const state = notifState(userId);
  ids.forEach((id) => {
    if (!state.read.includes(id)) state.read.push(id);
  });
  saveNotifState(userId, state);
}

export function dismissNotification(userId, id) {
  const state = notifState(userId);
  if (!state.dismissed.includes(id)) state.dismissed.push(id);
  saveNotifState(userId, state);
}

// ---- Hospital settings (demo) ----
// Preferences are kept per signed-in user. The staff list belongs to the
// hospital: only a hospital admin may see and change it (the page hides it
// for everyone else, and the backend must check the role again).

const DEFAULT_PREFS = {
  autoLock: "15",
  sound: true,
  mfa: true,
  otpNotice: true,
};

export function getHospitalPrefs(userId) {
  return { ...DEFAULT_PREFS, ...(readJson(PREFS_KEY, {})[userId] || {}) };
}

export function saveHospitalPrefs(userId, prefs) {
  const all = readJson(PREFS_KEY, {});
  all[userId] = prefs;
  writeJson(PREFS_KEY, all);
}

// Demo sign-in devices of the signed-in person. Revoking one is remembered.
const DEMO_SESSIONS = [
  {
    id: "s1",
    icon: "desktop",
    name: "Hospital workstation",
    nameAr: "محطة عمل المستشفى",
    ip: "10.20.4.18",
    place: "Cairo, EG",
    placeAr: "القاهرة، مصر",
    current: true,
  },
  {
    id: "s2",
    icon: "phone",
    name: "Staff mobile",
    nameAr: "هاتف الموظف",
    ip: "10.20.7.52",
    place: "Giza, EG",
    placeAr: "الجيزة، مصر",
    current: false,
  },
];

export async function listHospitalSessions(userId) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const revoked = readJson(SESSIONS_KEY, {})[userId] || [];
  return DEMO_SESSIONS.filter((s) => !revoked.includes(s.id));
}

export function revokeHospitalSession(userId, sessionId) {
  const all = readJson(SESSIONS_KEY, {});
  const list = all[userId] || [];
  if (!list.includes(sessionId)) list.push(sessionId);
  all[userId] = list;
  writeJson(SESSIONS_KEY, all);
}

// Demo staff of every hospital. Only the requested hospital's staff is returned.
// role: hospital_admin | geneticist | staff     status: active | suspended
const DEMO_STAFF = [
  {
    id: "HA1",
    hospitalId: "cairo-uni",
    name: "Dr. Layla Mansour",
    nameAr: "د. ليلى منصور",
    role: "hospital_admin",
    status: "active",
  },
  {
    id: "HG1",
    hospitalId: "cairo-uni",
    name: "Dr. Karim Nabil",
    nameAr: "د. كريم نبيل",
    role: "geneticist",
    status: "active",
  },
  {
    id: "H1",
    hospitalId: "cairo-uni",
    name: "Salma Adel",
    nameAr: "سلمى عادل",
    role: "staff",
    status: "active",
  },
  {
    id: "H2",
    hospitalId: "cairo-uni",
    name: "Youssef Fathy",
    nameAr: "يوسف فتحي",
    role: "staff",
    status: "suspended",
  },
  // Another hospital: must NEVER appear for Cairo University Hospital.
  {
    id: "H9",
    hospitalId: "alex-main",
    name: "Hidden Staff",
    nameAr: "موظف آخر",
    role: "staff",
    status: "active",
  },
];

// Changes made by the hospital admin are saved on top of the demo list.
function staffOverrides() {
  return readJson(STAFF_KEY, {});
}

export async function listHospitalStaff({
  hospitalId = CURRENT_HOSPITAL.id,
  userId = "",
} = {}) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const over = staffOverrides();
  const list = DEMO_STAFF.filter((s) => s.hospitalId === hospitalId).map(
    (s) => ({ ...s, ...(over[s.id] || {}) }),
  );
  // The signed-in person always appears, even if their ID is not in the demo list.
  const me = String(userId || "").toUpperCase();
  if (me && me !== "UNKNOWN" && !list.some((s) => s.id.toUpperCase() === me)) {
    list.unshift({
      id: userId,
      hospitalId,
      name: userId,
      nameAr: userId,
      role: "hospital_admin",
      status: "active",
      ...(over[userId] || {}),
    });
  }
  return list;
}

export function setStaffRole(staffId, role) {
  const over = staffOverrides();
  over[staffId] = { ...(over[staffId] || {}), role };
  writeJson(STAFF_KEY, over);
}

export function setStaffStatus(staffId, status) {
  const over = staffOverrides();
  over[staffId] = { ...(over[staffId] || {}), status };
  writeJson(STAFF_KEY, over);
}
