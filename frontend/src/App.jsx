import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { checkDemoAccess } from './store/usageStore';
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

const AdminRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  if (!token) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return children;
};

/**
 * Restricts non-super users who have already used the one-time demo.
 * Super users (admin / super_admin) always pass through.
 * Regular users who still have demo access pass through.
 * Returning users are redirected to /upgrade.
 */
/**
 * Restricts non-super users who have already used the one-time demo.
 * Super users (admin / super_admin) always pass through.
 * Regular users who still have demo access pass through.
 * Returning users are redirected to /upgrade.
 * The /upgrade route is always accessible so blocked users can purchase.
 */
const DemoRestrictionRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" />;
  if (!user) return <Navigate to="/login" />;

  const { allowed } = checkDemoAccess(user);
  if (!allowed) {
    return <Navigate to="/upgrade" replace />;
  }

  return children;
};

// Basename defaults to '/app' for Cloudflare deployment.
// Docker deployment overrides via VITE_APP_BASENAME env var (= '/').
const BASENAME = import.meta.env.VITE_APP_BASENAME || '/app';

export default function App() {
  return (
    <Router basename={BASENAME}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Demo-restricted routes — blocked non-super users get redirected to /upgrade */}
        <Route
          element={
            <PrivateRoute>
              <DemoRestrictionRoute>
                <Layout />
              </DemoRestrictionRoute>
            </PrivateRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/scans" element={<ScansPage />} />
          <Route path="/scans/:scanId" element={<ScanDetailPage />} />
          <Route path="/threats" element={<ThreatIntelPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
        </Route>

        {/* Upgrade route — always accessible, even for blocked users */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/upgrade" element={<UpgradePage />} />
        </Route>
      </Routes>
    </Router>
  );
}
