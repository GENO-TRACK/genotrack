import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
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
  saveUser,
} from "./auth/session";

// Temporary mock so you can see the flow before the backend exists.
// Replace the body with a real fetch() call to your API later.
// Demo: the role comes from the first letter of the National ID
// (H = hospital, L = lab, P = police, anything else = admin).
// Inside a hospital: HA = hospital admin, HG = geneticist, any other H = staff.
async function authenticate({ nationalId, factoryNumber }) {
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!nationalId || !factoryNumber) {
    throw new Error("Invalid credentials");
  }

  // The backend should return the account's real role (and hospitalRole).
  const role = roleFromNationalId(nationalId);
  const user = { nationalId, role };
  if (role === "hospital_staff") {
    user.hospitalRole = hospitalRoleFromNationalId(nationalId);
  }
  return user;
}

// Temporary mock for registration. Replace with a real API call later.
async function register(data) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  console.log("Register:", data);
}

// Temporary mocks for OTP. Replace with real API calls later.
async function verifyOtp({ code, method }) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  console.log("Verify OTP:", code, method);
  // Demo rule: any 4-digit code passes. Throw an Error here to test a wrong code.
}

async function resendOtp(method) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  console.log("Resend OTP via:", method);
}

function LoginRoute() {
  const navigate = useNavigate();

  function handleAuthenticated(user) {
    const target = ROLE_ROUTES[user.role];
    if (!target) {
      throw new Error("Unknown role");
    }
    // Demo only: replace with real session handling when the backend exists.
    saveUser(user);
    navigate(target, { replace: true });
  }

  return (
    <Login authenticate={authenticate} onAuthenticated={handleAuthenticated} />
  );
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
            element={<Otp onVerify={verifyOtp} onResend={resendOtp} />}
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
