const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const Organization = require('../models/Organization');

const JWT_SECRET = process.env.JWT_SECRET || 'leetcode_super_secret_jwt_key_2026_antigravity';

const generateTokens = (user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role, level: user.roleLevel },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { token };
};

const getRegistrationOptions = async (req, res) => {
  try {
    const Institution = require('../models/Institution');
    const Department = require('../models/Department');
    const AcademicYear = require('../models/AcademicYear');
    const Batch = require('../models/Batch');
    const Section = require('../models/Section');

    const institutions = await Institution.find({}).select('name code slug logoUrl primaryColor').sort({ name: 1 });

    let institutionId = req.query.institutionId;
    if (!institutionId && institutions.length > 0) {
      institutionId = institutions[0]._id;
    }

    let departments = [];
    let academicYears = [];
    let batches = [];
    let sections = [];

    if (institutionId) {
      departments = await Department.find({ institutionId }).select('name code').sort({ name: 1 });
      academicYears = await AcademicYear.find({ institutionId }).select('yearLabel displayName yearLevel isCurrent').sort({ yearLabel: -1 });
      batches = await Batch.find({ institutionId }).select('name cohortRange departmentId academicYearId targetYearLevel').sort({ name: 1 });
      sections = await Section.find({ institutionId }).select('name batchId').sort({ name: 1 });
    }

    res.json({
      success: true,
      data: {
        institutions,
        selectedInstitutionId: institutionId || null,
        departments,
        academicYears,
        batches,
        sections
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Public Verification Endpoint: Checks if a LeetCode URL or username exists on LeetCode.
 * Returns authenticity status, real name, avatar, and problem solve metrics.
 */
const verifyLeetCode = async (req, res) => {
  try {
    const rawInput = req.query.input || req.query.handle || req.query.url || req.body?.input || req.body?.handle || req.body?.url;
    if (!rawInput || !String(rawInput).trim()) {
      return res.status(400).json({ 
        success: false, 
        isValid: false, 
        message: 'Please provide a LeetCode profile URL or username.' 
      });
    }

    const { verifyLeetCodeUser } = require('../services/leetcodeService');
    const result = await verifyLeetCodeUser(String(rawInput).trim());
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, isValid: false, message: err.message });
  }
};

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      leetcodeUsername,
      institutionId,
      departmentId,
      departmentCustom,
      academicYearId,
      academicYearCustom,
      batchId,
      batchCustom,
      academicBatch,
      sectionId,
      sectionCustom,
      registerNumber,
      studentId
    } = req.body;

    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    const hasDept = departmentId || (departmentCustom && departmentCustom.trim());
    const hasBatch = batchId || (batchCustom && batchCustom.trim()) || (academicBatch && academicBatch.trim());
    const hasYear = academicYearId || (academicYearCustom && academicYearCustom.trim());

    if (!name || !normalizedEmail || !password || !registerNumber || !studentId || !leetcodeUsername || !hasDept || !hasBatch || !hasYear) {
      return res.status(400).json({
        success: false,
        message: 'Registration details (Name, Email, Password, Register No, Student ID, LeetCode Username, Department, Batch, and Academic Year) are required.'
      });
    }

    let existingUser = await User.findOne({ email: normalizedEmail });
    if (!existingUser && normalizedEmail) {
      existingUser = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') } });
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // LeetCode Profile Verification Layer
    const { verifyLeetCodeUser, syncUserLeetCode } = require('../services/leetcodeService');
    const leetCodeVerification = await verifyLeetCodeUser(leetcodeUsername);
    if (!leetCodeVerification.isValid) {
      return res.status(400).json({
        success: false,
        message: leetCodeVerification.message || `The provided LeetCode profile "${leetcodeUsername}" does not exist on LeetCode. Please provide a valid profile.`
      });
    }

    const verifiedLeetcodeUsername = leetCodeVerification.username;

    // Ensure this LeetCode username is not already registered by another student
    const existingLeetcode = await User.findOne({
      leetcodeUsername: { $regex: new RegExp(`^${verifiedLeetcodeUsername}$`, 'i') }
    });
    if (existingLeetcode) {
      return res.status(400).json({
        success: false,
        message: `LeetCode profile "${verifiedLeetcodeUsername}" is already linked to an existing account (${existingLeetcode.email}).`
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const Institution = require('../models/Institution');
    const Department = require('../models/Department');
    const AcademicYear = require('../models/AcademicYear');
    const Batch = require('../models/Batch');
    const Section = require('../models/Section');

    let targetInstId = institutionId;
    if (!targetInstId) {
      const defaultInst = await Institution.findOne();
      if (defaultInst) targetInstId = defaultInst._id;
    }

    // 1. Resolve Department (Selected or Custom Typed)
    let finalDeptId = departmentId || null;
    if (!finalDeptId && departmentCustom && departmentCustom.trim() !== '') {
      const cleanName = departmentCustom.trim();
      let existingDept = await Department.findOne({
        institutionId: targetInstId,
        name: { $regex: new RegExp(`^${cleanName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
      });
      if (!existingDept && targetInstId) {
        let code = cleanName.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 6) || 'DEPT';
        const codeExists = await Department.findOne({ institutionId: targetInstId, code });
        if (codeExists) {
          code = `${code}_${Date.now().toString().slice(-4)}`;
        }
        existingDept = await Department.create({
          institutionId: targetInstId,
          name: cleanName,
          code: code
        });
      }
      if (existingDept) finalDeptId = existingDept._id;
    }

    // 2. Resolve Academic Year (Selected or Custom Typed)
    let finalAcademicYearId = academicYearId || null;
    if (!finalAcademicYearId && academicYearCustom && academicYearCustom.trim() !== '') {
      const cleanYear = academicYearCustom.trim();
      let existingYear = await AcademicYear.findOne({
        institutionId: targetInstId,
        yearLabel: { $regex: new RegExp(`^${cleanYear.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
      });
      if (!existingYear && targetInstId) {
        existingYear = await AcademicYear.create({
          institutionId: targetInstId,
          yearLabel: cleanYear,
          displayName: cleanYear,
          isCurrent: true
        });
      }
      if (existingYear) finalAcademicYearId = existingYear._id;
    }

    // 3. Resolve Batch & Academic Batch Cohort (Selected or Custom Typed)
    let finalBatchId = batchId || null;
    let finalAcademicBatch = academicBatch ? academicBatch.trim() : (batchCustom ? batchCustom.trim() : '');

    if (!finalBatchId && (batchCustom || finalAcademicBatch)) {
      const batchName = (batchCustom && batchCustom.trim()) ? batchCustom.trim() : finalAcademicBatch;
      if (batchName && targetInstId) {
        let existingBatch = await Batch.findOne({
          institutionId: targetInstId,
          name: { $regex: new RegExp(`^${batchName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
        });
        if (!existingBatch) {
          if (!finalAcademicYearId) {
            let defaultYear = await AcademicYear.findOne({ institutionId: targetInstId });
            if (!defaultYear) {
              defaultYear = await AcademicYear.create({
                institutionId: targetInstId,
                yearLabel: '2026-2027',
                displayName: '2026-2027',
                isCurrent: true
              });
            }
            finalAcademicYearId = defaultYear._id;
          }

          existingBatch = await Batch.create({
            institutionId: targetInstId,
            departmentId: finalDeptId || null,
            academicYearId: finalAcademicYearId,
            name: batchName,
            cohortRange: finalAcademicBatch || batchName
          });
        }
        if (existingBatch) {
          finalBatchId = existingBatch._id;
          if (!finalAcademicBatch && existingBatch.cohortRange) {
            finalAcademicBatch = existingBatch.cohortRange;
          }
        }
      }
    } else if (finalBatchId && !finalAcademicBatch) {
      const selectedBatchObj = await Batch.findById(finalBatchId);
      if (selectedBatchObj) {
        finalAcademicBatch = selectedBatchObj.cohortRange || selectedBatchObj.name;
        if (!finalAcademicYearId && selectedBatchObj.academicYearId) {
          finalAcademicYearId = selectedBatchObj.academicYearId;
        }
      }
    }

    // 4. Resolve Section (Selected or Custom Typed)
    let finalSectionId = sectionId || null;
    if (!finalSectionId && sectionCustom && sectionCustom.trim() !== '') {
      const cleanSec = sectionCustom.trim();
      let existingSection = await Section.findOne({
        institutionId: targetInstId,
        name: { $regex: new RegExp(`^${cleanSec.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
      });
      if (!existingSection && targetInstId) {
        existingSection = await Section.create({
          institutionId: targetInstId,
          batchId: finalBatchId || null,
          name: cleanSec
        });
      }
      if (existingSection) finalSectionId = existingSection._id;
    }

    const reqSemester = req.body.semester ? Number(req.body.semester) : 1;
    const reqYearLevel = req.body.semester ? Math.ceil(reqSemester / 2) : (req.body.yearLevel ? Number(req.body.yearLevel) : 1);

    const reqStatus = req.body.academicStatus || 'Pursuing';
    let reqCohorts = [];
    if (Array.isArray(req.body.academicCohorts)) {
      reqCohorts = req.body.academicCohorts.map(c => String(c).trim()).filter(Boolean);
    } else if (req.body.cohortCustom && String(req.body.cohortCustom).trim()) {
      reqCohorts = String(req.body.cohortCustom).split(',').map(c => c.trim()).filter(Boolean);
    }

    const newUser = await User.create({
      name: name ? name.trim() : '',
      email: normalizedEmail,
      passwordHash,
      role: 'student',
      roleLevel: 1,
      institutionId: targetInstId || null,
      departmentId: finalDeptId || null,
      academicYearId: finalAcademicYearId || null,
      batchId: finalBatchId || null,
      sectionId: finalSectionId || null,
      academicBatch: finalAcademicBatch || '',
      academicStatus: reqStatus,
      academicCohorts: reqCohorts,
      semester: reqSemester,
      yearLevel: reqYearLevel,
      registerNumber: registerNumber || '',
      studentId: studentId || '',
      leetcodeUsername: verifiedLeetcodeUsername,
      avatar: leetCodeVerification.profile?.userAvatar || '',
      isApproved: true,
      approvalStatus: 'approved'
    });

    const { token } = generateTokens(newUser);

    await Session.create({
      userId: newUser._id,
      token,
      device: req.headers['user-agent'] || 'Browser'
    });

    await AuditLog.create({
      actorId: newUser._id,
      actorEmail: newUser.email,
      action: 'USER_REGISTERED'
    });

    // Automatically trigger initial LeetCode stats sync in background
    syncUserLeetCode(newUser).catch(err => console.error('[Initial Sync Error]', err.message));

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        roleLevel: newUser.roleLevel,
        institutionId: newUser.institutionId,
        departmentId: newUser.departmentId,
        academicYearId: newUser.academicYearId,
        batchId: newUser.batchId,
        sectionId: newUser.sectionId,
        academicBatch: newUser.academicBatch,
        academicStatus: newUser.academicStatus,
        academicCohorts: newUser.academicCohorts,
        semester: newUser.semester,
        yearLevel: newUser.yearLevel,
        leetcodeUsername: newUser.leetcodeUsername,
        avatar: newUser.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const registerInstitution = async (req, res) => {
  try {
    const { institutionName, code, adminName, adminEmail, password, website, city, phone } = req.body;

    if (!institutionName || !adminEmail || !password) {
      return res.status(400).json({ success: false, message: 'Institution Name, Admin Email, and Password are required.' });
    }

    const normalizedEmail = adminEmail.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Admin email is already registered.' });
    }

    const Institution = require('../models/Institution');
    const slug = institutionName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const instCode = code ? code.toUpperCase().trim() : institutionName.substring(0, 4).toUpperCase();

    const institution = await Institution.create({
      name: institutionName.trim(),
      slug,
      code: instCode,
      contactEmail: normalizedEmail,
      website: website || '',
      city: city || ''
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const adminUser = await User.create({
      name: adminName ? adminName.trim() : 'Institution Administrator',
      email: normalizedEmail,
      passwordHash,
      role: 'institution_admin',
      roleLevel: 5,
      institutionId: institution._id,
      phone: phone || ''
    });

    const { token } = generateTokens(adminUser);

    await Session.create({
      userId: adminUser._id,
      token,
      device: req.headers['user-agent'] || 'Browser'
    });

    await AuditLog.create({
      actorId: adminUser._id,
      actorEmail: adminUser.email,
      action: 'INSTITUTION_REGISTERED',
      metadata: { institutionId: institution._id }
    });

    res.status(201).json({
      success: true,
      message: 'Institution and Administrator account registered successfully',
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        roleLevel: adminUser.roleLevel,
        institutionId: institution
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const registerStaff = async (req, res) => {
  try {
    const { name, email, password, targetRole, institutionId, departmentId, sectionId, staffPasscode, designation, staffId } = req.body;

    if (!name || !email || !password || !targetRole || !institutionId) {
      return res.status(400).json({ success: false, message: 'Name, Email, Password, Target Role, and Institution are required.' });
    }

    const Institution = require('../models/Institution');
    const Department = require('../models/Department');
    const Section = require('../models/Section');

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    // When faculty or HOD register, account must be stored in DB with pending approval
    const isApproved = false;
    const approvalStatus = 'pending';

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    const roleMap = { hod: 4, faculty: 3 };
    const roleLevel = roleMap[targetRole] || 3;
    const finalRole = targetRole === 'hod' ? 'hod' : 'faculty';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const staffUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: finalRole,
      roleLevel,
      institutionId: institution._id,
      departmentId: departmentId || null,
      sectionId: sectionId || null,
      designation: designation || (finalRole === 'hod' ? 'Head of Department' : 'Faculty Mentor'),
      studentId: staffId || '',
      isApproved: false,
      approvalStatus: 'pending'
    });

    await AuditLog.create({
      actorId: staffUser._id,
      actorEmail: staffUser.email,
      action: 'STAFF_REGISTERED',
      metadata: { role: finalRole, departmentId, isApproved: false }
    });

    // Send email notification with applicant profile of approval to the appropriate HOD or Admin
    const { sendPendingApprovalNotificationEmail } = require('../services/emailService');
    let targetRecipientEmail = null;
    let targetRecipientRole = 'Institution Administrator';
    let deptName = '';

    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (dept) deptName = `${dept.name} (${dept.code || ''})`;
    }

    if (finalRole === 'faculty') {
      // Faculty Registration -> Send to appropriate Head of Department (HOD)
      let hodUser = null;
      if (departmentId) {
        const deptObj = await Department.findById(departmentId).populate('hodId');
        if (deptObj && deptObj.hodId && deptObj.hodId.email) {
          hodUser = deptObj.hodId;
        } else {
          hodUser = await User.findOne({ 
            institutionId: institution._id, 
            departmentId: departmentId, 
            role: 'hod',
            isActive: true 
          });
        }
      }

      if (hodUser && hodUser.email) {
        targetRecipientEmail = hodUser.email;
        targetRecipientRole = `Head of Department (${deptName || 'Department'})`;
      } else {
        // Fallback to Institutional Admin if department has no assigned HOD yet
        const instAdmin = await User.findOne({ institutionId: institution._id, role: 'institution_admin' });
        if (instAdmin && instAdmin.email) {
          targetRecipientEmail = instAdmin.email;
          targetRecipientRole = `Institutional Administrator (${institution.name})`;
        } else if (institution.contactEmail) {
          targetRecipientEmail = institution.contactEmail;
          targetRecipientRole = `Institution Management (${institution.name})`;
        }
      }
    } else {
      // HOD Registration -> Send request to Institutional Administrator
      const instAdmin = await User.findOne({ institutionId: institution._id, role: 'institution_admin' });
      if (instAdmin && instAdmin.email) {
        targetRecipientEmail = instAdmin.email;
        targetRecipientRole = `Institutional Administrator (${institution.name})`;
      } else if (institution.contactEmail) {
        targetRecipientEmail = institution.contactEmail;
        targetRecipientRole = `Institution Management (${institution.name})`;
      }
    }

    // Platform SuperAdmin / System Admin email
    const superAdmin = await User.findOne({ role: { $in: ['superadmin', 'devadmin'] } });
    const superAdminEmail = superAdmin?.email || process.env.SMTP_USER || 'austinjustin4809@gmail.com';

    // Compile recipient list: target approver (HOD / InstAdmin) + Platform SuperAdmin
    const recipients = [];
    if (targetRecipientEmail) {
      recipients.push(targetRecipientEmail);
    }
    if (superAdminEmail && !recipients.includes(superAdminEmail)) {
      recipients.push(superAdminEmail);
    }

    if (recipients.length > 0) {
      console.log(`[Staff Register] Dispatching approval request email to [${recipients.join(', ')}] (${targetRecipientRole}) for applicant ${staffUser.email}`);
      sendPendingApprovalNotificationEmail({
        toEmail: recipients,
        approverRole: targetRecipientRole,
        applicantName: staffUser.name,
        applicantEmail: staffUser.email,
        applicantRole: finalRole,
        departmentName: deptName,
        institutionName: institution.name,
        designation: staffUser.designation,
        staffId: staffUser.studentId,
        registeredAt: staffUser.createdAt
      }).catch(err => console.error('[Staff Register] Failed to send pending approval email:', err));
    } else {
      console.warn(`[Staff Register] No approver email found for applicant ${staffUser.email} (Institution: ${institution.name})`);
    }

    res.status(201).json({
      success: true,
      message: `${finalRole === 'hod' ? 'Head of Department (HOD)' : 'Faculty'} registration submitted. Account is pending approval by your ${finalRole === 'hod' ? 'Institution Administrator' : 'Head of Department'}.`,
      isApproved: false,
      token: null,
      user: {
        id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        role: staffUser.role,
        roleLevel: staffUser.roleLevel,
        institutionId: staffUser.institutionId,
        departmentId: staffUser.departmentId,
        sectionId: staffUser.sectionId,
        isApproved: false,
        approvalStatus: 'pending'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    let user = await User.findOne({ email: normalizedEmail })
      .populate('institutionId', 'name code logoUrl primaryColor')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name')
      .populate('academicYearId', 'yearLabel displayName');

    if (!user && normalizedEmail) {
      user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') } })
        .populate('institutionId', 'name code logoUrl primaryColor')
        .populate('departmentId', 'name code')
        .populate('batchId', 'name')
        .populate('sectionId', 'name')
        .populate('academicYearId', 'yearLabel displayName');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    // Role-specific approval checks:
    // Students never require approval (always authorized to login immediately).
    // Only Faculty (Level 3) and HOD (Level 4) require approval.
    const isApprovalRequiredRole = user.role === 'faculty' || user.role === 'hod' || (user.roleLevel >= 3 && user.roleLevel <= 4);

    if (!isApprovalRequiredRole && (user.isApproved === false || user.approvalStatus !== 'approved')) {
      // Auto-heal any student account to approved
      user.isApproved = true;
      user.approvalStatus = 'approved';
      await user.save();
    }

    if (isApprovalRequiredRole && (user.isApproved === false || user.approvalStatus === 'pending')) {
      const approverTitle = user.role === 'hod' 
        ? 'Institution Administrator' 
        : 'Head of Department (HOD) or Institution Admin';
      return res.status(403).json({ 
        success: false, 
        isPendingApproval: true,
        message: `Account registration is pending approval by your ${approverTitle}. You will be able to log in once your account has been approved.` 
      });
    }

    if (isApprovalRequiredRole && user.approvalStatus === 'rejected') {
      return res.status(403).json({ 
        success: false, 
        isRejected: true,
        message: 'Account registration has been declined. Please contact your Institution Administrator.' 
      });
    }

    user.lastActive = new Date();
    await user.save();

    const { token } = generateTokens(user);

    await Session.create({
      userId: user._id,
      token,
      device: req.headers['user-agent'] || 'Browser'
    });

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email,
      action: 'USER_LOGIN'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleLevel: user.roleLevel,
        institutionId: user.institutionId,
        departmentId: user.departmentId,
        batchId: user.batchId,
        sectionId: user.sectionId,
        academicYearId: user.academicYearId,
        studentId: user.studentId,
        registerNumber: user.registerNumber,
        semester: user.semester,
        yearLevel: user.yearLevel,
        academicBatch: user.academicBatch,
        academicStatus: user.academicStatus || 'Pursuing',
        academicCohorts: user.academicCohorts || [],
        phone: user.phone,
        designation: user.designation,
        specialization: user.specialization,
        officeLocation: user.officeLocation,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        website: user.website,
        leetcodeUsername: user.leetcodeUsername,
        avatar: user.avatar,
        bio: user.bio,
        mfaEnabled: user.mfaEnabled,
        xp: user.xp,
        level: user.level
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.user; // Set by auth middleware
    const populatedUser = await User.findById(user._id)
      .populate('institutionId', 'name code logoUrl primaryColor')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name')
      .populate('academicYearId', 'yearLabel displayName');

    res.json({
      success: true,
      isImpersonating: req.isImpersonating || false,
      realUser: req.realUser ? {
        id: req.realUser._id,
        name: req.realUser.name,
        email: req.realUser.email,
        role: req.realUser.role,
        roleLevel: req.realUser.roleLevel
      } : null,
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        roleLevel: populatedUser.roleLevel,
        institutionId: populatedUser.institutionId,
        departmentId: populatedUser.departmentId,
        batchId: populatedUser.batchId,
        sectionId: populatedUser.sectionId,
        academicYearId: populatedUser.academicYearId,
        studentId: populatedUser.studentId,
        registerNumber: populatedUser.registerNumber,
        semester: populatedUser.semester,
        yearLevel: populatedUser.yearLevel,
        academicBatch: populatedUser.academicBatch,
        academicStatus: populatedUser.academicStatus || 'Pursuing',
        academicCohorts: populatedUser.academicCohorts || [],
        phone: populatedUser.phone,
        designation: populatedUser.designation,
        specialization: populatedUser.specialization,
        officeLocation: populatedUser.officeLocation,
        githubUrl: populatedUser.githubUrl,
        linkedinUrl: populatedUser.linkedinUrl,
        website: populatedUser.website,
        leetcodeUsername: populatedUser.leetcodeUsername,
        avatar: populatedUser.avatar,
        bio: populatedUser.bio,
        mfaEnabled: populatedUser.mfaEnabled,
        xp: populatedUser.xp,
        level: populatedUser.level,
        lastSyncAt: populatedUser.lastSyncAt,
        syncStatus: populatedUser.syncStatus
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const Session = require('../models/Session');
    const sessions = await Session.find({ userId: req.user._id, isRevoked: false }).sort({ updatedAt: -1 });
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const revokeSession = async (req, res) => {
  try {
    const Session = require('../models/Session');
    await Session.findByIdAndUpdate(req.params.id, { isRevoked: true });
    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const crypto = require('crypto');

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address or username is required' });
    }

    const normalizedInput = email.toLowerCase().trim();
    const escapedInput = normalizedInput.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    let user = await User.findOne({
      $or: [
        { email: normalizedInput },
        { email: { $regex: new RegExp(`^${escapedInput}$`, 'i') } },
        { leetcodeUsername: { $regex: new RegExp(`^${escapedInput}$`, 'i') } }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email or username' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support or administrator.' });
    }

    // Generate 6-digit random passcode
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedToken = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    console.log(`\n======================================================`);
    console.log(`🔑 PASSWORD RESET VERIFICATION CODE GENERATED`);
    console.log(`------------------------------------------------------`);
    console.log(`Recipient Email:   ${user.email}`);
    console.log(`6-Digit Passcode:  ${resetCode}`);
    console.log(`Expires In:        15 Minutes`);
    console.log(`======================================================\n`);

    const { sendResetPasscodeEmail } = require('../services/emailService');
    await sendResetPasscodeEmail(user.email, resetCode);

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email,
      action: 'USER_PASSWORD_RESET_REQUESTED'
    });

    res.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email address.',
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const resetPassword = async (req, res) => {
  try {
    const tokenOrCode = req.params.token || req.body.code || req.body.token;
    const { email, newPassword } = req.body;

    if (!tokenOrCode) {
      return res.status(400).json({ success: false, message: '6-digit verification code is required' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const cleanTokenOrCode = tokenOrCode.toString().replace(/\s+/g, '');
    const hashedToken = crypto.createHash('sha256').update(cleanTokenOrCode).digest('hex');

    let filter = {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    };

    if (email) {
      const normalizedInput = email.toLowerCase().trim();
      const escapedInput = normalizedInput.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      filter.$or = [
        { email: normalizedInput },
        { email: { $regex: new RegExp(`^${escapedInput}$`, 'i') } },
        { leetcodeUsername: { $regex: new RegExp(`^${escapedInput}$`, 'i') } }
      ];
    }

    let user = await User.findOne(filter);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired 6-digit verification code' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Cannot reset password.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    // Revoke all existing sessions for security
    await Session.updateMany({ userId: user._id }, { isRevoked: true });

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email,
      action: 'USER_PASSWORD_RESET_SUCCESS'
    });

    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, verifyLeetCode, getRegistrationOptions, registerInstitution, registerStaff, login, getMe, getSessions, revokeSession, forgotPassword, resetPassword };
