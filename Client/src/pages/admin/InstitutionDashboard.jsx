import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import PendingApprovalsTab from '../../components/PendingApprovalsTab';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Users, 
  Award, 
  AlertTriangle, 
  BookOpen, 
  Layers, 
  RefreshCw, 
  ShieldAlert, 
  Clock, 
  Check, 
  X,
  LayoutDashboard
} from 'lucide-react';

const InstitutionDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview'; // 'overview' | 'approvals' | 'departments'

  const [institution, setInstitution] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [instRes, deptRes, stuRes, riskRes, pendingRes] = await Promise.all([
        api.get('/institutions').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/institutions/departments/list').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/students?limit=100').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/students/at-risk').catch(() => ({ data: { success: false, count: 0 } })),
        api.get('/institutions/pending-approvals').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (instRes.data?.success && instRes.data?.data?.length > 0) {
        setInstitution(instRes.data.data[0]);
      }
      if (deptRes.data?.success) setDepartments(deptRes.data.data || []);
      if (stuRes.data?.success) setStudents(stuRes.data.data || []);
      if (riskRes.data?.success) setAtRiskCount(riskRes.data.count || 0);
      if (pendingRes.data?.success) setPendingCount(pendingRes.data.count || pendingRes.data.data?.length || 0);
    } catch (err) {
      console.error('Failed to load institution dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading Institutional Analytics...</span>
      </div>
    );
  }

  const isHOD = user?.role === 'hod' || user?.roleLevel === 4;
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.stats && s.stats.totalSolved > 0).length;
  const totalSolved = students.reduce((sum, s) => sum + (s.stats?.totalSolved || 0), 0);
  const avgSolved = totalStudents > 0 ? Math.round(totalSolved / totalStudents) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {institution?.name || (isHOD ? 'Department Governance Hub' : 'Academic Institution Platform')}
            </h1>
            <p className="text-sm text-slate-400">
              Code: <span className="font-mono text-indigo-400">{institution?.code || 'INST'}</span> • {isHOD ? 'Department Oversight & Faculty Approvals' : 'Multi-Tenant Institutional Governance'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all shrink-0 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Modern Tab Bar */}
      <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => handleTabChange('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{isHOD ? 'Department Overview' : 'Institution Overview'}</span>
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
          onClick={() => handleTabChange('departments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'departments'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Academic Departments ({departments.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Students"
              value={totalStudents}
              icon={Users}
              subtext={`${activeStudents} active on LeetCode`}
            />
            <div 
              onClick={() => handleTabChange('approvals')}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <StatCard
                title="Pending Role Approvals"
                value={pendingCount}
                icon={Clock}
                subtext={pendingCount > 0 ? "Click to Review & Grant Access" : "All Accounts Approved"}
                trend={pendingCount > 0 ? 'down' : 'up'}
              />
            </div>
            <StatCard
              title="Avg Solved / Student"
              value={avgSolved}
              icon={Award}
              subtext={`Total: ${totalSolved.toLocaleString()} problems`}
            />
            <StatCard
              title="At-Risk Students"
              value={atRiskCount}
              icon={AlertTriangle}
              subtext="Requires Immediate Attention"
              trend={atRiskCount > 0 ? 'down' : 'up'}
            />
          </div>

          {/* Prompt banner if approvals are waiting */}
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
                    {pendingCount} Pending Login Request{pendingCount > 1 ? 's' : ''} Awaiting Approval
                  </h4>
                  <p className="text-xs text-slate-400">
                    Faculty or HOD applicants cannot log in until authorized. Click to open the Role Approvals tab.
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all">
                Review Now →
              </span>
            </div>
          )}

          {/* Departments Summary Cards */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Academic Departments Overview</span>
              </h2>
              <button
                onClick={() => handleTabChange('departments')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                View All →
              </button>
            </div>

            {departments.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No departments configured yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.slice(0, 6).map(dept => {
                  const deptStudents = students.filter(s => s.departmentId?.code === dept.code || s.departmentId === dept._id);
                  const deptSolved = deptStudents.reduce((sum, s) => sum + (s.stats?.totalSolved || 0), 0);

                  return (
                    <div key={dept._id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/40 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          {dept.code}
                        </span>
                        <span className="text-xs text-slate-400">{deptStudents.length} Students</span>
                      </div>
                      <h3 className="font-semibold text-white text-base mb-1">{dept.name}</h3>
                      <p className="text-xs text-slate-400 mb-3">HOD: {dept.hodId?.name || 'Unassigned'}</p>
                      <div className="pt-2 border-t border-slate-700/50 flex justify-between text-xs text-slate-300">
                        <span>Total Solved:</span>
                        <span className="font-semibold text-emerald-400">{deptSolved.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PENDING ROLE APPROVALS & LOGIN REQUESTS */}
      {activeTab === 'approvals' && (
        <PendingApprovalsTab 
          userRoleLevel={user?.roleLevel || 5} 
          onCountChange={(count) => setPendingCount(count)} 
        />
      )}

      {/* TAB 3: ACADEMIC DEPARTMENTS DIRECTORY */}
      {activeTab === 'departments' && (
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Academic Departments Directory</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Overview of departments, assigned HOD leadership, and student problem statistics
              </p>
            </div>
          </div>

          {departments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No departments configured yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {departments.map(dept => {
                const deptStudents = students.filter(s => s.departmentId?.code === dept.code || s.departmentId === dept._id);
                const deptSolved = deptStudents.reduce((sum, s) => sum + (s.stats?.totalSolved || 0), 0);

                return (
                  <div key={dept._id} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold font-mono px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {dept.code}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{deptStudents.length} Students</span>
                      </div>
                      <h3 className="font-bold text-white text-base mb-1.5">{dept.name}</h3>
                      <div className="text-xs text-slate-400 space-y-1 mb-4">
                        <p>
                          <span className="text-slate-500">HOD:</span>{' '}
                          <span className={dept.hodId?.name ? 'text-purple-300 font-semibold' : 'text-slate-500 italic'}>
                            {dept.hodId?.name || 'Pending HOD Assignment'}
                          </span>
                        </p>
                        {dept.hodId?.email && (
                          <p className="text-slate-500 font-mono text-[11px]">{dept.hodId.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Total Solved:</span>
                      <span className="font-bold text-emerald-400 text-sm">{deptSolved.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstitutionDashboard;

