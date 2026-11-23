// src/auth/adminSettings.js
// Demo helpers for the admin Settings page. Replace with real API calls when
// the backend exists.
//
// Everything is kept per admin account in localStorage, the same way the lab
// and hospital Settings pages do it.

const PREFS_KEY = "genotrack_admin_prefs";
const SESSIONS_KEY = "genotrack_admin_sessions";
const KEYS_KEY = "genotrack_admin_keys";

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

const DEFAULT_PREFS = {
  autoLock: "15",
  sound: true,
  mfa: true,
};

export function getAdminPrefs(userId) {
  return {
    ...DEFAULT_PREFS,
    ...(readJson(PREFS_KEY, {})[userId] || {}),
  };
}

export function saveAdminPrefs(userId, prefs) {
  const all = readJson(PREFS_KEY, {});
  all[userId] = prefs;
  writeJson(PREFS_KEY, all);
}

const DEMO_SESSIONS = [
  {
    id: "a1",
    icon: "desktop",
    name: "Ministry workstation",
    nameAr: "محطة عمل الوزارة",
    ip: "10.10.1.21",
    place: "Cairo, EG",
    placeAr: "القاهرة، مصر",
    current: true,
  },
  {
    id: "a2",
    icon: "phone",
    name: "Secure admin tablet",
    nameAr: "جهاز الإدارة اللوحي الآمن",
    ip: "10.10.1.58",
    place: "Giza, EG",
    placeAr: "الجيزة، مصر",
    current: false,
  },
  {
    id: "a3",
    icon: "desktop",
    name: "Remote terminal",
    nameAr: "محطة عن بُعد",
    ip: "10.20.4.9",
    place: "Alexandria, EG",
    placeAr: "الإسكندرية، مصر",
    current: false,
  },
];

export async function listAdminSessions(userId) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const revoked = readJson(SESSIONS_KEY, {})[userId] || [];
  return DEMO_SESSIONS.filter((s) => !revoked.includes(s.id));
}

export function revokeAdminSession(userId, sessionId) {
  const all = readJson(SESSIONS_KEY, {});
  const list = all[userId] || [];
  if (!list.includes(sessionId)) list.push(sessionId);
  all[userId] = list;
  writeJson(SESSIONS_KEY, all);
}

// "Rotate Security Keys": remembers when the keys were last rotated and
// returns the new time. Sessions other than the current one are signed out.
export function rotateAdminKeys(userId) {
  const all = readJson(KEYS_KEY, {});
  const at = new Date().toISOString();
  all[userId] = { rotatedAt: at };
  writeJson(KEYS_KEY, all);

  const sessions = readJson(SESSIONS_KEY, {});
  sessions[userId] = DEMO_SESSIONS.filter((s) => !s.current).map((s) => s.id);
  writeJson(SESSIONS_KEY, sessions);
  return at;
}

export function getAdminKeysRotatedAt(userId) {
  const entry = readJson(KEYS_KEY, {})[userId];
  return entry ? entry.rotatedAt : null;
}

// The people shown in the Personnel table: one demo account per role.
// `tier` matches the st.tier.* translation keys.
export const ADMIN_PERSONNEL = [
  {
    id: "ADMIN",
    name: "Ministry Admin",
    nameAr: "مدير الوزارة",
    tier: "admin",
    area: "/admin",
  },
  {
    id: "HA1",
    name: "Hospital Admin",
    nameAr: "مدير المستشفى",
    tier: "hospital",
    area: "/hospital",
  },
  {
    id: "HG1",
    name: "Hospital Geneticist",
    nameAr: "أخصائي وراثة",
    tier: "geneticist",
    area: "/hospital",
  },
  {
    id: "H1",
    name: "Hospital Staff",
    nameAr: "موظف مستشفى",
    tier: "staff",
    area: "/hospital",
  },
  {
    id: "L1",
    name: "Lab Technician",
    nameAr: "فني مختبر",
    tier: "lab",
    area: "/lab",
  },
  {
    id: "P1",
    name: "Police Investigator",
    nameAr: "محقق شرطة",
    tier: "investigator",
    area: "/police",
  },
];
