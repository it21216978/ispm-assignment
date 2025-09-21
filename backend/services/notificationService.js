const nodemailer = require('nodemailer');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Create transporter
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify transporter
  transporter.verify((error, success) => {
    if (error) {
      console.log('Email transporter error:', error);
    } else {
      console.log('Email server is ready to take our messages');
    }
  });
} else {
  console.log('Email credentials not configured, email notifications disabled.');
}

// Send invitation email
async function sendInvitationEmail(email, token, companyName, departmentName) {
  if (!transporter) {
    console.log('Email not sent: credentials not configured');
    return false;
  }
  const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboard?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Invitation to join ${companyName}`,
    html: `
      <h2>You've been invited to join ${companyName}</h2>
      <p>You have been invited to join the ${departmentName} department at ${companyName}.</p>
      <p>Please click the link below to complete your registration:</p>
      <a href="${invitationUrl}">Accept Invitation</a>
      <p>This invitation will expire in 7 days.</p>
      <p>If you did not expect this invitation, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent to ${email}`);

    // Store notification record
    await prisma.notification.create({
      data: {
        userId: null, // No user yet
        message: `Invitation sent to ${email} for ${companyName} - ${departmentName}`,
      },
    });

    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
}

// Send assessment reminder
async function sendAssessmentReminder(userEmail, assessmentTitle, scheduledAt) {
  if (!transporter) {
    console.log('Email not sent: credentials not configured');
    return false;
  }
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: `Assessment Reminder: ${assessmentTitle}`,
    html: `
      <h2>Assessment Reminder</h2>
      <p>You have an upcoming assessment: <strong>${assessmentTitle}</strong></p>
      <p>Scheduled for: ${new Date(scheduledAt).toLocaleString()}</p>
      <p>Please log in to your account to complete the assessment before the due date.</p>
      <p>If you have any questions, please contact your administrator.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Assessment reminder sent to ${userEmail}`);

    // Find user and store notification
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          message: `Assessment reminder sent for: ${assessmentTitle}`,
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Error sending assessment reminder:', error);
    return false;
  }
}

// Send policy update notification
async function sendPolicyUpdateNotification(userEmail, policyTitle, departmentName) {
  if (!transporter) {
    console.log('Email not sent: credentials not configured');
    return false;
  }
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: `Policy Update: ${policyTitle}`,
    html: `
      <h2>Policy Update</h2>
      <p>A new policy has been added to your department (${departmentName}):</p>
      <p><strong>${policyTitle}</strong></p>
      <p>Please log in to your account to review the updated policy.</p>
      <p>Ensuring compliance with company policies is important for all employees.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Policy update notification sent to ${userEmail}`);

    // Find user and store notification
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          message: `Policy update notification sent for: ${policyTitle}`,
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Error sending policy update notification:', error);
    return false;
  }
}

module.exports = {
  sendInvitationEmail,
  sendAssessmentReminder,
  sendPolicyUpdateNotification,
};