const Institution = require('../models/Institution');
const Department = require('../models/Department');
const AcademicYear = require('../models/AcademicYear');
const Batch = require('../models/Batch');
const Section = require('../models/Section');
const User = require('../models/User');

// --- INSTITUTION MANAGEMENT ---
exports.getAllInstitutions = async (req, res) => {
  try {
    const filter = req.user.roleLevel === 5 ? {} : { _id: req.user.institutionId };
    const institutions = await Institution.find(filter).sort({ name: 1 });
    res.json({ success: true, count: institutions.length, data: institutions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInstitutionById = async (req, res) => {
  try {
    const instId = req.params.id || req.user.institutionId;
    if (req.user.roleLevel < 5 && instId.toString() !== req.user.institutionId?.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access to specified institution denied' });
    }
    const institution = await Institution.findById(instId);
    if (!institution) return res.status(404).json({ success: false, message: 'Institution not found' });
    res.json({ success: true, data: institution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createInstitution = async (req, res) => {
  try {
    if (req.user.roleLevel < 5) {
      return res.status(403).json({ success: false, message: 'Only SuperAdmin can create institutions' });
    }
    const { name, slug, code, plan, maxUsers, primaryColor, companyName } = req.body;
    const institution = await Institution.create({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      code: code || name.substring(0, 4).toUpperCase(),
      plan,
      maxUsers,
      primaryColor,
      companyName
    });
    res.status(201).json({ success: true, data: institution });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateInstitution = async (req, res) => {
  try {
    const instId = req.params.id;
    if (req.user.roleLevel < 5 && instId.toString() !== req.user.institutionId?.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const institution = await Institution.findByIdAndUpdate(instId, req.body, { new: true });
    res.json({ success: true, data: institution });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// --- DEPARTMENT MANAGEMENT ---
exports.getDepartments = async (req, res) => {
  try {
    const instId = req.query.institutionId || req.user.institutionId;
    const departments = await Department.find({ institutionId: instId }).populate('hodId', 'name email avatar').sort({ name: 1 });
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const instId = req.body.institutionId || req.user.institutionId;
    const { name, code, hodId } = req.body;
    const department = await Department.create({
      institutionId: instId,
      name,
      code: code.toUpperCase(),
      hodId: hodId || null
    });
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndUpdate(id, req.body, { new: true });
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: department });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    await Department.findByIdAndDelete(id);
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- ACADEMIC YEAR MANAGEMENT ---
exports.getAcademicYears = async (req, res) => {
  try {
    const instId = req.query.institutionId || req.user.institutionId;
    const years = await AcademicYear.find({ institutionId: instId }).sort({ yearLabel: -1 });
    res.json({ success: true, count: years.length, data: years });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAcademicYear = async (req, res) => {
  try {
    const instId = req.body.institutionId || req.user.institutionId;
    const { yearLabel, displayName, yearLevel, startDate, endDate, isCurrent } = req.body;
    if (isCurrent) {
      await AcademicYear.updateMany({ institutionId: instId }, { isCurrent: false });
    }
    const academicYear = await AcademicYear.create({
      institutionId: instId,
      yearLabel,
      displayName: displayName || yearLabel,
      yearLevel: yearLevel ? Number(yearLevel) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      isCurrent: isCurrent !== undefined ? isCurrent : true
    });
    res.status(201).json({ success: true, data: academicYear });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const year = await AcademicYear.findByIdAndUpdate(id, req.body, { new: true });
    if (!year) return res.status(404).json({ success: false, message: 'Academic Year not found' });
    res.json({ success: true, data: year });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    await AcademicYear.findByIdAndDelete(id);
    res.json({ success: true, message: 'Academic Year deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- BATCH MANAGEMENT ---
exports.getBatches = async (req, res) => {
  try {
    const instId = req.query.institutionId || req.user.institutionId;
    const filter = { institutionId: instId };
    if (req.query.departmentId) {
      filter.$or = [
        { departmentId: req.query.departmentId },
        { departmentIds: req.query.departmentId },
        { isCombined: true },
        { departmentId: null }
      ];
    }
    if (req.query.academicYearId) filter.academicYearId = req.query.academicYearId;
    if (req.query.targetYearLevel) filter.targetYearLevel = Number(req.query.targetYearLevel);

    const batches = await Batch.find(filter)
      .populate('departmentId', 'name code')
      .populate('departmentIds', 'name code')
      .populate('academicYearId', 'yearLabel')
      .sort({ name: 1 });
    res.json({ success: true, count: batches.length, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createBatch = async (req, res) => {
  try {
    const instId = req.body.institutionId || req.user.institutionId;
    const { departmentId, departmentIds, academicYearId, targetYearLevel, name, targetDailySolved, targetWeeklySolved, isCombined } = req.body;
    
    const isCombinedBatch = isCombined || !departmentId || departmentId === 'combined' || (departmentIds && departmentIds.length > 1);
    const finalDeptId = (departmentId === 'combined' || !departmentId) ? null : departmentId;

    const batch = await Batch.create({
      institutionId: instId,
      departmentId: finalDeptId,
      departmentIds: Array.isArray(departmentIds) ? departmentIds : (finalDeptId ? [finalDeptId] : []),
      isCombined: isCombinedBatch,
      academicYearId,
      targetYearLevel: targetYearLevel ? Number(targetYearLevel) : null,
      name,
      targetDailySolved: targetDailySolved || 2,
      targetWeeklySolved: targetWeeklySolved || 10
    });

    const populatedBatch = await Batch.findById(batch._id)
      .populate('departmentId', 'name code')
      .populate('departmentIds', 'name code')
      .populate('academicYearId', 'yearLabel');

    res.status(201).json({ success: true, data: populatedBatch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.departmentId === 'combined') {
      updateData.departmentId = null;
      updateData.isCombined = true;
    }
    const batch = await Batch.findByIdAndUpdate(id, updateData, { new: true })
      .populate('departmentId', 'name code')
      .populate('departmentIds', 'name code')
      .populate('academicYearId', 'yearLabel');
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    await Batch.findByIdAndDelete(id);
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- SECTION MANAGEMENT ---
exports.getSections = async (req, res) => {
  try {
    const instId = req.query.institutionId || req.user.institutionId;
    const filter = { institutionId: instId };
    if (req.query.batchId) filter.batchId = req.query.batchId;

    const sections = await Section.find(filter)
      .populate('batchId', 'name')
      .populate('facultyId', 'name email avatar')
      .sort({ name: 1 });
    res.json({ success: true, count: sections.length, data: sections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSection = async (req, res) => {
  try {
    const instId = req.body.institutionId || req.user.institutionId;
    const { batchId, name, facultyId } = req.body;
    const section = await Section.create({
      institutionId: instId,
      batchId,
      name,
      facultyId: facultyId || null
    });
    res.status(201).json({ success: true, data: section });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await Section.findByIdAndUpdate(id, req.body, { new: true });
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    res.json({ success: true, data: section });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    await Section.findByIdAndDelete(id);
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- APPROVAL WORKFLOW MANAGEMENT ---
exports.getPendingApprovals = async (req, res) => {
  try {
    const userLevel = req.user.roleLevel || 1;

    // Strict scope: ONLY Faculty (Level 3) and HOD (Level 4) require approval. Students never need approval.
    let filter = {
      role: { $in: ['faculty', 'hod'] },
      $or: [
        { approvalStatus: 'pending' },
        { isApproved: false, approvalStatus: { $ne: 'rejected' } }
      ]
    };

    if (userLevel >= 6) {
      // Level 6 SuperAdmin has global platform view across all institutions
      if (req.query.institutionId) {
        filter.institutionId = req.query.institutionId;
      }
    } else if (userLevel === 5) {
      // Level 5 Institutional Admin can approve HODs and Faculty within their institution
      filter.institutionId = req.user.institutionId;
      filter.roleLevel = { $lt: 5 };
    } else if (userLevel === 4) {
      // Level 4 HOD can approve Faculty within their department
      filter.institutionId = req.user.institutionId;
      if (req.user.departmentId) {
        filter.departmentId = req.user.departmentId;
      }
      filter.role = 'faculty';
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges to view pending approvals' });
    }

    // Optional role filter (only 'faculty' or 'hod' allowed)
    if (req.query.role && ['faculty', 'hod'].includes(req.query.role)) {
      filter.role = req.query.role;
    }

    const pendingUsers = await User.find(filter)
      .populate('institutionId', 'name code')
      .populate('departmentId', 'name code')
      .populate('sectionId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: pendingUsers.length, data: pendingUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userLevel = req.user.roleLevel || 1;

    // Role-level authority check
    if (userLevel < 5) {
      if (userLevel === 4) {
        // HOD can approve Faculty and Students in their department
        const sameDept = !targetUser.departmentId || !req.user.departmentId || targetUser.departmentId.toString() === req.user.departmentId.toString();
        if (targetUser.roleLevel >= 4 || !sameDept) {
          return res.status(403).json({ success: false, message: 'Forbidden: HOD can only approve Faculty and Students in their department' });
        }
      } else if (userLevel === 3) {
        if (targetUser.role !== 'student') {
          return res.status(403).json({ success: false, message: 'Forbidden: Staff can only approve Students' });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
      }
    } else if (userLevel === 5) {
      // Institutional admin must match institution
      if (targetUser.institutionId && req.user.institutionId && targetUser.institutionId.toString() !== req.user.institutionId.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot approve user from a different institution' });
      }
      if (targetUser.roleLevel >= 5) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges to approve this role level' });
      }
    }
    // Level 6 (SuperAdmin) has global approval rights

    targetUser.isApproved = true;
    targetUser.approvalStatus = 'approved';
    targetUser.approvedBy = req.user._id;
    targetUser.approvedAt = new Date();
    targetUser.isActive = true;
    await targetUser.save();

    // Link HOD to Department if role is HOD
    if (targetUser.role === 'hod' && targetUser.departmentId) {
      await Department.findByIdAndUpdate(targetUser.departmentId, { hodId: targetUser._id });
    }

    // Link Faculty to Section if role is Faculty
    if (targetUser.role === 'faculty' && targetUser.sectionId) {
      await Section.findByIdAndUpdate(targetUser.sectionId, { facultyId: targetUser._id });
    }

    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'USER_REGISTRATION_APPROVED',
      metadata: { targetUserId: targetUser._id, role: targetUser.role }
    });

    // Notify user via email
    try {
      const { sendAccountApprovedEmail } = require('../services/emailService');
      if (sendAccountApprovedEmail) {
        sendAccountApprovedEmail({
          toEmail: targetUser.email,
          name: targetUser.name,
          role: targetUser.role
        }).catch(err => console.error('[Approve User] Email notification failed:', err.message));
      }
    } catch (_) {}

    res.json({ 
      success: true, 
      message: `${targetUser.name}'s (${targetUser.role.toUpperCase()}) account has been approved successfully!`, 
      data: targetUser 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userLevel = req.user.roleLevel || 1;

    if (userLevel < 5) {
      if (userLevel === 4) {
        const sameDept = !targetUser.departmentId || !req.user.departmentId || targetUser.departmentId.toString() === req.user.departmentId.toString();
        if (targetUser.roleLevel >= 4 || !sameDept) {
          return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges to reject this user' });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges to reject this user' });
      }
    } else if (userLevel === 5) {
      if ((targetUser.institutionId && req.user.institutionId && targetUser.institutionId.toString() !== req.user.institutionId.toString()) || targetUser.roleLevel >= 5) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges to reject this user' });
      }
    }

    targetUser.isApproved = false;
    targetUser.approvalStatus = 'rejected';
    targetUser.isActive = false;
    await targetUser.save();

    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'USER_REGISTRATION_REJECTED',
      metadata: { targetUserId: targetUser._id, role: targetUser.role }
    });

    try {
      const { sendAccountRejectedEmail } = require('../services/emailService');
      if (sendAccountRejectedEmail) {
        sendAccountRejectedEmail({
          toEmail: targetUser.email,
          name: targetUser.name,
          role: targetUser.role
        }).catch(err => console.error('[Reject User] Email notification failed:', err.message));
      }
    } catch (_) {}

    res.json({ 
      success: true, 
      message: `${targetUser.name}'s registration has been rejected.`, 
      data: targetUser 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


