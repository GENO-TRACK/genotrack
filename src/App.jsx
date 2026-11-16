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

const ROLE_ROUTES = {
  admin: "/admin/profile",
  hospital_staff: "/hospital/profile",
  lab_technician: "/lab/profile",
  police_investigator: "/police/profile",
};

// Temporary mock so you can see the flow before the backend exists.
// Replace the body with a real fetch() call to your API later.
async function authenticate({ nationalId, factoryNumber }) {
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!nationalId || !factoryNumber) {
    throw new Error("Invalid credentials");
  }

  // The backend should return the account's real role.
  return { nationalId, role: "admin" };
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
    localStorage.setItem("genotrack_user", JSON.stringify(user));
    navigate(target, { replace: true });
  }

  return (
    <Login authenticate={authenticate} onAuthenticated={handleAuthenticated} />
  );
}

function ProfilePlaceholder({ title }) {
  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>{title}</h1>
      <p>Profile page coming soon.</p>
    </main>
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
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/admin/profile" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/samples" element={<SamplesPage />} />
          <Route path="/admin/samples/new" element={<AddSamplePage />} />
          <Route path="/admin/comparison" element={<ComparisonPage />} />
          <Route path="/admin/custody" element={<CustodyPage />} />
          <Route path="/admin/risk" element={<RiskPage />} />
          <Route path="/admin/family" element={<FamilyPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route
            path="/admin/settings/permissions"
            element={<PermissionsPage />}
          />{" "}
          <Route
            path="/hospital/profile"
            element={<ProfilePlaceholder title="Hospital Staff Profile" />}
          />
          <Route
            path="/lab/profile"
            element={<ProfilePlaceholder title="Lab Technician Profile" />}
          />
          <Route
            path="/police/profile"
            element={<ProfilePlaceholder title="Police Investigator Profile" />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
