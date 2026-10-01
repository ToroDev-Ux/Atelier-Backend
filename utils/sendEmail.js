const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
})

const sendOtpEmail = async (email, code) => {
  await transporter.sendMail({
    from: `"Atelier Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Atelier verification code',
    html: `<h3>Your verification code is: ${code}</h3><p>This code expires in 10 minutes.</p>`,
  })
}

const sendConfirmationEmail = async (subscriber) => {
  await transporter.sendMail({
    from: `"Atelier Studio" <${process.env.EMAIL_USER}>`,
    to: subscriber.email,
    subject: 'Thanks for reaching out to Atelier',
    html: `<p>Hi ${subscriber.name},</p><p>Thank you for subscribing to Atelier. We've received your message and will be in touch soon.</p>`,
  })
}

const sendNewMessageNotification = async (subscriber) => {
  const Admin = require('../models/Admin')
  const admins = await Admin.find()
  const adminEmails = admins.map((a) => a.email)

  await transporter.sendMail({
    from: `"Atelier Studio" <${process.env.EMAIL_USER}>`,
    to: adminEmails,
    subject: `New message from ${subscriber.name}`,
    html: `<p><strong>Name:</strong> ${subscriber.name}</p><p><strong>Email:</strong> ${subscriber.email}</p><p><strong>Message:</strong> ${subscriber.message}</p>`,
  })
}

const sendPasswordResetConfirmation = async (email) => {
  await transporter.sendMail({
    from: `"Atelier Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your password has been reset',
    html: `<p>Your Atelier admin password has been reset successfully. You can now log in with your new password.</p>`,
  })
}

const sendPinResetConfirmation = async (email) => {
  await transporter.sendMail({
    from: `"Atelier Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your PIN has been reset',
    html: `<p>Your Atelier admin PIN has been reset successfully. You can now log in with your new PIN.</p>`,
  })
}
const sendReplyEmail = async (email, name, replyMessage) => {
  await transporter.sendMail({
    from: `"Atelier Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'A reply from Atelier Studio',
    html: `<p>Hi ${name},</p><p>${replyMessage}</p><p>— Atelier Studio</p>`,
  })
}

module.exports = { sendOtpEmail, sendConfirmationEmail, sendNewMessageNotification, sendPasswordResetConfirmation, sendPinResetConfirmation, sendReplyEmail }

