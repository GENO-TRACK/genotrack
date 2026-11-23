// src/auth/RequireRole.jsx
import { Navigate } from "react-router-dom";
import { ROLE_ROUTES, getUser } from "./session";

// Wrap a page: only the listed roles may open it.
//   <RequireRole roles={["hospital_staff"]}><HospitalDashboard /></RequireRole>
// - not signed in            -> /login
// - signed in, wrong role    -> that user's own dashboard
export default function RequireRole({ roles, children }) {
  const user = getUser();

  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={ROLE_ROUTES[user.role] || "/login"} replace />;
  }

  return children;
}
