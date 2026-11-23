// src/auth/police.js
// Demo police helpers. Replace with real API calls when the backend exists.
//
// Two kinds of case:
//   missing -> a FAMILY reports a missing child.
//              The sample is taken from the FAMILY (a parent or relative).
//              The search compares the family's DNA with the registered children.
//   found   -> someone FOUND a child and handed him / her to the police.
//              The sample is taken from the CHILD.
//              The search compares the child's DNA with the registered children
//              and with the open Missing Child cases.
//
// Case life cycle:
//   open -> sampleRequested -> sampleReceived -> searching -> matched | noMatch
//   matched -> resolved (after the officer confirms the match in writing)
//   any case can be closed and reopened by an officer.
//
// Privacy: police only get "match / no match", a similarity percentage and the
// name of the hospital that holds the record. Never a medical record.
//
// Every action is written to the case log with the officer's ID.

const CASES_KEY = "genotrack_police_cases";
const PREFS_KEY = "genotrack_police_prefs";
const NOTIF_KEY = "genotrack_police_notif_state";
const SESSIONS_KEY = "genotrack_police_sessions";

export const CURRENT_STATION = {
  id: "cairo-central",
  name: "Cairo Central Police Station",
  nameAr: "قسم شرطة القاهرة المركزي",
};

// Places where a DNA sample can be taken (hospital or lab).
export const SAMPLE_PLACES = [
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
  {
    id: "central-lab",
    name: "GenoTrack Central Lab",
    nameAr: "المختبر المركزي لجينوتراك",
  },
];

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

// ---- Demo registry the search looks into ----
// Registered children (the backend searches the global registry).
// `hospital` is the hospital that holds the record; police never get more.
// `familyKey` links a child to a family sample in the demo.
const REGISTERED_CHILDREN = [
  {
    recordId: "GT-NB-09001",
    hospital: "Cairo University Hospital",
    hospitalAr: "مستشفى القاهرة الجامعي",
    familyKey: "hassan",
  },
  {
    recordId: "GT-NB-09002",
    hospital: "Cairo University Hospital",
    hospitalAr: "مستشفى القاهرة الجامعي",
    familyKey: "khaled",
  },
  {
    recordId: "GT-NB-09003",
    hospital: "Cairo University Hospital",
    hospitalAr: "مستشفى القاهرة الجامعي",
    familyKey: "noor",
  },
  {
    recordId: "GT-NB-09100",
    hospital: "Alexandria Main Hospital",
    hospitalAr: "مستشفى الإسكندرية الرئيسي",
    familyKey: "alex",
  },
];

// Demo cases. `familyKey` (Missing Child) or `childKey` (Found Child) is the
// hidden key the demo search uses to decide match / no match. The real
// backend compares the DNA profiles instead.
const DEMO_CASES = [
  {
    id: "MC-2026-014",
    type: "missing",
    priority: "high",
    status: "sampleReceived",
    openedAt: "2026-11-17T09:20:00.000Z",
    openedBy: "P1",
    childName: "Youssef Hassan",
    childAge: "2",
    gender: "male",
    place: "Shubra, Cairo",
    placeAr: "شبرا، القاهرة",
    when: "2026-11-16",
    reporter: "Ahmed Hassan",
    relation: "Father",
    contact: "01012345678",
    description: "Brown hair, red jacket.",
    samplePlace: "cairo-uni",
    searchKey: "hassan",
    result: null,
    log: [
      { type: "opened", by: "P1", at: "2026-11-17T09:20:00.000Z" },
      { type: "sampleRequested", by: "P1", at: "2026-11-17T09:40:00.000Z" },
      { type: "sampleReceived", by: "system", at: "2026-11-18T11:05:00.000Z" },
    ],
  },
  {
    id: "MC-2026-015",
    type: "missing",
    priority: "normal",
    status: "sampleRequested",
    openedAt: "2026-11-19T13:00:00.000Z",
    openedBy: "P1",
    childName: "Nour Samir",
    childAge: "4",
    gender: "female",
    place: "Giza",
    placeAr: "الجيزة",
    when: "2026-11-18",
    reporter: "Samir Ali",
    relation: "Father",
    contact: "01155550000",
    description: "Black hair, school uniform.",
    samplePlace: "cairo-uni",
    searchKey: "none",
    result: null,
    log: [
      { type: "opened", by: "P1", at: "2026-11-19T13:00:00.000Z" },
      { type: "sampleRequested", by: "P1", at: "2026-11-19T13:20:00.000Z" },
    ],
  },
  {
    id: "FC-2026-007",
    type: "found",
    priority: "high",
    status: "sampleReceived",
    openedAt: "2026-11-18T07:45:00.000Z",
    openedBy: "P2",
    childName: "",
    childAge: "3",
    gender: "female",
    place: "Ramses Station, Cairo",
    placeAr: "محطة رمسيس، القاهرة",
    when: "2026-11-18",
    reporter: "Mona Ibrahim",
    relation: "Passer-by",
    contact: "01299998888",
    description: "Pink dress, does not know her name.",
    samplePlace: "central-lab",
    searchKey: "noor",
    result: null,
    log: [
      { type: "opened", by: "P2", at: "2026-11-18T07:45:00.000Z" },
      { type: "sampleRequested", by: "P2", at: "2026-11-18T08:00:00.000Z" },
      { type: "sampleReceived", by: "system", at: "2026-11-19T10:30:00.000Z" },
    ],
  },
  {
    id: "FC-2026-008",
    type: "found",
    priority: "normal",
    status: "open",
    openedAt: "2026-11-20T16:10:00.000Z",
    openedBy: "P2",
    childName: "",
    childAge: "1",
    gender: "male",
    place: "Maadi, Cairo",
    placeAr: "المعادي، القاهرة",
    when: "2026-11-20",
    reporter: "Hany Fouad",
    relation: "Passer-by",
    contact: "01077776666",
    description: "Wrapped in a blue blanket.",
    samplePlace: "",
    searchKey: "none",
    result: null,
    log: [{ type: "opened", by: "P2", at: "2026-11-20T16:10:00.000Z" }],
  },
  {
    id: "MC-2026-009",
    type: "missing",
    priority: "normal",
    status: "resolved",
    openedAt: "2026-11-05T10:00:00.000Z",
    openedBy: "P1",
    childName: "Salma Khaled",
    childAge: "5",
    gender: "female",
    place: "Nasr City, Cairo",
    placeAr: "مدينة نصر، القاهرة",
    when: "2026-11-04",
    reporter: "Khaled Omar",
    relation: "Father",
    contact: "01234567890",
    description: "Long hair, yellow shoes.",
    samplePlace: "cairo-uni",
    searchKey: "khaled",
    result: {
      outcome: "match",
      similarity: 99.6,
      hospital: "Cairo University Hospital",
      hospitalAr: "مستشفى القاهرة الجامعي",
      recordId: "GT-NB-09002",
      confirmedBy: "P1",
      confirmedAt: "2026-11-09T12:00:00.000Z",
      confirmNote: "Family met the child with a social worker.",
    },
    log: [
      { type: "opened", by: "P1", at: "2026-11-05T10:00:00.000Z" },
      { type: "sampleRequested", by: "P1", at: "2026-11-05T10:30:00.000Z" },
      { type: "sampleReceived", by: "system", at: "2026-11-07T09:00:00.000Z" },
      { type: "searched", by: "P1", at: "2026-11-08T09:15:00.000Z" },
      { type: "confirmed", by: "P1", at: "2026-11-09T12:00:00.000Z" },
    ],
  },
];

// Changes made by officers are saved on top of the demo cases.
// { [caseId]: full case } and { __new: [cases] }
function savedCases() {
  return readJson(CASES_KEY, { overrides: {}, created: [] });
}

function saveCases(data) {
  writeJson(CASES_KEY, data);
}

function allCases() {
  const saved = savedCases();
  const base = DEMO_CASES.map((c) => saved.overrides[c.id] || c);
  return [...saved.created, ...base];
}

function replaceCase(updated) {
  const saved = savedCases();
  const isCreated = saved.created.some((c) => c.id === updated.id);
  if (isCreated) {
    saved.created = saved.created.map((c) =>
      c.id === updated.id ? updated : c,
    );
  } else {
    saved.overrides[updated.id] = updated;
  }
  saveCases(saved);
}

function withLog(c, entry) {
  return {
    ...c,
    log: [...c.log, { ...entry, at: new Date().toISOString() }],
  };
}

// ---- Cases ----
export async function listCases() {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return allCases().sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1));
}

export async function getCase(caseId) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return allCases().find((c) => c.id === caseId) || null;
}

// data: { type, priority, childName, childAge, gender, place, when, reporter,
//         relation, contact, description, staffId }
export async function createCase(data) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const saved = savedCases();
  const prefix = data.type === "found" ? "FC" : "MC";
  const sameType = allCases().filter((c) => c.type === data.type).length;
  const id = `${prefix}-2026-${String(sameType + 20).padStart(3, "0")}`;
  const now = new Date().toISOString();
  const record = {
    id,
    type: data.type,
    priority: data.priority || "normal",
    status: "open",
    openedAt: now,
    openedBy: data.staffId || "unknown",
    childName: data.childName || "",
    childAge: data.childAge || "",
    gender: data.gender || "",
    place: data.place || "",
    placeAr: data.place || "",
    when: data.when || "",
    reporter: data.reporter || "",
    relation: data.relation || "",
    contact: data.contact || "",
    description: data.description || "",
    samplePlace: "",
    searchKey: "none",
    result: null,
    log: [{ type: "opened", by: data.staffId || "unknown", at: now }],
  };
  saved.created.unshift(record);
  saveCases(saved);
  return record;
}

// Asks a family (Missing Child) or the child (Found Child) to give a sample
// at a hospital or lab. A message is sent to that place.
export async function requestSample({ caseId, placeId, staffId }) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const c = allCases().find((x) => x.id === caseId);
  if (!c) throw new Error("not-found");
  const updated = withLog(
    { ...c, status: "sampleRequested", samplePlace: placeId },
    { type: "sampleRequested", by: staffId || "unknown", placeId },
  );
  replaceCase(updated);
  return updated;
}

// Demo only: in real life the hospital / lab marks the sample as received.
export async function markSampleReceived({ caseId, staffId }) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const c = allCases().find((x) => x.id === caseId);
  if (!c) throw new Error("not-found");
  // Demo rule: a new case matches a registered family only when the sample
  // is taken at Cairo University Hospital; otherwise there is no match.
  const searchKey =
    c.searchKey && c.searchKey !== "none"
      ? c.searchKey
      : c.samplePlace === "cairo-uni"
        ? c.type === "found"
          ? "hassan"
          : "none"
        : "none";
  const updated = withLog(
    { ...c, status: "sampleReceived", searchKey },
    { type: "sampleReceived", by: staffId || "system" },
  );
  replaceCase(updated);
  return updated;
}

// Runs the database search.
//   missing -> the family's DNA against the registered children
//   found   -> the child's DNA against the registered children AND the open
//              Missing Child cases
// Returns the case with a result: { outcome, similarity, hospital, ... }
export async function runSearch({ caseId, staffId }) {
  await new Promise((resolve) => setTimeout(resolve, 900));
  const c = allCases().find((x) => x.id === caseId);
  if (!c) throw new Error("not-found");

  const child = REGISTERED_CHILDREN.find((r) => r.familyKey === c.searchKey);
  let result;
  if (child) {
    // A matching open Missing Child case (Found Child search only).
    const family =
      c.type === "found"
        ? allCases().find(
            (x) =>
              x.type === "missing" &&
              x.searchKey === c.searchKey &&
              x.status !== "closed" &&
              x.status !== "resolved",
          )
        : null;
    result = {
      outcome: "match",
      similarity: c.type === "found" ? 99.4 : 98.9,
      hospital: child.hospital,
      hospitalAr: child.hospitalAr,
      recordId: child.recordId,
      linkedCase: family ? family.id : "",
    };
  } else {
    result = { outcome: "noMatch", similarity: 0, hospital: "", recordId: "" };
  }

  const updated = withLog(
    {
      ...c,
      status: result.outcome === "match" ? "matched" : "noMatch",
      result,
    },
    { type: "searched", by: staffId || "unknown", outcome: result.outcome },
  );
  replaceCase(updated);
  return updated;
}

// The officer confirms a match in writing. Only then is the case resolved.
export async function confirmMatch({ caseId, staffId, note }) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const c = allCases().find((x) => x.id === caseId);
  if (!c || !c.result) throw new Error("not-found");
  const updated = withLog(
    {
      ...c,
      status: "resolved",
      result: {
        ...c.result,
        confirmedBy: staffId || "unknown",
        confirmedAt: new Date().toISOString(),
        confirmNote: String(note || "").trim(),
      },
    },
    { type: "confirmed", by: staffId || "unknown", note },
  );
  replaceCase(updated);
  return updated;
}

// Close a case or reopen it.
export async function setCaseClosed({ caseId, closed, staffId }) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const c = allCases().find((x) => x.id === caseId);
  if (!c) throw new Error("not-found");
  let status;
  if (closed) {
    status = "closed";
  } else if (c.result && c.result.confirmedAt) {
    status = "resolved";
  } else if (c.result) {
    status = c.result.outcome === "match" ? "matched" : "noMatch";
  } else if (c.samplePlace) {
    status = "sampleRequested";
  } else {
    status = "open";
  }
  const updated = withLog(
    { ...c, status },
    { type: closed ? "closed" : "reopened", by: staffId || "unknown" },
  );
  replaceCase(updated);
  return updated;
}

export async function setCasePriority({ caseId, priority, staffId }) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const c = allCases().find((x) => x.id === caseId);
  if (!c) throw new Error("not-found");
  const updated = withLog(
    { ...c, priority },
    { type: "priority", by: staffId || "unknown", priority },
  );
  replaceCase(updated);
  return updated;
}

export async function addCaseNote({ caseId, staffId, note }) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const c = allCases().find((x) => x.id === caseId);
  if (!c) throw new Error("not-found");
  const updated = withLog(c, {
    type: "note",
    by: staffId || "unknown",
    note: String(note || "").trim(),
  });
  replaceCase(updated);
  return updated;
}

// ---- Police notifications (demo) ----
// Derived from the cases: urgent cases, samples received, matches found
// (waiting for confirmation) and cases with no match.
function notifState(userId) {
  return readJson(NOTIF_KEY, {})[userId] || { read: [], dismissed: [] };
}

function saveNotifState(userId, state) {
  const all = readJson(NOTIF_KEY, {});
  all[userId] = state;
  writeJson(NOTIF_KEY, all);
}

export async function listPoliceNotifications({ userId = "unknown" } = {}) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const state = notifState(userId);
  const out = [];

  allCases().forEach((c) => {
    const last = c.log[c.log.length - 1];
    const base = {
      ref: c.id,
      caseType: c.type,
      link: `/police/cases/${c.id}`,
    };
    if (c.status === "closed" || c.status === "resolved") return;

    if (c.status === "matched") {
      out.push({
        ...base,
        id: `match-${c.id}`,
        kind: "matchFound",
        tone: "alert",
        icon: "alert",
        at: last ? last.at : c.openedAt,
      });
    } else if (c.status === "sampleReceived") {
      out.push({
        ...base,
        id: `recv-${c.id}`,
        kind: "sampleReceived",
        tone: "match",
        icon: "flask",
        at: last ? last.at : c.openedAt,
      });
    } else if (c.status === "noMatch") {
      out.push({
        ...base,
        id: `nomatch-${c.id}`,
        kind: "noMatch",
        tone: "custody",
        icon: "search",
        at: last ? last.at : c.openedAt,
      });
    }

    if (c.priority === "high") {
      out.push({
        ...base,
        id: `urgent-${c.id}`,
        kind: "urgent",
        tone: "alert",
        icon: "alert",
        at: c.openedAt,
      });
    }
  });

  return out
    .filter((n) => !state.dismissed.includes(n.id))
    .map((n) => ({ ...n, unread: !state.read.includes(n.id) }))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function markPoliceNotificationRead(userId, id) {
  const state = notifState(userId);
  if (!state.read.includes(id)) state.read.push(id);
  saveNotifState(userId, state);
}

export function markAllPoliceNotificationsRead(userId, ids) {
  const state = notifState(userId);
  ids.forEach((id) => {
    if (!state.read.includes(id)) state.read.push(id);
  });
  saveNotifState(userId, state);
}

export function dismissPoliceNotification(userId, id) {
  const state = notifState(userId);
  if (!state.dismissed.includes(id)) state.dismissed.push(id);
  saveNotifState(userId, state);
}

// ---- Police settings (demo) ----
const DEFAULT_POLICE_PREFS = {
  autoLock: "15",
  sound: true,
  mfa: true,
  matchAlerts: true,
};

export function getPolicePrefs(userId) {
  return {
    ...DEFAULT_POLICE_PREFS,
    ...(readJson(PREFS_KEY, {})[userId] || {}),
  };
}

export function savePolicePrefs(userId, prefs) {
  const all = readJson(PREFS_KEY, {});
  all[userId] = prefs;
  writeJson(PREFS_KEY, all);
}

const DEMO_POLICE_SESSIONS = [
  {
    id: "p1",
    icon: "desktop",
    name: "Station workstation",
    nameAr: "محطة عمل القسم",
    ip: "10.40.1.21",
    place: "Cairo, EG",
    placeAr: "القاهرة، مصر",
    current: true,
  },
  {
    id: "p2",
    icon: "phone",
    name: "Officer tablet",
    nameAr: "جهاز الضابط اللوحي",
    ip: "10.40.1.77",
    place: "Cairo, EG",
    placeAr: "القاهرة، مصر",
    current: false,
  },
];

export async function listPoliceSessions(userId) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const revoked = readJson(SESSIONS_KEY, {})[userId] || [];
  return DEMO_POLICE_SESSIONS.filter((s) => !revoked.includes(s.id));
}

export function revokePoliceSession(userId, sessionId) {
  const all = readJson(SESSIONS_KEY, {});
  const list = all[userId] || [];
  if (!list.includes(sessionId)) list.push(sessionId);
  all[userId] = list;
  writeJson(SESSIONS_KEY, all);
}
