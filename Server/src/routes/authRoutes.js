const express = require('express');
const router = express.Router();
const { register, verifyLeetCode, getRegistrationOptions, registerInstitution, registerStaff, login, getMe, getSessions, revokeSession, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.get('/verify-leetcode', verifyLeetCode);
router.post('/verify-leetcode', verifyLeetCode);
router.get('/registration-options', getRegistrationOptions);
router.post('/register', register);
router.post('/register-institution', registerInstitution);
router.post('/register-staff', registerStaff);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
