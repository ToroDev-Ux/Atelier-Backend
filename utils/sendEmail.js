// utils/sendEmail.js
// Sends email through Brevo's HTTPS API instead of SMTP,
// because Render's free tier blocks SMTP ports (25, 465, 587).

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'

// Escapes user-submitted text so it can't inject HTML into the email
const escapeHtml = (text = '') =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// The one shared function that actually sends the email
const sendMail = async ({ to, subject, html }) => {
  const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({ email }))

  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Atelier Studio', email: process.env.EMAIL_FROM },
      to: recipients,
      subject,
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Email failed (${response.status}): ${detail}`)
  }
}

const sendOtpEmail = async (email, code) => {
  await sendMail({
    to: email,
    subject: 'Your Atelier verification code',
    html: `<h3>Your verification code is: ${code}</h3><p>This code expires in 10 minutes.</p>`,
  })
}

const sendConfirmationEmail = async (subscriber) => {
  await sendMail({
    to: subscriber.email,
    subject: 'Thanks for reaching out to Atelier',
    html: `<p>Hi ${escapeHtml(subscriber.name)},</p><p>Thank you for subscribing to Atelier. We've received your message and will be in touch soon.</p>`,
  })
}

const sendNewMessageNotification = async (subscriber) => {
  const Admin = require('../models/Admin')
  const admins = await Admin.find()
  const adminEmails = admins.map((a) => a.email)

  // Nothing to send if there are no admins yet
  if (adminEmails.length === 0) return

  await sendMail({
    to: adminEmails,
    subject: `New message from ${escapeHtml(subscriber.name)}`,
    html: `<p><strong>Name:</strong> ${escapeHtml(subscriber.name)}</p><p><strong>Email:</strong> ${escapeHtml(subscriber.email)}</p><p><strong>Message:</strong> ${escapeHtml(subscriber.message)}</p>`,
  })
}

const sendPasswordResetConfirmation = async (email) => {
  await sendMail({
    to: email,
    subject: 'Your password has been reset',
    html: `<p>Your Atelier admin password has been reset successfully. You can now log in with your new password.</p>`,
  })
}

const sendPinResetConfirmation = async (email) => {
  await sendMail({
    to: email,
    subject: 'Your PIN has been reset',
    html: `<p>Your Atelier admin PIN has been reset successfully. You can now log in with your new PIN.</p>`,
  })
}

const sendReplyEmail = async (email, name, replyMessage) => {
  await sendMail({
    to: email,
    subject: 'A reply from Atelier Studio',
    html: `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(replyMessage)}</p><p>— Atelier Studio</p>`,
  })
}

module.exports = {
  sendOtpEmail,
  sendConfirmationEmail,
  sendNewMessageNotification,
  sendPasswordResetConfirmation,
  sendPinResetConfirmation,
  sendReplyEmail,
}