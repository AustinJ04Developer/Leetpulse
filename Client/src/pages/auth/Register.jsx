import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Lock, Mail, User as UserIcon, Code, ArrowRight, Eye, EyeOff, Building2, GraduationCap, Hash, Globe, MapPin, Briefcase, ShieldCheck, CheckCircle2, RefreshCw, AlertCircle, ExternalLink, Check } from 'lucide-react';
import api from '../../services/api';

const Register = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'staff' | 'institution'
  
  // Dynamic Options Loaded from Server
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState([]);

  // Student Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  
  // Dual Select/Type Fields
  const [departmentId, setDepartmentId] = useState('');
  const [departmentCustom, setDepartmentCustom] = useState('');

  const [academicYearId, setAcademicYearId] = useState('');
  const [academicYearCustom, setAcademicYearCustom] = useState('');

  const [batchId, setBatchId] = useState('');
  const [batchCustom, setBatchCustom] = useState('');

  const [sectionId, setSectionId] = useState('');
  const [sectionCustom, setSectionCustom] = useState('');

  const [yearLevel, setYearLevel] = useState(1);
  const [semester, setSemester] = useState(1);

  const [academicStatus, setAcademicStatus] = useState('Pursuing');
  const [cohortCustom, setCohortCustom] = useState('');

  // LeetCode Verification State
  const [verifyingLeetCode, setVerifyingLeetCode] = useState(false);
  const [leetCodeVerifiedProfile, setLeetCodeVerifiedProfile] = useState(null);
  const [leetCodeError, setLeetCodeError] = useState('');
  const leetCodeTimerRef = React.useRef(null);

  const handleVerifyLeetCode = async (valueToVerify) => {
    const input = (valueToVerify !== undefined ? valueToVerify : leetcodeUsername).trim();
    if (!input) {
      setLeetCodeVerifiedProfile(null);
      setLeetCodeError('');
      return null;
    }

    setVerifyingLeetCode(true);
    setLeetCodeError('');

    try {
      const res = await api.get(`/auth/verify-leetcode?input=${encodeURIComponent(input)}`);
      if (res.data?.isValid) {
        const profileData = { ...res.data.profile, input, username: res.data.username };
        setLeetCodeVerifiedProfile(profileData);
        setLeetCodeError('');
        return profileData;
      } else {
        setLeetCodeVerifiedProfile(null);
        setLeetCodeError(res.data?.message || 'LeetCode profile not found. Please verify the URL or username.');
        return null;
      }
    } catch (err) {
      setLeetCodeVerifiedProfile(null);
      setLeetCodeError(err.response?.data?.message || 'Unable to reach LeetCode servers to verify profile.');
      return null;
    } finally {
      setVerifyingLeetCode(false);
    }
  };

  const handleLeetCodeChange = (val) => {
    setLeetcodeUsername(val);
    setLeetCodeVerifiedProfile(null);
    setLeetCodeError('');

    if (leetCodeTimerRef.current) {
      clearTimeout(leetCodeTimerRef.current);
    }

    // Auto verify if user pasted a full URL or typed an identifier
    if (val.includes('leetcode.com') || val.includes('leetcode.cn') || val.trim().length >= 4) {
      leetCodeTimerRef.current = setTimeout(() => {
        handleVerifyLeetCode(val);
      }, 700);
    }
  };

  // Staff / HOD Form State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [targetRole, setTargetRole] = useState('faculty'); // 'hod' | 'faculty'
  const [staffInstId, setStaffInstId] = useState('');
  const [staffDeptId, setStaffDeptId] = useState('');
  const [staffSecId, setStaffSecId] = useState('');
  const [staffDesignation, setStaffDesignation] = useState('');
  const [staffEmpId, setStaffEmpId] = useState('');
  const [staffPasscode, setStaffPasscode] = useState('');
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState('');

  // Institution Form State
  const [instName, setInstName] = useState('');
  const [instCode, setInstCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [instPassword, setInstPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  // Common UI State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  // Load registration options for chosen institution
  const fetchRegistrationOptions = (targetInstId) => {
    const query = targetInstId ? `?institutionId=${targetInstId}` : '';
    api.get(`/auth/registration-options${query}`)
      .then(res => {
        if (res.data.success && res.data.data) {
          const { institutions: insts, selectedInstitutionId, departments: depts, academicYears: years, batches: bts, sections: secs } = res.data.data;
          setInstitutions(insts || []);
          if (!institutionId && selectedInstitutionId) {
            setInstitutionId(selectedInstitutionId);
          }
          if (!staffInstId && selectedInstitutionId) {
            setStaffInstId(selectedInstitutionId);
          }
          setDepartments(depts || []);
          setAcademicYears(years || []);
          setBatches(bts || []);
          setSections(secs || []);
        }
      })
      .catch(err => {
        console.error('Error fetching registration options:', err);
      });
  };

  useEffect(() => {
    fetchRegistrationOptions(activeTab === 'staff' ? staffInstId : institutionId);
  }, [institutionId, staffInstId, activeTab]);

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name || !email || !password || !registerNumber || !studentId || !leetcodeUsername) {
        setError('All registration fields (Full Name, Email, Password, Register No, Student ID, LeetCode Username) are required.');
        setLoading(false);
        return;
      }

      if (!departmentId || (departmentId === '__custom__' && !departmentCustom.trim())) {
        setError('Please select or type your Department.');
        setLoading(false);
        return;
      }

      if (!academicYearId || (academicYearId === '__custom__' && !academicYearCustom.trim())) {
        setError('Please select or type your Academic Year.');
        setLoading(false);
        return;
      }

      if (!batchId || (batchId === '__custom__' && !batchCustom.trim())) {
        setError('Please select or type your Academic Batch.');
        setLoading(false);
        return;
      }

      // Verification Layer: Ensure LeetCode URL / username is authentic before registration
      let verifiedUsername = leetcodeUsername.trim();
      let activeProfile = leetCodeVerifiedProfile;

      if (!activeProfile || activeProfile.input !== leetcodeUsername.trim()) {
        activeProfile = await handleVerifyLeetCode(leetcodeUsername);
        if (!activeProfile) {
          setError(leetCodeError || 'Please provide a valid LeetCode profile URL or username.');
          setLoading(false);
          return;
        }
      }

      verifiedUsername = activeProfile.username;

      const isCustomDept = departmentId === '__custom__';
      const isCustomYear = academicYearId === '__custom__';
      const isCustomBatch = batchId === '__custom__';
      const isCustomSection = sectionId === '__custom__';

      const payload = {
        name,
        email,
        password,
        leetcodeUsername: verifiedUsername,
        institutionId,
        departmentId: isCustomDept ? '' : departmentId,
        departmentCustom: isCustomDept ? departmentCustom : '',
        academicYearId: isCustomYear ? '' : academicYearId,
        academicYearCustom: isCustomYear ? academicYearCustom : '',
        batchId: isCustomBatch ? '' : batchId,
        batchCustom: isCustomBatch ? batchCustom : '',
        academicBatch: isCustomBatch ? batchCustom : '',
        sectionId: isCustomSection ? '' : sectionId,
        sectionCustom: isCustomSection ? sectionCustom : '',
        yearLevel: Number(yearLevel),
        semester: Number(semester),
        academicStatus,
        cohortCustom,
        registerNumber,
        studentId
      };

      const res = await api.post('/auth/register', payload);

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        await refreshUser();
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingApprovalMsg('');
    setLoading(true);

    try {
      if (!staffName || !staffEmail || !staffPassword || !targetRole || !staffInstId || !staffDeptId) {
        setError('Full Name, Email, Password, Target Role, Institution, and Department are required.');
        setLoading(false);
        return;
      }

      const payload = {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        targetRole,
        institutionId: staffInstId,
        departmentId: staffDeptId,
        sectionId: staffSecId || null,
        designation: staffDesignation,
        staffId: staffEmpId,
        staffPasscode: staffPasscode
      };

      const res = await api.post('/auth/register-staff', payload);

      if (res.data.success) {
        if (res.data.isApproved) {
          localStorage.setItem('token', res.data.token);
          await refreshUser();
          navigate(targetRole === 'hod' ? '/institution/dashboard' : '/faculty/dashboard');
        } else {
          setPendingApprovalMsg(res.data.message || 'Registration submitted! Your account is pending approval by your Institution Admin or HOD.');
        }
      } else {
        setError(res.data.message || 'Staff registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Staff registration error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInstitutionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register-institution', {
        institutionName: instName,
        code: instCode,
        adminName,
        adminEmail,
        password: instPassword,
        website,
        city,
        phone
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        await refreshUser();
        navigate('/institution/dashboard');
      } else {
        setError(res.data.message || 'Institution onboarding failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Institution onboarding error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-y-auto my-6">
      <div className="w-full max-w-xl glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative z-10 my-auto">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-400">
            <Code2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Platform Account</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Join LeetPulse Academic Monitoring Platform</p>
        </div>

        {/* Tab Selection: Student vs Staff/HOD vs Institution Registration */}
        <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-6 gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('student'); setError(''); setPendingApprovalMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'student' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('staff'); setError(''); setPendingApprovalMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'staff' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>HOD / Staff</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('institution'); setError(''); setPendingApprovalMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'institution' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Institution Admin</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {pendingApprovalMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-white">Registration Submitted Successfully!</p>
            <p className="text-slate-300 font-normal">{pendingApprovalMsg}</p>
            <Link to="/login" className="inline-block mt-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold transition-all">
              Return to Sign In
            </Link>
          </div>
        )}

        {/* FORM 1: STUDENT REGISTRATION */}
        {!pendingApprovalMsg && activeTab === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="student@college.edu"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Register Number / Roll No</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 961421104001"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU-2026-01"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none font-mono"
                />
              </div>
            </div>

            {/* Institution / College Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Institution / College</label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="">Select Institution</option>
                {institutions.map(inst => (
                  <option key={inst._id} value={inst._id}>{inst.name} ({inst.code})</option>
                ))}
              </select>
            </div>

            {/* Department & Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Department</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Select or Type</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 mb-1.5"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                  ))}
                  <option value="__custom__">＋ Type Custom / New Dept</option>
                </select>
                {departmentId === '__custom__' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter Department (e.g. Computer Science)"
                    value={departmentCustom}
                    onChange={(e) => setDepartmentCustom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/50 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 animate-fadeIn"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Academic Year</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Select or Type</span>
                </label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 mb-1.5"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map(y => (
                    <option key={y._id} value={y._id}>{y.displayName || y.yearLabel}</option>
                  ))}
                  <option value="__custom__">＋ Type Custom Academic Year</option>
                </select>
                {academicYearId === '__custom__' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter Year (e.g. 2026-2027)"
                    value={academicYearCustom}
                    onChange={(e) => setAcademicYearCustom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/50 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 animate-fadeIn"
                  />
                )}
              </div>
            </div>

            {/* Academic Status & Academic Batch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Status</label>
                <select
                  value={academicStatus}
                  onChange={(e) => setAcademicStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="Pursuing">Pursuing</option>
                  <option value="Graduated">Graduated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Academic Batch (4-Year Range)</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Select or Type</span>
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 mb-1.5"
                >
                  <option value="">Select Academic Batch</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.name} ({b.cohortRange || 'Cohort'})</option>
                  ))}
                  <option value="__custom__">＋ Type Custom Batch (e.g. 2023 - 2027)</option>
                </select>
                {batchId === '__custom__' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter Batch Range (e.g. 2023 - 2027)"
                    value={batchCustom}
                    onChange={(e) => setBatchCustom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/50 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 animate-fadeIn font-mono"
                  />
                )}
              </div>
            </div>

            {/* Section & Cohort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Section</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Optional</span>
                </label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 mb-1.5"
                >
                  <option value="">Select Section</option>
                  {sections.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                  <option value="__custom__">＋ Type Custom Section</option>
                </select>
                {sectionId === '__custom__' && (
                  <input
                    type="text"
                    placeholder="Enter Section (e.g. Section A)"
                    value={sectionCustom}
                    onChange={(e) => setSectionCustom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/50 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 animate-fadeIn"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Academic Cohort</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elite Training Batch (Optional)"
                  value={cohortCustom}
                  onChange={(e) => setCohortCustom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Year Level & Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Year Level</label>
                <select
                  value={yearLevel}
                  onChange={(e) => {
                    const yr = Number(e.target.value);
                    setYearLevel(yr);
                    const minSem = (yr * 2) - 1;
                    const maxSem = yr * 2;
                    if (semester < minSem || semester > maxSem) {
                      setSemester(minSem);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value={1}>1st Year (Freshman)</option>
                  <option value={2}>2nd Year (Sophomore)</option>
                  <option value={3}>3rd Year (Pre-Final Year)</option>
                  <option value={4}>4th Year (Final Year)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => {
                    const sem = Number(e.target.value);
                    setSemester(sem);
                    setYearLevel(Math.ceil(sem / 2));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                >
                  {[((Number(yearLevel) || 1) * 2) - 1, (Number(yearLevel) || 1) * 2].map(sem => (
                    <option key={sem} value={sem}>Semester {sem} (Year {Math.ceil(sem / 2)})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* LeetCode Profile Verification Layer */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  LeetCode Profile URL or Handle
                </label>
                {verifyingLeetCode && (
                  <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Verifying with LeetCode...
                  </span>
                )}
                {!verifyingLeetCode && leetCodeVerifiedProfile && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Authentic Profile
                  </span>
                )}
              </div>

              <div className="relative">
                <Code className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={leetcodeUsername}
                  onChange={(e) => handleLeetCodeChange(e.target.value)}
                  onBlur={() => handleVerifyLeetCode()}
                  className={`w-full pl-9 pr-24 py-2.5 rounded-xl bg-slate-900/90 border text-sm text-white placeholder-slate-500 outline-none font-mono transition-all ${
                    leetCodeVerifiedProfile 
                      ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' 
                      : leetCodeError 
                      ? 'border-rose-500/60 focus:border-rose-500' 
                      : 'border-slate-800 focus:border-indigo-500'
                  }`}
                  placeholder="https://leetcode.com/u/sarah_connor/ or sarah_connor"
                />

                <button
                  type="button"
                  onClick={() => handleVerifyLeetCode()}
                  disabled={verifyingLeetCode || !leetcodeUsername.trim()}
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-[11px] font-bold transition-all disabled:opacity-50 disabled:text-slate-500 flex items-center gap-1 active:scale-95 shadow-sm"
                >
                  {verifyingLeetCode ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-200" />
                  )}
                  <span>Verify</span>
                </button>
              </div>

              {/* Error feedback if URL / username is invalid */}
              {leetCodeError && !verifyingLeetCode && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="leading-snug">{leetCodeError}</div>
                </div>
              )}

              {/* Verified Profile Preview Card */}
              {leetCodeVerifiedProfile && !verifyingLeetCode && (
                <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/5 backdrop-blur-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={leetCodeVerifiedProfile.userAvatar || 'https://assets.leetcode.com/users/default_avatar.jpg'} 
                      alt={leetCodeVerifiedProfile.username}
                      className="w-10 h-10 rounded-xl bg-slate-800 border border-emerald-500/40 object-cover shrink-0"
                      onError={(e) => { e.target.src = 'https://assets.leetcode.com/users/default_avatar.jpg'; }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">
                          {leetCodeVerifiedProfile.realName || leetCodeVerifiedProfile.username}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                          @{leetCodeVerifiedProfile.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                        <span className="text-emerald-400 font-semibold">
                          {leetCodeVerifiedProfile.totalSolved} Problems Solved
                        </span>
                        {leetCodeVerifiedProfile.ranking > 0 && (
                          <span>• Global Rank #{leetCodeVerifiedProfile.ranking.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <a 
                    href={`https://leetcode.com/u/${leetCodeVerifiedProfile.username}/`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
                    title="View Profile on LeetCode"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Register Student Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* FORM 2: STAFF & HOD REGISTRATION */}
        {!pendingApprovalMsg && activeTab === 'staff' && (
          <form onSubmit={handleStaffSubmit} className="space-y-4">
            {/* Target Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Institutional Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetRole('faculty')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetRole === 'faculty' 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold">Faculty / Staff Instructor</p>
                  <p className="text-[10px] text-slate-400">Mentors students & manages sections (Level 3)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole('hod')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetRole === 'hod' 
                      ? 'bg-purple-600/20 border-purple-500 text-white' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold">Head of Department (HOD)</p>
                  <p className="text-[10px] text-slate-400">Leads department & manages staff (Level 4)</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="Prof. Robert Vance"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Institutional Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="r.vance@college.edu"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Designation / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Associate Professor / HOD"
                  value={staffDesignation}
                  onChange={(e) => setStaffDesignation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Employee / Staff ID</label>
                <input
                  type="text"
                  placeholder="e.g. EMP-2026-88"
                  value={staffEmpId}
                  onChange={(e) => setStaffEmpId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none font-mono"
                />
              </div>
            </div>

            {/* Institution & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Institution</label>
                <select
                  value={staffInstId}
                  onChange={(e) => setStaffInstId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select Institution</option>
                  {institutions.map(inst => (
                    <option key={inst._id} value={inst._id}>{inst.name} ({inst.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <select
                  value={staffDeptId}
                  onChange={(e) => setStaffDeptId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section (For Faculty) */}
            {targetRole === 'faculty' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Assigned Section</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Optional</span>
                </label>
                <select
                  value={staffSecId}
                  onChange={(e) => setStaffSecId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select Section</option>
                  {sections.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Security Passcode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Staff Security Passcode</span>
                <span className="text-[10px] text-indigo-400 font-normal">Auto-approves if valid</span>
              </label>
              <input
                type="text"
                placeholder="Enter passcode if provided by Admin (Optional)"
                value={staffPasscode}
                onChange={(e) => setStaffPasscode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder-slate-500 outline-none font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                If omitted, your account will be submitted to your Institution Admin / HOD for approval.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? 'Submitting Registration...' : `Register as ${targetRole === 'hod' ? 'Head of Department' : 'Faculty / Staff'}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* FORM 3: INSTITUTION REGISTRATION */}
        {!pendingApprovalMsg && activeTab === 'institution' && (
          <form onSubmit={handleInstitutionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Institution / College Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="Mar Ephraem College"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Short Code / Acronym</label>
                <input
                  type="text"
                  placeholder="e.g. MEC"
                  value={instCode}
                  onChange={(e) => setInstCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Administrator Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="Placement Officer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Admin Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                    placeholder="placement@college.edu.in"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Website URL (Optional)</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="url"
                    placeholder="https://college.edu.in"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">City / Campus Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. Nagercoil"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Administrator Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={instPassword}
                  onChange={(e) => setInstPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? 'Onboarding Institution...' : 'Register New Institution & Admin'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
