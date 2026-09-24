import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import RoleBadge from '../../components/RoleBadge';
import PendingApprovalsTab from '../../components/PendingApprovalsTab';
import { 
  User, Code, Save, CheckCircle2, ShieldCheck, Image, GraduationCap, Building, 
  Calendar, Hash, Phone, Briefcase, Award, MapPin, Globe, Linkedin, Github, 
  RefreshCw, Sparkles, Layers, BookOpen, UserCheck, AlertCircle, ShieldAlert
} from 'lucide-react';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabQuery = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabQuery || 'general'); // 'general' | 'role_details' | 'integrations' | 'approvals'

  useEffect(() => {
    if (tabQuery) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // General & Contact Info
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl || '');
  const [website, setWebsite] = useState(user?.website || '');

  // Role-Specific Fields (Staff / Faculty / Admins)
  const [designation, setDesignation] = useState(user?.designation || '');
  const [specialization, setSpecialization] = useState(user?.specialization || '');
  const [officeLocation, setOfficeLocation] = useState(user?.officeLocation || '');

  // Role-Specific Fields (Students & Student Reps)
  const [registerNumber, setRegisterNumber] = useState(user?.registerNumber || '');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [academicBatch, setAcademicBatch] = useState(user?.academicBatch || '');
  const [academicStatus, setAcademicStatus] = useState(user?.academicStatus || 'Pursuing');
  const [cohortCustom, setCohortCustom] = useState(user?.academicCohorts ? user.academicCohorts.join(', ') : '');
  const [yearLevel, setYearLevel] = useState(user?.yearLevel || 1);
  const [semester, setSemester] = useState(user?.semester || 1);

  // Institutional Hierarchy References & Custom Entry States
  const [departmentId, setDepartmentId] = useState(user?.departmentId?._id || user?.departmentId || '');
  const [departmentCustom, setDepartmentCustom] = useState('');
  const [academicYearId, setAcademicYearId] = useState(user?.academicYearId?._id || user?.academicYearId || '');
  const [academicYearCustom, setAcademicYearCustom] = useState('');
  const [batchId, setBatchId] = useState(user?.batchId?._id || user?.batchId || '');
  const [batchCustom, setBatchCustom] = useState('');
  const [sectionId, setSectionId] = useState(user?.sectionId?._id || user?.sectionId || '');
  const [sectionCustom, setSectionCustom] = useState('');

  // Integrations & LeetCode
  const [leetcodeUsername, setLeetcodeUsername] = useState(user?.leetcodeUsername || '');
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);

  // Options Lists from API
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState([]);

  // UI Status
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncingLC, setSyncingLC] = useState(false);

  // Synchronize state when auth user updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
      setBio(user.bio || '');
      setGithubUrl(user.githubUrl || '');
      setLinkedinUrl(user.linkedinUrl || '');
      setWebsite(user.website || '');
      setDesignation(user.designation || '');
      setSpecialization(user.specialization || '');
      setOfficeLocation(user.officeLocation || '');
      setRegisterNumber(user.registerNumber || '');
      setStudentId(user.studentId || '');
      setAcademicBatch(user.academicBatch || '');
      setAcademicStatus(user.academicStatus || 'Pursuing');
      setCohortCustom(user.academicCohorts ? user.academicCohorts.join(', ') : '');
      setYearLevel(user.yearLevel || 1);
      setSemester(user.semester || 1);
      setDepartmentId(user.departmentId?._id || user.departmentId || '');
      setAcademicYearId(user.academicYearId?._id || user.academicYearId || '');
      setBatchId(user.batchId?._id || user.batchId || '');
      setSectionId(user.sectionId?._id || user.sectionId || '');
      setLeetcodeUsername(user.leetcodeUsername || '');
      setMfaEnabled(user.mfaEnabled || false);
    }
  }, [user]);

  // Load available option lists for dropdowns
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const instId = user?.institutionId?._id || user?.institutionId;
        const query = instId ? `?institutionId=${instId}` : '';
        const [dRes, yRes, bRes, sRes] = await Promise.all([
          api.get(`/institutions/departments/list${query}`),
          api.get(`/institutions/academic-years/list${query}`),
          api.get(`/institutions/batches/list${query}`),
          api.get(`/institutions/sections/list${query}`)
        ]);

        if (dRes.data.success) setDepartments(dRes.data.data);
        if (yRes.data.success) setAcademicYears(yRes.data.data);
        if (bRes.data.success) setBatches(bRes.data.data);
        if (sRes.data.success) setSections(sRes.data.data);
      } catch (err) {
        console.error('Failed to load institutional options:', err);
      }
    };
    fetchOptions();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setError('');

    try {
      const isCustomDept = departmentId === '__custom__';
      const isCustomYear = academicYearId === '__custom__';
      const isCustomBatch = batchId === '__custom__';
      const isCustomSection = sectionId === '__custom__';

      const res = await api.put('/users/profile', {
        name,
        phone,
        avatar: avatar.trim(),
        bio,
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        website: website.trim(),
        designation: designation.trim(),
        specialization: specialization.trim(),
        officeLocation: officeLocation.trim(),
        registerNumber: registerNumber.trim(),
        studentId: studentId.trim(),
        academicBatch: isCustomBatch ? batchCustom.trim() : academicBatch.trim(),
        academicStatus,
        cohortCustom: cohortCustom.trim(),
        yearLevel: Number(yearLevel),
        semester: Number(semester),
        departmentId: isCustomDept ? '' : departmentId,
        departmentCustom: isCustomDept ? departmentCustom.trim() : '',
        academicYearId: isCustomYear ? '' : academicYearId,
        academicYearCustom: isCustomYear ? academicYearCustom.trim() : '',
        batchId: isCustomBatch ? '' : batchId,
        batchCustom: isCustomBatch ? batchCustom.trim() : '',
        sectionId: isCustomSection ? '' : sectionId,
        sectionCustom: isCustomSection ? sectionCustom.trim() : '',
        leetcodeUsername: leetcodeUsername ? leetcodeUsername.trim() : null,
        mfaEnabled
      });

      if (res.data.success) {
        setMsg('Profile details saved and updated successfully!');
        await refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    setSyncingLC(true);
    setMsg('');
    setError('');
    try {
      const res = await api.post('/leetcode/sync-now');
      if (res.data.success) {
        setMsg('Live LeetCode statistics sync triggered successfully!');
        await refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to trigger LeetCode sync');
    } finally {
      setSyncingLC(false);
    }
  };

  // Role Level Helpers
  const isStudentOrRep = user?.roleLevel <= 2;
  const isFacultyOrHOD = user?.roleLevel === 3 || user?.roleLevel === 4;
  const isInstAdmin = user?.roleLevel === 5;
  const isSuperAdmin = user?.roleLevel >= 6;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Member Profile & Credentials</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your personal profile, role-specific attributes, contact info, and integrations
          </p>
        </div>

        {user?.leetcodeUsername && (
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={syncingLC}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingLC ? 'animate-spin' : ''}`} />
            <span>{syncingLC ? 'Syncing Stats...' : 'Sync LeetCode Stats'}</span>
          </button>
        )}
      </div>

      {/* Main Profile Glass Container */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Alerts */}
        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{msg}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Member Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-800">
          <UserAvatar name={name || user?.email} avatar={avatar} className="w-20 h-20 rounded-2xl text-2xl font-bold border-2 border-indigo-500/30 shadow-lg flex-shrink-0" />
          
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-white tracking-tight truncate">{name || 'User Profile'}</h2>
              <RoleBadge role={user?.role} roleLevel={user?.roleLevel} />
            </div>

            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>{user?.email}</span>
              {designation && <span className="text-indigo-400 font-semibold">• {designation}</span>}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              {user?.institutionId?.name && (
                <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-slate-300">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{user.institutionId.name} ({user.institutionId.code})</span>
                </span>
              )}

              {user?.departmentId?.name && (
                <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-slate-300">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{user.departmentId.name}</span>
                </span>
              )}

              {user?.leetcodeUsername && (
                <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-amber-400 font-mono">
                  <Code className="w-3.5 h-3.5" />
                  <span>@{user.leetcodeUsername}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('general')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'general' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal & Social</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('role_details')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'role_details' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isStudentOrRep ? <GraduationCap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
            <span>{isStudentOrRep ? 'Academic Profile' : 'Role Details'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('integrations')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'integrations' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>LeetCode & Security</span>
          </button>

          {user?.roleLevel >= 4 && (
            <button
              type="button"
              onClick={() => handleTabChange('approvals')}
              className={`flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'approvals' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Role Approvals</span>
            </button>
          )}
        </div>

        {/* TAB: APPROVALS FOR HOD / ADMIN */}
        {activeTab === 'approvals' ? (
          <div className="pt-2">
            <PendingApprovalsTab userRoleLevel={user?.roleLevel} />
          </div>
        ) : (
          /* FORM CONTAINER */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TAB 1: GENERAL & PERSONAL INFO */}
            {activeTab === 'general' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Personal Information & Contact</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Profile Avatar URL</label>
                <div className="relative">
                  <Image className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Headline</label>
                <textarea
                  rows="3"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                  placeholder="Passionate about Algorithms, Data Structures, and Software Development..."
                />
              </div>

              {/* Social & Professional Links */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300">Social & Professional Links</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">LinkedIn Profile</label>
                    <div className="relative">
                      <Linkedin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">GitHub Profile</label>
                    <div className="relative">
                      <Github className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Portfolio / Website</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="url"
                        placeholder="https://yourwebsite.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROLE-SPECIFIC DETAILS */}
          {activeTab === 'role_details' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                {isStudentOrRep ? <GraduationCap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                <span>{isStudentOrRep ? 'Academic Student Information' : 'Professional & Institutional Role Details'}</span>
              </h3>

              {/* STUDENTS & CRs (LEVEL 1 & 2) */}
              {isStudentOrRep && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Register Number / Roll No</label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          placeholder="e.g. 961421104001"
                          value={registerNumber}
                          onChange={(e) => setRegisterNumber(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Student ID (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. STU-2026-04"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                        <span>Department</span>
                        <span className="text-[10px] text-indigo-400 font-normal">Select or Type</span>
                      </label>
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500 mb-1.5"
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                        ))}
                        <option value="__custom__">＋ Type Custom Department</option>
                      </select>
                      {departmentId === '__custom__' && (
                        <input
                          type="text"
                          required
                          placeholder="Enter Department Name"
                          value={departmentCustom}
                          onChange={(e) => setDepartmentCustom(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/50 text-xs text-white outline-none"
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
                          placeholder="Enter Academic Year (e.g. 2026-2027)"
                          value={academicYearCustom}
                          onChange={(e) => setAcademicYearCustom(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/50 text-xs text-white outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Academic Status & Academic Batch (Degree 4-Year Range) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Status</label>
                      <select
                        value={academicStatus}
                        onChange={(e) => setAcademicStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="Pursuing">Pursuing</option>
                        <option value="Graduated">Graduated</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                        <span>Academic Batch (Degree 4-Year Range)</span>
                        <span className="text-[10px] text-indigo-400 font-normal">Select or Type</span>
                      </label>
                      <select
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 mb-1.5"
                      >
                        <option value="">Select Batch</option>
                        {batches.map(b => (
                          <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                        <option value="__custom__">＋ Type Custom Batch (e.g. 2023 - 2027)</option>
                      </select>
                      {batchId === '__custom__' && (
                        <input
                          type="text"
                          required
                          placeholder="Enter Batch (e.g. 2023 - 2027)"
                          value={batchCustom}
                          onChange={(e) => setBatchCustom(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/50 text-xs text-white outline-none font-mono"
                        />
                      )}
                    </div>
                  </div>

                  {/* Section & Academic Cohorts (Special Teams / Groups - OPTIONAL) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                        <span>Section</span>
                        <span className="text-[10px] text-indigo-400 font-normal">Select or Type</span>
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
                          required
                          placeholder="Enter Section Name"
                          value={sectionCustom}
                          onChange={(e) => setSectionCustom(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/50 text-xs text-white outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                        <span>Academic Cohorts (Special Teams / Groups)</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">Optional</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Elite Training Batch, MPM Batch (Optional)"
                        value={cohortCustom}
                        onChange={(e) => setCohortCustom(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Year Level</label>
                      <select
                        value={yearLevel}
                        onChange={(e) => {
                          const yrNum = Number(e.target.value);
                          setYearLevel(yrNum);
                          const minSem = (yrNum * 2) - 1;
                          const maxSem = yrNum * 2;
                          if (semester < minSem || semester > maxSem) {
                            setSemester(minSem);
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                      >
                        <option value={1}>1st Year (Freshman)</option>
                        <option value={2}>2nd Year (Sophomore)</option>
                        <option value={3}>3rd Year (Pre-Final Year)</option>
                        <option value={4}>4th Year (Final Year)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Semester (Mapped to Year {yearLevel})</label>
                      <select
                        value={semester}
                        onChange={(e) => {
                          const semNum = Number(e.target.value);
                          setSemester(semNum);
                          setYearLevel(Math.ceil(semNum / 2));
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                      >
                        {[((Number(yearLevel) || 1) * 2) - 1, (Number(yearLevel) || 1) * 2].map(sem => (
                          <option key={sem} value={sem}>Semester {sem} (Year {Math.ceil(sem / 2)})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* FACULTY & HOD (LEVEL 3 & 4) */}
              {isFacultyOrHOD && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Designation</label>
                      <div className="relative">
                        <Award className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          placeholder="e.g. Associate Professor & Head"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Specialization / Research Focus</label>
                      <input
                        type="text"
                        placeholder="e.g. Artificial Intelligence, Data Structures & Algorithms"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Office / Cabin Location</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          placeholder="e.g. Room 304, IT Block"
                          value={officeLocation}
                          onChange={(e) => setOfficeLocation(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INSTITUTION ADMIN (LEVEL 5) */}
              {isInstAdmin && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Administrative Role / Title</label>
                      <div className="relative">
                        <Award className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          placeholder="e.g. Principal / Director of Academics"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Office / Executive Suite</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          placeholder="e.g. Administrative Block, Floor 2"
                          value={officeLocation}
                          onChange={(e) => setOfficeLocation(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUPERADMIN / DEVADMIN (LEVEL 6) */}
              {isSuperAdmin && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Overall Developer & Super Administrator</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    You hold Level 6 Overall Developer & Super Administrator privileges across all multi-tenant institution instances. You can view, manage, and configure system parameters.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Platform Designation</label>
                      <input
                        type="text"
                        placeholder="e.g. Lead Platform Engineer"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Domain / Core Area</label>
                      <input
                        type="text"
                        placeholder="e.g. System Architecture & Security"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LEETCODE & SECURITY */}
          {activeTab === 'integrations' && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>LeetCode Integration & Account Security</span>
              </h3>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">LeetCode Username Handle</label>
                <div className="relative">
                  <Code className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={leetcodeUsername}
                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                    placeholder="e.g. alexmercer_dev"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Linking your LeetCode username enables automatic real-time stats synchronization, contest rating tracking, and inclusion on institutional leaderboards.
                </p>
              </div>

              {/* Multi-Factor Authentication */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mfaEnabled}
                    onChange={(e) => setMfaEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-200">
                    Enable Two-Factor Security Authentication (2FA / TOTP)
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 pl-7">
                  Adds an additional security layer during login using time-based verification passcodes.
                </p>
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Role: <strong className="text-white uppercase">{user?.role}</strong> (Level {user?.roleLevel})
            </span>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
    </div>
  );
};

export default ProfilePage;
