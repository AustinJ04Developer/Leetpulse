const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS;

  if (!user || !rawPass) {
    return null;
  }

  // Google App Passwords often contain 4-character chunk spaces ('abcd efgh ijkl mnop') which break raw SMTP auth
  const pass = rawPass.replace(/\s+/g, '');
  const isGmail = (host && host.includes('gmail.com')) || (user && user.endsWith('@gmail.com'));

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

const getFromAddress = () => {
  const user = process.env.SMTP_USER;
  if (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('noreply@leetpulse.com')) {
    return process.env.EMAIL_FROM;
  }
  return user ? `"LEETPULSE Academic Platform" <${user}>` : '"LEETPULSE Academic Platform" <noreply@leetpulse.com>';
};

const sendResetPasscodeEmail = async (toEmail, code) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: getFromAddress(),
    to: toEmail,
    subject: '🔑 LEETPULSE - Password Reset Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 30px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 16px;">
          <h2 style="color: #6366f1; margin-top: 0;">LEETPULSE Password Reset</h2>
          <p style="color: #cbd5e1; font-size: 14px;">You requested a password reset for your account (<strong>${toEmail}</strong>).</p>
          <div style="margin: 24px 0; text-align: center; background-color: #0f172a; border: 1px solid #475569; padding: 16px; border-radius: 12px;">
            <span style="font-size: 12px; color: #94a3b8; display: block; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Your 6-Digit Verification Code</span>
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #818cf8; letter-spacing: 6px;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This verification code is valid for <strong>15 minutes</strong>. Do not share this code with anyone.</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;" />
          <p style="color: #64748b; font-size: 11px; text-align: center;">LEETPULSE Academic & Placement Platform</p>
        </div>
      </div>
    `
  };

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`⚠️ SMTP CREDENTIALS NOT SET IN Server/.env`);
    console.log(`------------------------------------------------------`);
    console.log(`Target Email: ${toEmail}`);
    console.log(`6-Digit Code: ${code}`);
    console.log(`To deliver real emails, add SMTP_USER & SMTP_PASS to Server/.env`);
    console.log(`======================================================\n`);
    return { sent: false, reason: 'SMTP credentials not configured in Server/.env' };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Password reset email sent to ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email Service] Failed to send email to ${toEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
};

const sendPendingApprovalNotificationEmail = async ({ 
  toEmail, 
  ccEmails,
  approverRole, 
  applicantName, 
  applicantEmail, 
  applicantRole, 
  departmentName, 
  institutionName,
  designation,
  staffId,
  registeredAt
}) => {
  const transporter = createTransporter();

  const isHod = applicantRole === 'hod';
  const roleTitle = isHod ? 'Head of Department (HOD - Level 4)' : 'Faculty Mentor (Level 3)';
  const formattedDate = registeredAt ? new Date(registeredAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString();
  const baseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

  const mailOptions = {
    from: getFromAddress(),
    to: Array.isArray(toEmail) ? toEmail.join(', ') : toEmail,
    ...(ccEmails ? { cc: Array.isArray(ccEmails) ? ccEmails.join(', ') : ccEmails } : {}),
    subject: `📩 Pending ${isHod ? 'HOD' : 'Faculty'} Approval Request: ${applicantName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 32px 16px;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; padding: 28px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <div style="border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
              LEETPULSE ACADEMIC PLATFORM
            </div>
            <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 12px 0 4px 0;">New Account Registration Awaiting Approval</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">Hello <strong>${approverRole}</strong>, a new educator account requires your review and authorization.</p>
          </div>

          <!-- Applicant Profile of Approval Card -->
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
            <div style="margin-bottom: 14px; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Applicant Profile Overview</span>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Applicant Name:</td>
                <td style="padding: 6px 0; color: #ffffff; font-weight: 700;">${applicantName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Email Address:</td>
                <td style="padding: 6px 0; color: #cbd5e1; font-family: monospace;">${applicantEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Requested Role:</td>
                <td style="padding: 6px 0;">
                  <span style="background-color: ${isHod ? 'rgba(168, 85, 247, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${isHod ? '#d8b4fe' : '#fcd34d'}; border: 1px solid ${isHod ? 'rgba(168, 85, 247, 0.4)' : 'rgba(245, 158, 11, 0.4)'}; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 11px;">
                    ${roleTitle}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Designation:</td>
                <td style="padding: 6px 0; color: #e2e8f0;">${designation || (isHod ? 'Head of Department' : 'Faculty Mentor')}</td>
              </tr>
              ${staffId ? `
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Staff / Emp ID:</td>
                <td style="padding: 6px 0; color: #e2e8f0; font-family: monospace;">${staffId}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Department:</td>
                <td style="padding: 6px 0; color: #a5b4fc; font-weight: 600;">${departmentName || 'General / Unassigned'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Institution:</td>
                <td style="padding: 6px 0; color: #cbd5e1;">${institutionName || 'LEETPULSE Platform'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Registered At:</td>
                <td style="padding: 6px 0; color: #64748b; font-size: 12px;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <!-- Explanation & Action -->
          <div style="margin-bottom: 24px;">
            <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
              During login, this account is restricted until approval is granted. You can review the complete profile and grant login authorization directly from your <strong>Dashboard Approvals Tab</strong> or your <strong>Profile Approvals Section</strong>.
            </p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${baseUrl}/institution/dashboard?tab=approvals" 
                 style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
                Review & Grant Approval →
              </a>
              <span style="display: block; margin-top: 8px;">
                <a href="${baseUrl}/profile?tab=approvals" style="color: #818cf8; font-size: 12px; text-decoration: underline;">
                  Or view in Profile Approvals
                </a>
              </span>
            </div>
          </div>

          <div style="border-top: 1px solid #1f2937; padding-top: 16px; text-align: center;">
            <p style="color: #64748b; font-size: 11px; margin: 0;">LEETPULSE Multi-Tenant Academic Governance System</p>
          </div>
        </div>
      </div>
    `
  };

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`📩 PENDING APPROVAL NOTIFICATION EMAIL GENERATED`);
    console.log(`------------------------------------------------------`);
    console.log(`To:             ${toEmail} (${approverRole})`);
    console.log(`Applicant:      ${applicantName} <${applicantEmail}>`);
    console.log(`Requested Role: ${applicantRole}`);
    console.log(`Designation:    ${designation || 'N/A'}`);
    console.log(`Department:     ${departmentName || 'N/A'}`);
    console.log(`Institution:    ${institutionName || 'LEETPULSE'}`);
    console.log(`======================================================\n`);
    return { sent: false, reason: 'SMTP credentials not configured in Server/.env' };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Pending approval notification email successfully delivered to ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email Service] Failed to send notification email to ${toEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
};

const sendAccountApprovedEmail = async ({ toEmail, name, role }) => {
  const transporter = createTransporter();
  const roleTitle = role === 'hod' ? 'Head of Department (HOD)' : role === 'faculty' ? 'Faculty Mentor' : 'User';

  const mailOptions = {
    from: getFromAddress(),
    to: toEmail,
    subject: '🎉 LEETPULSE - Account Approved! Access Granted',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 30px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 16px;">
          <h2 style="color: #10b981; margin-top: 0;">Account Approved!</h2>
          <p style="color: #cbd5e1; font-size: 14px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px;">Your registration request for role <strong>${roleTitle}</strong> has been approved by your administrator.</p>
          <div style="margin: 20px 0; background-color: #0f172a; border: 1px solid #10b981; padding: 16px; border-radius: 12px; text-align: center;">
            <p style="color: #34d399; font-weight: bold; margin: 0;">You can now log in to access your LEETPULSE dashboard.</p>
          </div>
          <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;" />
          <p style="color: #64748b; font-size: 11px; text-align: center;">LEETPULSE Academic Platform</p>
        </div>
      </div>
    `
  };

  if (!transporter) return { sent: false, reason: 'SMTP not configured' };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Approval confirmation email sent to ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email Service] Failed to send approval email to ${toEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
};

const sendAccountRejectedEmail = async ({ toEmail, name, role }) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: getFromAddress(),
    to: toEmail,
    subject: '⚠️ LEETPULSE - Account Registration Update',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 30px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 16px;">
          <h2 style="color: #f43f5e; margin-top: 0;">Registration Update</h2>
          <p style="color: #cbd5e1; font-size: 14px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px;">Your registration request on LEETPULSE has been declined by the administrator. Please contact your department coordinator for assistance.</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;" />
          <p style="color: #64748b; font-size: 11px; text-align: center;">LEETPULSE Academic Platform</p>
        </div>
      </div>
    `
  };

  if (!transporter) return { sent: false, reason: 'SMTP not configured' };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Rejection notification email sent to ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email Service] Failed to send rejection email to ${toEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
};

module.exports = {
  sendResetPasscodeEmail,
  sendPendingApprovalNotificationEmail,
  sendAccountApprovedEmail,
  sendAccountRejectedEmail
};
