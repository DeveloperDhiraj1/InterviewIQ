import nodemailer from 'nodemailer'
import User from '../models/usermodel.js'

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    console.warn('SMTP configuration is missing. Announcement emails will not be sent.');
  }

  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    throw new Error('SMTP transport is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
  }

  const senderAddress = process.env.EMAIL_FROM || `InterviewIQ <${process.env.SMTP_USER || 'no-reply@interviewiq.local'}>`;

  return mailTransporter.sendMail({
    from: senderAddress,
    to,
    subject,
    text,
    html,
  });
}

export async function sendAnnouncementEmails({ title, message, senderName }) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    console.warn('Skipping announcement emails because SMTP is not configured.');
    return { successCount: 0, failedCount: 0 };
  }

  const users = await User.find({ email: { $exists: true, $ne: '' } }).select('name email').lean();
  
  if (!users.length) {
    console.log('[Announcement] No registered users found.');
    return { successCount: 0, failedCount: 0 };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://interviewiq.local';
  const subject = `InterviewIQ announcement: ${title}`;
  const htmlBody = `
    <p>Hello,</p>
    <p>${message}</p>
    <p>Visit your dashboard to see the latest updates: <a href="${frontendUrl}">${frontendUrl}</a></p>
    <p>– ${senderName || 'InterviewIQ Team'}</p>
  `;
  const textBody = `Hello,\n\n${message}\n\nVisit your dashboard to see the latest updates: ${frontendUrl}\n\n– ${senderName || 'InterviewIQ Team'}`;

  let successCount = 0;
  let failedCount = 0;

  console.log(`[Announcement] Total registered users found: ${users.length}`);

  for (const user of users) {
    try {
      console.log(`[Announcement] Sending email to: ${user.email}`);
      await sendEmail({
        to: user.email,
        subject,
        text: textBody.replace('Hello,', `Hello ${user.name || ''},`).replace(/Hello ,/, 'Hello,'),
        html: htmlBody.replace('Hello,', `Hello ${user.name || ''},`).replace(/Hello ,/, 'Hello,'),
      });
      console.log(`[Announcement] Email sent successfully to: ${user.email}`);
      successCount++;
    } catch (error) {
      console.error(`[Announcement] Email failed for ${user.email} with complete error stack:`, error);
      failedCount++;
    }
  }

  console.log(`[Announcement] Total Success Count: ${successCount}`);
  console.log(`[Announcement] Total Failed Count: ${failedCount}`);

  return { successCount, failedCount };
}
