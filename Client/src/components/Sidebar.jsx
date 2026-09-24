import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Trophy, 
  Target, 
  Users, 
  Building2, 
  Terminal, 
  Sliders, 
  Activity, 
  FileText, 
  Flag,
  Settings,
  Bell,
  Calendar,
  AlertTriangle,
  Layers,
  GraduationCap,
  Download,
  ShieldAlert,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;
  const roleLevel = user.roleLevel || 1;
  const hasLeetCode = !!user.leetcodeUsername && user.leetcodeUsername.trim() !== '';

  const studentNav = [
    ...(hasLeetCode ? [{ name: 'My Performance', path: '/dashboard', icon: LayoutDashboard }] : []),
    { name: 'Daily Heatmap', path: '/user-progress', icon: Calendar },
    { name: 'Rankings', path: '/leaderboard', icon: Trophy },
    { name: 'My Goals', path: '/goals', icon: Target },
    { name: 'Notifications', path: '/notifications', icon: Bell }
  ];

  const studentRepNav = [
    ...(hasLeetCode ? [{ name: 'My Personal Analytics', path: '/dashboard', icon: LayoutDashboard }] : []),
    { name: 'Class Roster & Students', path: '/admin/students', icon: Users },
    { name: 'Class Standings', path: '/leaderboard', icon: Trophy },
    { name: 'Class Daily Heatmap', path: '/user-progress', icon: Calendar },
    { name: 'Class Targets & Goals', path: '/goals', icon: Target },
    { name: 'At-Risk Classmates', path: '/admin/at-risk', icon: AlertTriangle },
    { name: 'Notifications', path: '/notifications', icon: Bell }
  ];

  const facultyNav = [
    { name: 'Faculty Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    ...(hasLeetCode ? [{ name: 'My Personal Coding', path: '/dashboard', icon: Activity }] : []),
    { name: 'Role Approvals', path: '/faculty/dashboard?tab=approvals', icon: ShieldAlert },
    { name: 'Assigned Students', path: '/admin/students', icon: Users },
    { name: 'Assign Targets', path: '/goals', icon: Target },
    { name: 'At-Risk Students', path: '/admin/at-risk', icon: AlertTriangle },
    { name: 'Export Reports', path: '/reports', icon: Download }
  ];

  const hodNav = [
    { name: 'HOD Overview', path: '/institution/dashboard', icon: Building2 },
    { name: 'Role Approvals', path: '/institution/dashboard?tab=approvals', icon: ShieldAlert },
    ...(hasLeetCode ? [{ name: 'My Personal Coding', path: '/dashboard', icon: Activity }] : []),
    { name: 'Department Batches', path: '/institution/hierarchy', icon: Layers },
    { name: 'Department Students', path: '/admin/students', icon: GraduationCap },
    { name: 'Faculty & Targets', path: '/faculty/dashboard', icon: Users },
    { name: 'At-Risk Monitor', path: '/admin/at-risk', icon: AlertTriangle },
    { name: 'Department Reports', path: '/reports', icon: Download }
  ];

  const instAdminNav = [
    { name: 'Institution Overview', path: '/institution/dashboard', icon: Building2 },
    { name: 'Role Approvals', path: '/institution/dashboard?tab=approvals', icon: ShieldAlert },
    { name: 'Institutional Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Daily Progress & Heatmaps', path: '/user-progress', icon: Calendar },
    ...(hasLeetCode ? [{ name: 'My Personal Coding', path: '/dashboard', icon: Activity }] : []),
    { name: 'Academic Hierarchy', path: '/institution/hierarchy', icon: Layers },
    { name: 'Student Roster', path: '/admin/students', icon: GraduationCap },
    { name: 'At-Risk Monitor', path: '/admin/at-risk', icon: AlertTriangle },
    { name: 'Institutional Reports', path: '/reports', icon: Download }
  ];

  const superAdminNav = [
    { name: 'Platform Overview', path: '/superadmin/analytics', icon: Building2 },
    { name: 'Role Approvals', path: '/superadmin/analytics?tab=approvals', icon: ShieldAlert },
    { name: 'All Institutions', path: '/institution/dashboard', icon: Layers },
    { name: 'System Health', path: '/devadmin/health', icon: Activity },
    { name: 'Feature Flags', path: '/devadmin/feature-flags', icon: Sliders },
    { name: 'System Logs', path: '/devadmin/logs', icon: FileText },
    { name: 'DB Console', path: '/devadmin/db-console', icon: Terminal },
    { name: 'User Impersonation', path: '/devadmin/impersonate', icon: Users }
  ];

  const renderNavSection = (title, items) => (
    <div className="mb-6">
      <h3 className="text-[11px] font-bold uppercase tracking-wider px-3 mb-2 text-slate-500">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:static top-0 left-0 bottom-0 z-50 w-64 bg-[#0b0f19] border-r border-slate-800/80 p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between select-none transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between md:hidden mb-4 pb-2 border-b border-slate-800">
            <span className="font-extrabold text-sm text-white">Academic Navigation</span>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Workspace - For Students and Developer SuperAdmins */}
          {(roleLevel === 1 || roleLevel >= 6 || role === 'superadmin') && renderNavSection('Student Workspace', studentNav)}

          {/* Student Representative Navigation */}
          {roleLevel === 2 && renderNavSection('Student Rep Workspace', studentRepNav)}

          {/* Faculty Navigation */}
          {roleLevel === 3 && renderNavSection('Faculty Portal', facultyNav)}

          {/* Department HOD Navigation */}
          {roleLevel === 4 && renderNavSection('Department HOD Portal', hodNav)}

          {/* Institutional Manager / Admin Navigation */}
          {roleLevel === 5 && renderNavSection('Institution Management', instAdminNav)}

          {/* Platform SuperAdmin Navigation */}
          {roleLevel >= 6 && renderNavSection('Platform SuperAdmin', superAdminNav)}
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <NavLink
            to="/settings"
            onClick={() => {
              if (onClose) onClose();
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            <span>Account Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
