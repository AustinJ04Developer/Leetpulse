import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import UserProgressPage from '../shared/UserProgressPage';
import PendingApprovalsTab from '../../components/PendingApprovalsTab';
import { 
  Building2, 
  Users, 
  Flame, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Trophy, 
  UserPlus, 
  Sliders, 
  Save, 
  BarChart2,
  PieChart as PieIcon,
  ShieldAlert,
  Calendar,
  LayoutDashboard
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SuperAdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'analytics'; // 'analytics' | 'approvals' | 'announcements' | 'branding' | 'progress'

  const [data, setData] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Branding & Billing state
  const [companyName, setCompanyName] = useState('LEETPULSE Academy');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [plan, setPlan] = useState('Enterprise');
  const [brandingMsg, setBrandingMsg] = useState('');

  // Admin creation state
  const [modalOpen, setModalOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [groupName, setGroupName] = useState('');

  const loadOrgAnalytics = async () => {
    try {
      const [res, pendingRes] = await Promise.all([
        api.get('/superadmin/org-analytics'),
        api.get('/institutions/pending-approvals').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (res.data.success) {
        setData(res.data);
        if (res.data.organization) {
          const org = res.data.organization;
          setCompanyName(org.branding?.companyName || 'LEETPULSE Academy');
          setPrimaryColor(org.branding?.primaryColor || '#6366f1');
          setPlan(org.plan || 'Enterprise');
        }
      }

      if (pendingRes.data?.success) {
        setPendingCount(pendingRes.data.count || pendingRes.data.data?.length || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrgAnalytics();
  }, []);

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/superadmin/announcements', {
        title: announcementTitle,
        message: announcementMsg
      });
      if (res.data.success) {
        setStatusMsg(`Broadcast sent to all organization users!`);
        setAnnouncementTitle('');
        setAnnouncementMsg('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBranding = async (e) => {
    e.preventDefault();
    setBrandingMsg('');
    try {
      const res = await api.put('/superadmin/branding', {
        companyName,
        primaryColor,
        plan
      });
      if (res.data.success) {
        setBrandingMsg('Organization branding and billing plan updated successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/superadmin/create-admin', {
        name: adminName,
        email: adminEmail,
        password: 'Password123!',
        groupName
      });
      if (res.data.success) {
        setStatusMsg(`Admin account ${adminEmail} created successfully!`);
        setAdminName('');
        setAdminEmail('');
        setGroupName('');
        setModalOpen(false);
        loadOrgAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const m = data?.metrics || {};

  const chartData = [
    { difficulty: 'Easy Solved', count: m.totalEasyOrg || 0, color: '#10b981' },
    { difficulty: 'Medium Solved', count: m.totalMediumOrg || 0, color: '#f59e0b' },
    { difficulty: 'Hard Solved', count: m.totalHardOrg || 0, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 relative overflow-hidden bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-slate-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Executive Management Hub</h1>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                Level 6 Developer & Super Administrator
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Organization-wide oversight, institutional approvals, cohort performance telemetry & system governance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Create Level 2 Admin
            </button>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {statusMsg}
        </div>
      )}

      {/* Super Admin Tab Bar */}
      <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => handleTabChange('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Platform Overview</span>
        </button>

        <button
          onClick={() => handleTabChange('approvals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 relative ${
            activeTab === 'approvals'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Role Approvals & Login Requests</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('announcements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'announcements'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Announcements</span>
        </button>

        <button
          onClick={() => handleTabChange('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'branding'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Branding & Billing</span>
        </button>

        <button
          onClick={() => handleTabChange('progress')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'progress'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Progress Board</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top Stat Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Organization Users"
              value={m.totalUsers || 0}
              subtitle={`Across ${m.totalGroups || 0} active cohorts`}
              icon={Users}
              color="indigo"
              badgeText="Full org capacity"
            />

            <div 
              onClick={() => handleTabChange('approvals')}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <StatCard
                title="Pending Role Approvals"
                value={pendingCount}
                subtitle="Faculty & HOD Requests"
                icon={ShieldAlert}
                color="amber"
                badgeText={pendingCount > 0 ? "Action Required" : "All Clear"}
              />
            </div>

            <StatCard
              title="Total Org Solves"
              value={(m.totalSolvedOrg || 0).toLocaleString()}
              subtitle={`Easy: ${m.totalEasyOrg || 0} | Med: ${m.totalMediumOrg || 0}`}
              icon={Trophy}
              color="emerald"
              badgeText="Platform problem solved total"
            />

            <StatCard
              title="Avg Cohort Streak"
              value={`${m.avgStreak || 0} Days`}
              subtitle="Cohort consistency index"
              icon={Flame}
              color="purple"
              badgeText="Healthy engagement"
            />
          </div>

          {/* Pending Approval notice for Super Admin */}
          {pendingCount > 0 && (
            <div 
              onClick={() => handleTabChange('approvals')}
              className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {pendingCount} Registration & Login Request{pendingCount > 1 ? 's' : ''} Awaiting Super Admin Authorization
                  </h4>
                  <p className="text-xs text-slate-400">
                    Faculty mentors and Department Heads require approval before logging in. Click to review and accept requests.
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all">
                Review & Accept Requests →
              </span>
            </div>
          )}

          {/* Org Solve Difficulty Chart */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" /> Org-Wide Solves by Difficulty
              </h3>
              <p className="text-xs text-slate-400">Aggregate metrics across all active cohorts</p>
            </div>

            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="difficulty" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#475569" />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING ROLE APPROVALS & LOGIN REQUESTS */}
      {activeTab === 'approvals' && (
        <PendingApprovalsTab 
          userRoleLevel={6} 
          onCountChange={(count) => setPendingCount(count)} 
        />
      )}

      {/* TAB 3: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Global Platform Announcement</h3>
              <p className="text-xs text-slate-400">Broadcast an in-app alert to all organization members</p>
            </div>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Announcement Subject</label>
              <input
                type="text"
                required
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-amber-500"
                placeholder="e.g. Q3 LeetCode Competition Starts This Friday!"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Message Body</label>
              <textarea
                rows="4"
                required
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-amber-500"
                placeholder="Details about the competition or maintenance..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                Broadcast to All Users
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: BRANDING & BILLING */}
      {activeTab === 'branding' && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">White-Label Branding & Billing Plan</h3>
              <p className="text-xs text-slate-400">Configure corporate branding and enterprise plan tier</p>
            </div>
          </div>

          {brandingMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {brandingMsg}
            </div>
          )}

          <form onSubmit={handleUpdateBranding} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Theme Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription Plan Tier</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="Basic">Basic Plan (Up to 50 users)</option>
                <option value="Pro">Pro Plan (Up to 250 users)</option>
                <option value="Enterprise">Enterprise Unlimited Plan</option>
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                Save Branding & Plan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: DAILY PROGRESS */}
      {activeTab === 'progress' && (
        <div className="pt-2">
          <UserProgressPage />
        </div>
      )}

      {/* Admin Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Create Admin Account</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-amber-500"
                  placeholder="e.g. Marcus Brody"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-amber-500"
                  placeholder="admin@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Cohort Name (Optional)</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-amber-500"
                  placeholder="e.g. Gamma Cohort 2026"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;

