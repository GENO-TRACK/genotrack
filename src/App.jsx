import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Otp from "./pages/Otp";
import LegalPage from "./pages/LegalPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import "./App.css";
import { LanguageProvider } from "./i18n/LanguageContext";
import SettingsPage from "./pages/admin/SettingsPage";
import SamplesPage from "./pages/admin/SamplesPage";
import AddSamplePage from "./pages/admin/samples/AddSamplePage";
import CustodyPage from "./pages/admin/CustodyPage";
import ComparisonPage from "./pages/admin/ComparisonPage";
import RiskPage from "./pages/admin/RiskPage";
import FamilyPage from "./pages/admin/FamilyPage";
import ReportsPage from "./pages/admin/ReportsPage";
import NotificationsPage from "./pages/admin/NotificationsPage";
import PermissionsPage from "./pages/admin/PermissionsPage";
import AccountPage from "./pages/AccountPage";
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import PatientSearchPage from "./pages/hospital/PatientSearchPage";
import PatientProfilePage from "./pages/hospital/PatientProfilePage";
import NewbornPage from "./pages/hospital/NewbornPage";
import HospitalSamplesPage from "./pages/hospital/HospitalSamplesPage";
import HospitalRiskPage from "./pages/hospital/HospitalRiskPage";
import AccessLogPage from "./pages/hospital/AccessLogPage";
import HospitalReportsPage from "./pages/hospital/HospitalReportsPage";
import HospitalFamilyPage from "./pages/hospital/HospitalFamilyPage";
import HospitalNotificationsPage from "./pages/hospital/HospitalNotificationsPage";
import HospitalSettingsPage from "./pages/hospital/HospitalSettingsPage";
import LabDashboard from "./pages/lab/LabDashboard";
import LabSamplesPage from "./pages/lab/LabSamplesPage";
import LabCustodyPage from "./pages/lab/LabCustodyPage";
import LabNotificationsPage from "./pages/lab/LabNotificationsPage";
import LabSettingsPage from "./pages/lab/LabSettingsPage";
import PoliceDashboard from "./pages/police/PoliceDashboard";
import PoliceCasesPage from "./pages/police/PoliceCasesPage";
import NewCasePage from "./pages/police/NewCasePage";
import CaseDetailsPage from "./pages/police/CaseDetailsPage";
import PoliceNotificationsPage from "./pages/police/PoliceNotificationsPage";
import PoliceSettingsPage from "./pages/police/PoliceSettingsPage";
import PoliceComparisonPage from "./pages/police/PoliceComparisonPage";
import RequireRole from "./auth/RequireRole";
import RequireHospitalRole from "./auth/RequireHospitalRole";
import {
  ROLE_ROUTES,
  hospitalRoleFromNationalId,
  roleFromNationalId,
  saveAccessToken,
  saveUser,
} from "./auth/session";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  resendOtp,
  verifyLoginOtp,
  verifyRegistrationOtp,
} from "./api/authApi";

async function authenticate({ nationalId, password }) {
  return loginUser({ nationalId, password });
}

async function register(data) {
  return registerUser(data);
}

async function verifyOtp({ code, purpose, userId, nationalId }) {
  if (!userId) throw new Error("Missing verification user.");

  if (purpose === "registration") {
    return verifyRegistrationOtp({ userId, otp: code });
  }

  const result = await verifyLoginOtp({ userId, otp: code });
  if (!result?.accessToken) {
    throw new Error("Login verification did not return an access token.");
  }

  saveAccessToken(result.accessToken);

  let profile = null;
  try {
    profile = await getCurrentUser(result.accessToken);
  } catch {
    profile = result.user || null;
  }

  const role =
    result.user?.role ||
    profile?.role ||
    roleFromNationalId(nationalId || result.user?.nationalId || "");
  const user = {
    ...profile,
    ...result.user,
    nationalId: nationalId || profile?.nationalId || result.user?.nationalId,
    role,
  };
  if (role === "hospital_staff") {
    user.hospitalRole =
      result.user?.hospitalRole ||
      profile?.hospitalRole ||
      hospitalRoleFromNationalId(nationalId || "");
  }

  saveUser(user);
  return { ...result, target: ROLE_ROUTES[role] };
}

async function resendOtpCode({ userId, purpose }) {
  return resendOtp({ userId, purpose });
}

function LoginRoute() {
  return <Login authenticate={authenticate} />;
}

// Shortcut: every admin page is protected by the same rule.
function Admin({ children }) {
  return <RequireRole roles={["admin"]}>{children}</RequireRole>;
}

function Hospital({ children }) {
  return <RequireRole roles={["hospital_staff"]}>{children}</RequireRole>;
}

// Every lab page is protected by the same rule.
function Lab({ children }) {
  return <RequireRole roles={["lab_technician"]}>{children}</RequireRole>;
}

// Every police page is protected by the same rule.
function Police({ children }) {
  return <RequireRole roles={["police_investigator"]}>{children}</RequireRole>;
}

// Hospital pages that only a geneticist may open.
function Geneticist({ children }) {
  return (
    <RequireHospitalRole roles={["geneticist"]}>{children}</RequireHospitalRole>
  );
}

// Hospital pages that only a hospital admin may open.
function HospitalAdmin({ children }) {
  return (
    <RequireHospitalRole roles={["hospital_admin"]}>
      {children}
    </RequireHospitalRole>
  );
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/signup" element={<Signup onRegister={register} />} />
          <Route
            path="/otp"
            element={
              <Otp onVerify={verifyOtp} onResend={resendOtpCode} />
            }
          />
          <Route
            path="/privacy"
            element={<LegalPage title="Privacy Policy" />}
          />
          <Route
            path="/terms"
            element={<LegalPage title="Terms & Conditions" />}
          />

          {/* Admin / Ministry */}
          <Route
            path="/admin/profile"
            element={
              <Admin>
                <AdminDashboard />
              </Admin>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <Admin>
                <SettingsPage />
              </Admin>
            }
          />
          <Route
            path="/admin/samples"
            element={
              <Admin>
                <SamplesPage />
              </Admin>
            }
          />
          <Route
            path="/admin/samples/new"
            element={
              <Admin>
                <AddSamplePage />
              </Admin>
            }
          />
          <Route
            path="/admin/comparison"
            element={
              <Admin>
                <ComparisonPage />
              </Admin>
            }
          />
          <Route
            path="/admin/custody"
            element={
              <Admin>
                <CustodyPage />
              </Admin>
            }
          />
          <Route
            path="/admin/risk"
            element={
              <Admin>
                <RiskPage />
              </Admin>
            }
          />
          <Route
            path="/admin/family"
            element={
              <Admin>
                <FamilyPage />
              </Admin>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <Admin>
                <ReportsPage />
              </Admin>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <Admin>
                <NotificationsPage />
              </Admin>
            }
          />
          <Route
            path="/admin/settings/permissions"
            element={<PermissionsPage />}
          />
          <Route
            path="/admin/account"
            element={
              <Admin>
                <AccountPage role="admin" />
              </Admin>
            }
          />

          {/* Hospital */}
          <Route
            path="/hospital/profile"
            element={
              <Hospital>
                <HospitalDashboard />
              </Hospital>
            }
          />
          <Route
            path="/hospital/search"
            element={
              <Hospital>
                <PatientSearchPage />
              </Hospital>
            }
          />
          <Route
            path="/hospital/patient/:patientId"
            element={
              <Hospital>
                <PatientProfilePage />
              </Hospital>
            }
          />
          <Route
            path="/hospital/newborn"
            element={
              <Hospital>
                <NewbornPage />
              </Hospital>
            }
          />
          <Route
            path="/hospital/samples"
            element={
              <Hospital>
                <HospitalSamplesPage />
              </Hospital>
            }
          />
          <Route
            path="/hospital/reports"
            element={
              <Hospital>
                <HospitalReportsPage />
              </Hospital>
            }
          />
          <Route
            path="/hospital/family"
            element={
              <Hospital>
                <HospitalFamilyPage />
              </Hospital>
            }
          />
          <Route
            path="/hospital/notifications"
            element={
              <Hospital>
                <HospitalNotificationsPage />
              </Hospital>
            }
          />
          <Route
            path="/hospital/settings"
            element={
              <Hospital>
                <HospitalSettingsPage />
              </Hospital>
            }
          />
          <Route
            path="/hospital/risk"
            element={
              <Geneticist>
                <HospitalRiskPage />
              </Geneticist>
            }
          />
          <Route
            path="/hospital/accesslog"
            element={
              <HospitalAdmin>
                <AccessLogPage />
              </HospitalAdmin>
            }
          />

          {/* Lab technician */}
          <Route
            path="/lab/profile"
            element={
              <Lab>
                <LabDashboard />
              </Lab>
            }
          />
          <Route
            path="/lab/samples"
            element={
              <Lab>
                <LabSamplesPage />
              </Lab>
            }
          />
          <Route
            path="/lab/custody"
            element={
              <Lab>
                <LabCustodyPage />
              </Lab>
            }
          />
          <Route
            path="/lab/notifications"
            element={
              <Lab>
                <LabNotificationsPage />
              </Lab>
            }
          />
          <Route
            path="/lab/settings"
            element={
              <Lab>
                <LabSettingsPage />
              </Lab>
            }
          />

          {/* Police investigator */}
          <Route
            path="/police/profile"
            element={
              <Police>
                <PoliceDashboard />
              </Police>
            }
          />
          <Route
            path="/police/cases"
            element={
              <Police>
                <PoliceCasesPage />
              </Police>
            }
          />
          {/* "new" must come before ":caseId" */}
          <Route
            path="/police/cases/new"
            element={
              <Police>
                <NewCasePage />
              </Police>
            }
          />
          <Route
            path="/police/cases/:caseId"
            element={
              <Police>
                <CaseDetailsPage />
              </Police>
            }
          />
          <Route
            path="/police/comparison"
            element={
              <Police>
                <PoliceComparisonPage />
              </Police>
            }
          />
          <Route
            path="/police/notifications"
            element={
              <Police>
                <PoliceNotificationsPage />
              </Police>
            }
          />
          <Route
            path="/police/settings"
            element={
              <Police>
                <PoliceSettingsPage />
              </Police>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
