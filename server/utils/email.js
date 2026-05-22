import nodemailer from 'nodemailer'
import User from '../models/usermodel.js'

const smtpHost = process.env.SMTP_HOST
const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpSecure = process.env.SMTP_SECURE === 'true'
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const senderAddress = process.env.EMAIL_FROM || `InterviewIQ <${smtpUser || 'no-reply@interviewiq.local'}>`

let transporter

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })
} else {
  console.warn('SMTP configuration is missing. Announcement emails will not be sent.')
}

export async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    throw new Error('SMTP transport is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.')
  }

  return transporter.sendMail({
    from: senderAddress,
    to,
    subject,
    text,
    html,
  })
}

export async function sendAnnouncementEmails({ title, message, senderName }) {
  if (!transporter) {
    console.warn('Skipping announcement emails because SMTP is not configured.')
    return
  }

  const users = await User.find({ email: { $exists: true, $ne: '' } }).select('name email').lean()
  if (!users.length) {
    return
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://interviewiq.local'
  const subject = `InterviewIQ announcement: ${title}`
  const htmlBody = `
    <p>Hello,</p>
    <p>${message}</p>
    <p>Visit your dashboard to see the latest updates: <a href="${frontendUrl}">${frontendUrl}</a></p>
    <p>– ${senderName || 'InterviewIQ Team'}</p>
  `
  const textBody = `Hello,\n\n${message}\n\nVisit your dashboard to see the latest updates: ${frontendUrl}\n\n– ${senderName || 'InterviewIQ Team'}`

  const sendPromises = users.map((user) =>
    sendEmail({
      to: user.email,
      subject,
      text: textBody.replace('Hello,', `Hello ${user.name || ''},`).replace(/Hello ,/, 'Hello,'),
      html: htmlBody.replace('Hello,', `Hello ${user.name || ''},`).replace(/Hello ,/, 'Hello,'),
    }).catch((error) => ({ error, email: user.email }))
  )

  const results = await Promise.all(sendPromises)
  const failures = results.filter((result) => result && result.error)
  if (failures.length) {
    console.error('Announcement email send failures:', failures.map((failure) => ({ email: failure.email, error: failure.error.message || failure.error })))
  }
}
