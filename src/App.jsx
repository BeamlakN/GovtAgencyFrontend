import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StaffManagement from "./pages/StaffManagement";
import Applications from "./pages/Applications";
import ApplicationReview from "./pages/ApplicationReview";
import Announcements from "./pages/Announcements";
import ServicesManagement from "./pages/ServicesManagement";
import AuditLogs from "./pages/AuditLogs";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Suggestions from "./pages/Suggestions";
import Layout from "./components/dashboard/Layout";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LicenseOnboarding from "./pages/LicenseOnboarding";
import SuggestionDetail from "./pages/SuggestionDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/staff" element={<StaffManagement />} />
        <Route path="/services" element={<ServicesManagement />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/applications/:id/review" element={<ApplicationReview />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/suggestions" element={<Suggestions />} />
        <Route path="/license-onboarding" element={<LicenseOnboarding />} />
        <Route path="/suggestions/:id" element={<SuggestionDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;