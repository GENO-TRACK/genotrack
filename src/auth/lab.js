// src/auth/lab.js
// Demo lab helpers. Replace with real API calls when the backend exists.
//
// A lab technician works on SAMPLES, not on patients. The demo samples below
// carry only the sample ID, the specimen type, the hospital that sent it and
// its lab status. A sample added from the admin "Add Sample" form can also
// carry the case ID, the subject name, the risk level and who transferred it;
// the admin pages show those, the lab pages ignore them.
//
// Sample life cycle in the lab:
//   received -> sequencing -> done        (a technician moves it forward)
//   a technician can also raise a FLAG on a sample; the sending hospital's
//   geneticist is notified (see listHospitalNotifications in grants.js).
//
// Every change is written to the sample's history (its custody timeline).
//
// Samples added from the admin "Add Sample" form are kept in localStorage and
// join the demo samples below (see addLabSample).

const LAB_STATE_KEY = "genotrack_lab_state";
const LAB_PREFS_KEY = "genotrack_lab_prefs";
const LAB_NOTIF_KEY = "genotrack_lab_notif_state";
const LAB_SESSIONS_KEY = "genotrack_lab_sessions";
const LAB_ADDED_KEY = "genotrack_lab_added";

export const CURRENT_LAB = {
  id: "central-lab",
  name: "GenoTrack Central Lab",
  nameAr: "المختبر المركزي لجينوتراك",
};

// Risk levels an admin can choose when adding a sample.
// "" means "not assessed yet".
export const LAB_RISK_LEVELS = ["", "low", "medium", "high"];

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

// Demo samples that reached the lab. `status` is the starting state;
// changes made by technicians are saved on top of it in localStorage.
const DEMO_LAB_SAMPLES = [
  {
    id: "GT-99281-X",
    hospital: "Cairo University Hospital",
    hospitalAr: "مستشفى القاهرة الجامعي",
    type: "buccal",
    receivedAt: "2026-11-14T08:10:00.000Z",
    status: "received",
    priority: "high",
    storage: "C-09 / Slot 442",
    temp: "-80.4",
  },
  {
    id: "GT-48210-L",
    hospital: "Cairo University Hospital",
    hospitalAr: "مستشفى القاهرة الجامعي",
    type: "blood",
    receivedAt: "2026-11-13T13:25:00.000Z",
    status: "received",
    priority: "normal",
    storage: "C-04 / Slot 118",
    temp: "-79.8",
  },
  {
    id: "GT-00129-Z",
    hospital: "Cairo University Hospital",
    hospitalAr: "مستشفى القاهرة الجامعي",
    type: "blood",
    receivedAt: "2026-11-12T09:40:00.000Z",
    status: "sequencing",
    priority: "high",
    storage: "C-04 / Slot 121",
    temp: "-80.1",
  },
  {
    id: "GT-88219-W",
    hospital: "Cairo University Hospital",
    hospitalAr: "مستشفى القاهرة الجامعي",
    type: "tissue",
    receivedAt: "2026-11-11T10:05:00.000Z",
    status: "done",
    priority: "normal",
    storage: "C-02 / Slot 007",
    temp: "-80.0",
  },
  {
    id: "GT-77310-Q",
    hospital: "Alexandria Main Hospital",
    hospitalAr: "مستشفى الإسكندرية الرئيسي",
    type: "blood",
    receivedAt: "2026-11-10T15:30:00.000Z",
    status: "received",
    priority: "normal",
    storage: "C-07 / Slot 330",
    temp: "-80.3",
  },
  {
    id: "GT-61544-M",
    hospital: "Ain Shams Maternity",
    hospitalAr: "مستشفى عين شمس للولادة",
    type: "buccal",
    receivedAt: "2026-11-14T11:15:00.000Z",
    status: "sequencing",
    priority: "high",
    storage: "C-09 / Slot 451",
    temp: "-80.2",
  },
];

// Samples added from the admin form (kept in localStorage).
function addedSamples() {
  return readJson(LAB_ADDED_KEY, []);
}

// Demo samples + the ones added from the admin form.
function allBaseSamples() {
  return [...addedSamples(), ...DEMO_LAB_SAMPLES];
}

// Storage places an admin can pick when adding a sample.
const STORAGE_PLACES = {
  cold04: { storage: "C-04 / Slot 200", temp: "-80.0" },
  queue1: { storage: "Q-01 / Intake queue", temp: "-20.0" },
  locker09: { storage: "C-09 / Slot 500", temp: "-80.2" },
};

// Hospitals an admin can pick when adding a sample.
export const LAB_HOSPITALS = [
  {
    id: "cairo-uni",
    name: "Cairo University Hospital",
    nameAr: "مستشفى القاهرة الجامعي",
  },
  {
    id: "alex-main",
    name: "Alexandria Main Hospital",
    nameAr: "مستشفى الإسكندرية الرئيسي",
  },
  {
    id: "ain-shams",
    name: "Ain Shams Maternity",
    nameAr: "مستشفى عين شمس للولادة",
  },
];

// Changes made in the lab: { [sampleId]: { status, flag, history: [...] } }
function labState() {
  return readJson(LAB_STATE_KEY, {});
}

function pushHistory(state, sampleId, entry) {
  const cur = state[sampleId] || {};
  const history = cur.history || [];
  history.unshift({ ...entry, at: new Date().toISOString() });
  state[sampleId] = { ...cur, history: history.slice(0, 50) };
}

// Returns every sample of the lab with its current status and flag.
// Samples added from the admin form also carry caseId, subject, risk and
// transferredBy (empty strings for the demo samples).
export async function listLabSamples() {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const state = labState();
  return allBaseSamples()
    .map((s) => {
      const own = state[s.id] || {};
      return {
        ...s,
        caseId: s.caseId || "",
        subject: s.subject || "",
        risk: s.risk || "",
        transferredBy: s.transferredBy || "",
        status: own.status || s.status,
        flagged: Boolean(own.flag),
        flagNote: own.flag ? own.flag.note : "",
        flagAt: own.flag ? own.flag.at : null,
        history: own.history || [],
      };
    })
    .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
}

// Adds a new sample to the lab queue (status "received").
// data: { id, hospitalId, type, priority, storage, staffId,
//         caseId, subject, risk, transferredBy, collectedAt }
// `risk` is "low", "medium", "high" or "" (not assessed yet).
// Throws "exists" when the ID is already used, "hospital" for an unknown hospital.
export async function addLabSample(data) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const id = String(data.id || "").trim();
  if (!id) throw new Error("id");
  if (allBaseSamples().some((s) => s.id === id)) throw new Error("exists");
  const hospital = LAB_HOSPITALS.find((h) => h.id === data.hospitalId);
  if (!hospital) throw new Error("hospital");
  const place = STORAGE_PLACES[data.storage] || STORAGE_PLACES.cold04;
  const transferredBy =
    String(data.transferredBy || "").trim() || data.staffId || "admin";
  const risk = LAB_RISK_LEVELS.includes(data.risk) ? data.risk : "";
  const sample = {
    id,
    hospital: hospital.name,
    hospitalAr: hospital.nameAr,
    type: data.type || "blood",
    receivedAt: new Date().toISOString(),
    collectedAt: data.collectedAt || "",
    status: "received",
    priority: data.priority === "standard" ? "normal" : "high",
    storage: place.storage,
    temp: place.temp,
    caseId: String(data.caseId || "").trim(),
    subject: String(data.subject || "").trim(),
    risk,
    transferredBy,
    addedBy: transferredBy,
  };
  const list = addedSamples();
  list.unshift(sample);
  writeJson(LAB_ADDED_KEY, list.slice(0, 200));
  return sample;
}

// Moves a sample forward: received -> sequencing -> done.
export async function advanceLabSample({ sampleId, staffId }) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const state = labState();
  const base = allBaseSamples().find((s) => s.id === sampleId);
  if (!base) throw new Error("not-found");
  const current = (state[sampleId] && state[sampleId].status) || base.status;
  if (current === "done") return current;
  const next = current === "received" ? "sequencing" : "done";
  state[sampleId] = { ...(state[sampleId] || {}), status: next };
  pushHistory(state, sampleId, { type: next, staffId: staffId || "unknown" });
  writeJson(LAB_STATE_KEY, state);
  return next;
}

// Raises a flag on a sample. The sending hospital's geneticist is notified.
export async function flagLabSample({ sampleId, staffId, note }) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const state = labState();
  const flag = {
    at: new Date().toISOString(),
    by: staffId || "unknown",
    note: String(note || "").trim(),
  };
  state[sampleId] = { ...(state[sampleId] || {}), flag };
  pushHistory(state, sampleId, {
    type: "flagged",
    staffId: staffId || "unknown",
    note: flag.note,
  });
  writeJson(LAB_STATE_KEY, state);
  return flag;
}

// Flags raised by technicians. The hospital side can read this to notify the
// geneticist of the hospital that sent the sample.
export function listRaisedLabFlags() {
  const state = labState();
  const base = allBaseSamples();
  return Object.keys(state)
    .filter((id) => state[id].flag)
    .map((id) => {
      const sample = base.find((s) => s.id === id);
      return {
        sampleId: id,
        hospital: sample ? sample.hospital : "",
        at: state[id].flag.at,
        by: state[id].flag.by,
        note: state[id].flag.note,
      };
    });
}

// Custody timeline of one sample: the received step plus every lab action.
// The received step shows who transferred the sample (the name typed on the
// admin form), or "courier" for the demo samples.
export async function getLabCustody(sampleId) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const base = allBaseSamples().find((s) => s.id === sampleId);
  if (!base) return null;
  const state = labState();
  const own = state[sampleId] || {};
  const events = [
    ...(own.history || []).map((h) => ({
      type: h.type,
      at: h.at,
      by: h.staffId,
      note: h.note || "",
    })),
    {
      type: "received",
      at: base.receivedAt,
      by: base.transferredBy || base.addedBy || "courier",
      note: "",
    },
  ];
  return {
    sample: {
      id: base.id,
      hospital: base.hospital,
      hospitalAr: base.hospitalAr,
      type: base.type,
      storage: base.storage,
      temp: base.temp,
      status: own.status || base.status,
      caseId: base.caseId || "",
      subject: base.subject || "",
      risk: base.risk || "",
    },
    events,
  };
}

// ---- Lab notifications (demo) ----
// Derived from the queue: new samples waiting, urgent samples, samples
// finished and the flags raised here. Read / dismissed state is per user.
function notifState(userId) {
  return readJson(LAB_NOTIF_KEY, {})[userId] || { read: [], dismissed: [] };
}

function saveNotifState(userId, state) {
  const all = readJson(LAB_NOTIF_KEY, {});
  all[userId] = state;
  writeJson(LAB_NOTIF_KEY, all);
}

export async function listLabNotifications({ userId = "unknown" } = {}) {
  const samples = await listLabSamples();
  const state = notifState(userId);
  const out = [];

  samples.forEach((s) => {
    if (s.status === "received") {
      out.push({
        id: `new-${s.id}`,
        kind: s.priority === "high" ? "urgent" : "newSample",
        tone: s.priority === "high" ? "alert" : "system",
        icon: s.priority === "high" ? "alert" : "dna",
        at: s.receivedAt,
        ref: s.id,
        hospital: s.hospital,
        hospitalAr: s.hospitalAr,
        link: "/lab/samples",
      });
    }
    if (s.status === "done") {
      out.push({
        id: `done-${s.id}`,
        kind: "done",
        tone: "match",
        icon: "check",
        at: s.receivedAt,
        ref: s.id,
        hospital: s.hospital,
        hospitalAr: s.hospitalAr,
        link: "/lab/samples",
      });
    }
    if (s.flagged) {
      out.push({
        id: `flag-${s.id}`,
        kind: "flagRaised",
        tone: "custody",
        icon: "flask",
        at: s.flagAt,
        ref: s.id,
        hospital: s.hospital,
        hospitalAr: s.hospitalAr,
        link: "/lab/custody",
      });
    }
  });

  return out
    .filter((n) => !state.dismissed.includes(n.id))
    .map((n) => ({ ...n, unread: !state.read.includes(n.id) }))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function markLabNotificationRead(userId, id) {
  const state = notifState(userId);
  if (!state.read.includes(id)) state.read.push(id);
  saveNotifState(userId, state);
}

export function markAllLabNotificationsRead(userId, ids) {
  const state = notifState(userId);
  ids.forEach((id) => {
    if (!state.read.includes(id)) state.read.push(id);
  });
  saveNotifState(userId, state);
}

export function dismissLabNotification(userId, id) {
  const state = notifState(userId);
  if (!state.dismissed.includes(id)) state.dismissed.push(id);
  saveNotifState(userId, state);
}

// ---- Lab settings (demo) ----
const DEFAULT_LAB_PREFS = {
  autoLock: "15",
  sound: true,
  mfa: true,
  urgentAlerts: true,
};

export function getLabPrefs(userId) {
  return {
    ...DEFAULT_LAB_PREFS,
    ...(readJson(LAB_PREFS_KEY, {})[userId] || {}),
  };
}

export function saveLabPrefs(userId, prefs) {
  const all = readJson(LAB_PREFS_KEY, {});
  all[userId] = prefs;
  writeJson(LAB_PREFS_KEY, all);
}

const DEMO_LAB_SESSIONS = [
  {
    id: "l1",
    icon: "desktop",
    name: "Lab workstation",
    nameAr: "محطة عمل المختبر",
    ip: "10.30.2.11",
    place: "Cairo, EG",
    placeAr: "القاهرة، مصر",
    current: true,
  },
  {
    id: "l2",
    icon: "phone",
    name: "Technician tablet",
    nameAr: "جهاز الفني اللوحي",
    ip: "10.30.2.40",
    place: "Cairo, EG",
    placeAr: "القاهرة، مصر",
    current: false,
  },
];

export async function listLabSessions(userId) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const revoked = readJson(LAB_SESSIONS_KEY, {})[userId] || [];
  return DEMO_LAB_SESSIONS.filter((s) => !revoked.includes(s.id));
}

export function revokeLabSession(userId, sessionId) {
  const all = readJson(LAB_SESSIONS_KEY, {});
  const list = all[userId] || [];
  if (!list.includes(sessionId)) list.push(sessionId);
  all[userId] = list;
  writeJson(LAB_SESSIONS_KEY, all);
}
