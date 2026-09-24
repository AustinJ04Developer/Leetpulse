import React, { useState, useEffect } from 'react';
import api from '../services/api';
import RoleBadge from './RoleBadge';
import { 
  ShieldAlert, 
  Check, 
  X, 
  RefreshCw, 
  Search, 
  Clock, 
  Building2, 
  GraduationCap, 
  Users, 
  UserCheck, 
  AlertCircle,
  Mail,
  Briefcase,
  Layers,
  Filter
} from 'lucide-react';

const PendingApprovalsTab = ({ userRoleLevel = 5, onCountChange }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all'); // 'all' | 'hod' | 'faculty' | 'student'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      let url = '/institutions/pending-approvals';
      const params = [];
      if (selectedInstId) params.push(`institutionId=${selectedInstId}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url);
      if (res.data?.success) {
        const users = res.data.data || [];
        setPendingUsers(users);
        if (onCountChange) onCountChange(users.length);
      }
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  // If user is superadmin, fetch all institutions for the filter dropdown
  useEffect(() => {
    if (userRoleLevel >= 6) {
      api.get('/institutions').then(res => {
        if (res.data?.success) {
          setInstitutions(res.data.data || []);
        }
      }).catch(() => {});
    }
  }, [userRoleLevel]);

  useEffect(() => {
    fetchPendingApprovals();
  }, [selectedInstId]);

  const handleApprove = async (userId, userName, role) => {
    setActionLoading(userId);
    setNotification(null);
    try {
      const res = await api.post(`/institutions/approve-user/${userId}`);
      if (res.data?.success) {
        setNotification({
          type: 'success',
          message: `${userName} (${role.toUpperCase()}) has been granted platform login access successfully!`
        });
        const updated = pendingUsers.filter(u => u._id !== userId);
        setPendingUsers(updated);
        if (onCountChange) onCountChange(updated.length);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || `Failed to approve ${userName}.`
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to reject the registration request of ${userName}?`)) {
      return;
    }
    setActionLoading(userId);
    setNotification(null);
    try {
      const res = await api.post(`/institutions/reject-user/${userId}`);
      if (res.data?.success) {
        setNotification({
          type: 'info',
          message: `Registration request for ${userName} has been declined.`
        });
        const updated = pendingUsers.filter(u => u._id !== userId);
        setPendingUsers(updated);
        if (onCountChange) onCountChange(updated.length);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || `Failed to reject ${userName}.`
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Role counts (Approvals are strictly for HOD and Faculty)
  const hodCount = pendingUsers.filter(u => u.role === 'hod').length;
  const facultyCount = pendingUsers.filter(u => u.role === 'faculty').length;

  // Filtered users
  const filteredUsers = pendingUsers.filter(user => {
    if (selectedRoleFilter === 'hod' && user.role !== 'hod') return false;
    if (selectedRoleFilter === 'faculty' && user.role !== 'faculty') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = user.name?.toLowerCase().includes(term);
      const matchEmail = user.email?.toLowerCase().includes(term);
      const matchDept = user.departmentId?.name?.toLowerCase().includes(term) || user.departmentId?.code?.toLowerCase().includes(term);
      const matchDesignation = user.designation?.toLowerCase().includes(term);
      const matchInst = user.institutionId?.name?.toLowerCase().includes(term);
      const matchId = user.studentId?.toLowerCase().includes(term);
      return matchName || matchEmail || matchDept || matchDesignation || matchInst || matchId;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Instruction */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-slate-900 border border-amber-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Account Login & Role Approvals</span>
              {pendingUsers.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                  {pendingUsers.length} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and authorize registrations for Faculty and Head of Department (HOD) accounts. Students are auto-approved upon registration and do not require manual administrative approval.
            </p>
          </div>
        </div>

        <button
          onClick={fetchPendingApprovals}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all shrink-0 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Requests</span>
        </button>
      </div>

      {/* Action / Status Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          notification.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
            : notification.type === 'error'
            ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role Filter Pills & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedRoleFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All Requests</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 font-mono">
              {pendingUsers.length}
            </span>
          </button>

          {/* HOD Filter (visible to Inst Admin & Super Admin) */}
          {userRoleLevel >= 5 && (
            <button
              onClick={() => setSelectedRoleFilter('hod')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedRoleFilter === 'hod'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>HOD Requests</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 font-mono">
                {hodCount}
              </span>
            </button>
          )}

          {/* Faculty Filter */}
          <button
            onClick={() => setSelectedRoleFilter('faculty')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedRoleFilter === 'faculty'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Faculty Requests</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 font-mono">
              {facultyCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Superadmin Institution selector */}
          {userRoleLevel >= 6 && institutions.length > 0 && (
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 outline-none focus:border-indigo-500"
            >
              <option value="">All Institutions</option>
              {institutions.map(inst => (
                <option key={inst._id} value={inst._id}>
                  {inst.name} ({inst.code})
                </option>
              ))}
            </select>
          )}

          {/* Live Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, dept..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Requests Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-sm">Loading pending approval requests...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Pending Approval Requests</h3>
          <p className="text-xs text-slate-400 max-w-md">
            {searchTerm || selectedRoleFilter !== 'all'
              ? 'No requests match your current search or role filter criteria.'
              : 'All faculty and HOD registration requests have been reviewed and approved. New login requests will appear here immediately.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredUsers.map((user) => {
            const isHOD = user.role === 'hod';
            const isFaculty = user.role === 'faculty';
            const isStudent = user.role === 'student' || user.role === 'student_rep';

            return (
              <div
                key={user._id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left Info Column */}
                <div className="flex items-start gap-4">
                  {/* Avatar / Initial */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base border shrink-0 ${
                    isHOD
                      ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                      : isFaculty
                      ? 'bg-amber-600/20 border-amber-500/40 text-amber-300'
                      : 'bg-sky-600/20 border-sky-500/40 text-sky-300'
                  }`}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-white leading-tight">
                        {user.name}
                      </h4>

                      {/* Role Pill */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                        isHOD
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : isFaculty
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}>
                        {isHOD ? 'Head of Department (Level 4)' : isFaculty ? 'Faculty Mentor (Level 3)' : 'Student (Level 1)'}
                      </span>

                      {user.designation && (
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          • {user.designation}
                        </span>
                      )}
                    </div>

                    {/* Contact & Affiliation row */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-mono text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {user.email}
                      </span>

                      {user.studentId && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                          Staff/ID: <span className="font-mono text-slate-300">{user.studentId}</span>
                        </span>
                      )}

                      {user.departmentId && (
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                          {user.departmentId.name} ({user.departmentId.code})
                        </span>
                      )}

                      {user.sectionId && (
                        <span className="flex items-center gap-1 text-slate-400">
                          Section: <span className="text-slate-200">{user.sectionId.name}</span>
                        </span>
                      )}

                      {user.institutionId && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Layers className="w-3.5 h-3.5 text-slate-500" />
                          {user.institutionId.name}
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Clock className="w-3 h-3" />
                        Requested {new Date(user.createdAt).toLocaleDateString()} ({new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={() => handleApprove(user._id, user.name, user.role)}
                    disabled={actionLoading === user._id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {actionLoading === user._id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Grant Approval</span>
                  </button>

                  <button
                    onClick={() => handleReject(user._id, user.name)}
                    disabled={actionLoading === user._id}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsTab;
