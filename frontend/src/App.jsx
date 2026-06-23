import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScansPage from './pages/ScansPage';
import ScanDetailPage from './pages/ScanDetailPage';
import ThreatIntelPage from './pages/ThreatIntelPage';
import AuditLogsPage from './pages/AuditLogsPage';
import UpgradePage from './pages/UpgradePage';
import SettingsPage from './pages/SettingsPage';

const PrivateRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router basename="/app">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/scans" element={<ScansPage />} />
          <Route path="/scans/:scanId" element={<ScanDetailPage />} />
          <Route path="/threats" element={<ThreatIntelPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
