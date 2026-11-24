// src/auth/session.js
// Demo session helpers. Replace with real session/token handling when the backend exists.

export const ROLE_ROUTES = {
  admin: "/admin/profile",
  hospital_staff: "/hospital/profile",
  lab_technician: "/lab/profile",
  police_investigator: "/police/profile",
};

// Which URL prefix each role may open.
export const ROLE_PREFIX = {
  admin: "/admin",
  hospital_staff: "/hospital",
  lab_technician: "/lab",
  police_investigator: "/police",
};

// Roles inside a hospital. Everyone with role "hospital_staff" has one of these.
//   hospital_admin -> may open the Access Log page
//   geneticist     -> may open the Genetic Risk page
//   staff          -> every other hospital employee
export const HOSPITAL_ROLES = ["hospital_admin", "geneticist", "staff"];

const KEY = "genotrack_user";
const TOKEN_KEY = "genotrack_access_token";

export function getUser() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function saveAccessToken(accessToken) {
  localStorage.setItem(TOKEN_KEY, accessToken);
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Demo rule so you can test all four dashboards before the backend exists.
// The real backend must return the account's verified role.
//   H... -> hospital_staff    L... -> lab_technician
//   P... -> police_investigator    anything else -> admin
export function roleFromNationalId(nationalId = "") {
  const first = String(nationalId).trim().charAt(0).toUpperCase();
  if (first === "H") return "hospital_staff";
  if (first === "L") return "lab_technician";
  if (first === "P") return "police_investigator";
  return "admin";
}

// Demo rule for the role inside a hospital.
//   HA... -> hospital_admin    HG... -> geneticist    any other H... -> staff
// The real backend must return the account's verified hospital role.
export function hospitalRoleFromNationalId(nationalId = "") {
  const id = String(nationalId).trim().toUpperCase();
  if (id.startsWith("HA")) return "hospital_admin";
  if (id.startsWith("HG")) return "geneticist";
  return "staff";
}
