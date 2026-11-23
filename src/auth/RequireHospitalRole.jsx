// src/auth/RequireHospitalRole.jsx
import { Navigate } from "react-router-dom";
import { ROLE_ROUTES, getUser } from "./session";

// Wrap a hospital page that only some hospital roles may open.
//   <RequireHospitalRole roles={["geneticist"]}><HospitalRiskPage /></RequireHospitalRole>
// - not signed in                       -> /login
// - not a hospital account              -> that user's own dashboard
// - hospital account, wrong hospital role -> /hospital/profile
export default function RequireHospitalRole({ roles, children }) {
  const user = getUser();

  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "hospital_staff") {
    return <Navigate to={ROLE_ROUTES[user.role] || "/login"} replace />;
  }

  if (!roles.includes(user.hospitalRole)) {
    return <Navigate to={ROLE_ROUTES.hospital_staff} replace />;
  }

  return children;
}
