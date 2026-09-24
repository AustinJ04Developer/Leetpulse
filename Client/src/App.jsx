import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ImpersonationBar from './components/ImpersonationBar';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import UserDashboard from './pages/user/UserDashboard';
import GoalsPage from './pages/user/GoalsPage';
import ProfilePage from './pages/user/ProfilePage';

import AdminDashboard from './pages/admin/AdminDashboard';
import GroupChallengesPage from './pages/admin/GroupChallengesPage';

import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import AdminManagerPage from './pages/superadmin/AdminManagerPage';
import BrandingBillingPage from './pages/superadmin/BrandingBillingPage';

import DevAdminDashboard from './pages/devadmin/DevAdminDashboard';
import FeatureFlagsPage from './pages/devadmin/FeatureFlagsPage';
import LogsViewerPage from './pages/devadmin/LogsViewerPage';
import DbConsolePage from './pages/devadmin/DbConsolePage';
import ImpersonationToolPage from './pages/devadmin/ImpersonationToolPage';

import GlobalLeaderboard from './pages/shared/GlobalLeaderboard';
import NotificationsPage from './pages/shared/NotificationsPage';
import SettingsPage from './pages/shared/SettingsPage';
import UserProgressPage from './pages/shared/UserProgressPage';
import WeeklyProblemsPage from './pages/shared/WeeklyProblemsPage';

// Multi-Tenant Institutional Pages
import InstitutionDashboard from './pages/admin/InstitutionDashboard';
import AcademicHierarchyManager from './pages/admin/AcademicHierarchyManager';
import StudentManagementPage from './pages/admin/StudentManagementPage';
import AtRiskStudentPage from './pages/admin/AtRiskStudentPage';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ReportsPage from './pages/shared/ReportsPage';

const ProtectedRoute = ({ children, minLevel = 1 }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading platform...</div>;
  }
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }
  if (user.roleLevel < minLevel) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const DefaultRoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.roleLevel >= 6 || user.role === 'devadmin') {
    return <Navigate to="/devadmin/health" replace />;
  }
  if (user.roleLevel >= 4 || user.role === 'institution_admin' || user.role === 'hod') {
    return <Navigate to="/institution/dashboard" replace />;
  }
  if (user.roleLevel === 3 || user.role === 'faculty') {
    return <Navigate to="/faculty/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};


const AppLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <ImpersonationBar />
      <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <div className="flex-1 flex relative">
        <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected Routes inside AppLayout */}
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DefaultRoleRedirect />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Multi-Tenant Institution Pages */}
              <Route path="/institution/dashboard" element={<ProtectedRoute minLevel={3}><InstitutionDashboard /></ProtectedRoute>} />
              <Route path="/institution/hierarchy" element={<ProtectedRoute minLevel={3}><AcademicHierarchyManager /></ProtectedRoute>} />
              <Route path="/admin/students" element={<ProtectedRoute minLevel={2}><StudentManagementPage /></ProtectedRoute>} />
              <Route path="/admin/at-risk" element={<ProtectedRoute minLevel={2}><AtRiskStudentPage /></ProtectedRoute>} />
              <Route path="/faculty/dashboard" element={<ProtectedRoute minLevel={2}><FacultyDashboard /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute minLevel={2}><ReportsPage /></ProtectedRoute>} />

              {/* Admin L2 */}
              <Route path="/admin/overview" element={<ProtectedRoute minLevel={2}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/challenges" element={<ProtectedRoute minLevel={2}><GroupChallengesPage /></ProtectedRoute>} />

              {/* SuperAdmin L3/L4 */}
              <Route path="/superadmin/analytics" element={<ProtectedRoute minLevel={3}><SuperAdminDashboard /></ProtectedRoute>} />
              <Route path="/superadmin/admins" element={<ProtectedRoute minLevel={3}><AdminManagerPage /></ProtectedRoute>} />
              <Route path="/superadmin/branding" element={<ProtectedRoute minLevel={3}><BrandingBillingPage /></ProtectedRoute>} />

              {/* DevAdmin L4/L5 */}
              <Route path="/devadmin/health" element={<ProtectedRoute minLevel={4}><DevAdminDashboard /></ProtectedRoute>} />
              <Route path="/devadmin/feature-flags" element={<ProtectedRoute minLevel={4}><FeatureFlagsPage /></ProtectedRoute>} />
              <Route path="/devadmin/logs" element={<ProtectedRoute minLevel={4}><LogsViewerPage /></ProtectedRoute>} />
              <Route path="/devadmin/db-console" element={<ProtectedRoute minLevel={4}><DbConsolePage /></ProtectedRoute>} />
              <Route path="/devadmin/impersonate" element={<ProtectedRoute minLevel={3}><ImpersonationToolPage /></ProtectedRoute>} />

              {/* Shared */}
              <Route path="/user-progress" element={<ProtectedRoute minLevel={1}><UserProgressPage /></ProtectedRoute>} />
              <Route path="/weekly-problems" element={<ProtectedRoute minLevel={1}><WeeklyProblemsPage /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<GlobalLeaderboard />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Default redirect */}
              <Route path="*" element={<DefaultRoleRedirect />} />
            </Routes>
          </AppLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;

