const bcrypt = require('bcrypt')
const Admin = require('../models/Admin')
const AllowedAdmin = require('../models/AllowedAdmin')
const Otp = require('../models/Otp')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const { sendOtpEmail, sendPasswordResetConfirmation } = require('../utils/sendEmail')
const { sendPinResetConfirmation } = require('../utils/sendEmail')


const checkOwnerExists = async (req, res) => {
  try {
    const owner = await Admin.findOne({ isOwner: true })
    res.status(200).json({ ownerExists: !!owner })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}


const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password -pin')
    res.status(200).json(admin)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}


const signupOwner = async (req, res) => {
  try {
    const existingOwner = await Admin.findOne({ isOwner: true })
    if (existingOwner) {
      return res.status(400).json({ message: 'An Owner account already exists' })
    }

    const { fullName, email, password, age, address, phone } = req.body
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' })
    }

    const verifiedOtp = await Otp.findOne({ email, purpose: 'signup', verified: true })
    if (!verifiedOtp) {
      return res.status(403).json({ message: 'Please verify your email first' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newOwner = await Admin.create({
      fullName, email, password: hashedPassword,
      role: 'Owner', age, address, phone, isOwner: true,
    })

    await Otp.deleteMany({ email, purpose: 'signup' })

    res.status(201).json({ message: 'Owner account created', email: newOwner.email })
  } catch (error) {
    res.status(400).json({ message: 'Signup failed', error: error.message })
  }
}


const signupAdmin = async (req, res) => {
  try {
    const { fullName, email, password, age, address, phone, role } = req.body

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' })
    }

    const isWhitelisted = await AllowedAdmin.findOne({ email })
    if (!isWhitelisted) {
      return res.status(403).json({ message: 'This email is not authorized to sign up' })
    }

    const verifiedOtp = await Otp.findOne({ email, purpose: 'signup', verified: true })
    if (!verifiedOtp) {
      return res.status(403).json({ message: 'Please verify your email first' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newAdmin = await Admin.create({
      fullName, email, password: hashedPassword,
      role, age, address, phone, isOwner: false,
    })

    await Otp.deleteMany({ email, purpose: 'signup' })

    res.status(201).json({ message: 'Admin account created', email: newAdmin.email })
  } catch (error) {
    res.status(400).json({ message: 'Signup failed', error: error.message })
  }
}


const setupPin = async (req, res) => {
  try {
    const { email, pin } = req.body

    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(404).json({ message: 'Account not found' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPin = await bcrypt.hash(pin, salt)

    admin.pin = hashedPin
    admin.pinSet = true
    await admin.save()

    res.status(200).json({ message: 'PIN set successfully' })
  } catch (error) {
    res.status(400).json({ message: 'Failed to set PIN', error: error.message })
  }
}


const checkEmail = async (req, res) => {
  try {
    const { email } = req.body
    const admin = await Admin.findOne({ email })

    if (!admin) {
      return res.status(404).json({ message: 'No account found with this email' })
    }

    res.status(200).json({
      exists: true,
      fullName: admin.fullName,
      role: admin.role,
      isOwner: admin.isOwner,
      pinSet: admin.pinSet
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}


const loginWithPin = async (req, res) => {
  try {
    const { email, pin } = req.body
    const admin = await Admin.findOne({ email })

    if (!admin || !admin.pinSet) {
      return res.status(400).json({ message: 'Invalid login attempt' })
    }

    const isMatch = await bcrypt.compare(pin, admin.pin)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect PIN' })
    }

    admin.lastLogin = new Date()
    await admin.save()

    const token = jwt.sign(
      { id: admin._id, isOwner: admin.isOwner },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    )

    res.status(200).json({
      message: 'Login successful',
      token,
      fullName: admin.fullName
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}


const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    const admin = await Admin.findOne({ email })

    if (!admin) {
      return res.status(400).json({ message: 'Invalid login attempt' })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' })
    }

    admin.lastLogin = new Date()
    await admin.save()

    const token = jwt.sign(
      { id: admin._id, isOwner: admin.isOwner },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    )

    res.status(200).json({
      message: 'Login successful',
      token,
      fullName: admin.fullName
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}


const addToWhitelist = async (req, res) => {
  try {
    const { email } = req.body

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' })
    }

    const requestingAdminId = req.admin.id

    const requestingAdmin = await Admin.findById(requestingAdminId)
    if (!requestingAdmin || !requestingAdmin.isOwner) {
      return res.status(403).json({ message: 'Only the Owner can add new admins' })
    }

    const existing = await AllowedAdmin.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'This email is already whitelisted' })
    }

    const newEntry = await AllowedAdmin.create({
      email,
      addedBy: requestingAdmin.email
    })

    res.status(201).json({
      message: 'Email added to whitelist',
      data: newEntry
    })
  } catch (error) {
    res.status(400).json({
      message: 'Failed to add email',
      error: error.message
    })
  }
}


const getWhitelist = async (req, res) => {
  try {
    const list = await AllowedAdmin.find().sort({ createdAt: -1 })
    res.status(200).json(list)
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch whitelist',
      error: error.message
    })
  }
}


const verifyPin = async (req, res) => {
  try {
    const { id, pin } = req.body
    const admin = await Admin.findById(id)

    if (!admin) {
      return res.status(404).json({ message: 'Account not found' })
    }

    const isMatch = await bcrypt.compare(pin, admin.pin)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect PIN' })
    }

    res.status(200).json({ message: 'PIN verified' })
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    })
  }
}


const deleteAdmin = async (req, res) => {
  try {
    const { email, pin } = req.body

    const requestingAdmin = await Admin.findById(req.admin.id)
    if (!requestingAdmin || !requestingAdmin.isOwner) {
      return res.status(403).json({ message: 'Only the Owner can remove admins' })
    }

    const isMatch = await bcrypt.compare(pin, requestingAdmin.pin)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect PIN' })
    }

    await AllowedAdmin.deleteOne({ email })
    await Admin.deleteOne({ email, isOwner: false })

    res.status(200).json({ message: 'Removed permanently' })
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    })
  }
}


// Generates a random 6-digit code
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString()


// Sends an OTP for any purpose (signup, password-reset, pin-reset)
const sendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      })
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Removes any old, unused codes for this same email/purpose first
    await Otp.deleteMany({ email, purpose })
    await Otp.create({ email, code, purpose, expiresAt })

    await sendOtpEmail(email, code)

    res.status(200).json({
      message: 'OTP sent to your email'
    })
  } catch (error) {
    res.status(500).json({
      message: 'Failed to send OTP',
      error: error.message
    })
  }
}


// Verifies an OTP without taking any further action — used during signup, before account creation
const verifyOtp = async (req, res) => {
  try {
    const { email, code, purpose } = req.body

    const record = await Otp.findOne({ email, purpose }).sort({ createdAt: -1 })

    if (!record || record.code !== code) {
      return res.status(400).json({ message: 'Invalid code' })
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Code has expired' })
    }

    record.verified = true
    await record.save()

    res.status(200).json({
      message: 'Verified successfully'
    })
  } catch (error) {
    res.status(500).json({
      message: 'Verification failed',
      error: error.message
    })
  }
}


// Verifies OTP AND sets a new password in one step
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body

    const record = await Otp.findOne({
      email,
      purpose: 'password-reset'
    }).sort({ createdAt: -1 })

    if (!record || record.code !== code || record.expiresAt < new Date()) {
      return res.status(400).json({
        message: 'Invalid or expired code'
      })
    }

    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(404).json({
        message: 'Account not found'
      })
    }

    const salt = await bcrypt.genSalt(10)
    admin.password = await bcrypt.hash(newPassword, salt)
    await admin.save()

    await Otp.deleteMany({
      email,
      purpose: 'password-reset'
    })

    sendPasswordResetConfirmation(email)
      .catch((err) => console.log(
        'Failed to send confirmation:',
        err.message
      ))

    res.status(200).json({
      message: 'Password reset successfully'
    })
  } catch (error) {
    res.status(500).json({
      message: 'Reset failed',
      error: error.message
    })
  }
}


// Verifies OTP AND sets a new PIN in one step
const resetPin = async (req, res) => {
  try {
    const { email, code, newPin } = req.body

    const record = await Otp.findOne({
      email,
      purpose: 'pin-reset'
    }).sort({ createdAt: -1 })

    if (!record || record.code !== code || record.expiresAt < new Date()) {
      return res.status(400).json({
        message: 'Invalid or expired code'
      })
    }

    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(404).json({
        message: 'Account not found'
      })
    }

    const salt = await bcrypt.genSalt(10)
    admin.pin = await bcrypt.hash(newPin, salt)
    admin.pinSet = true
    await admin.save()

    await Otp.deleteMany({
      email,
      purpose: 'pin-reset'
    })

    sendPinResetConfirmation(email)
      .catch((err) => console.log(
        'Failed to send confirmation:',
        err.message
      ))

    res.status(200).json({
      message: 'PIN reset successfully'
    })
  } catch (error) {
    res.status(500).json({
      message: 'Reset failed',
      error: error.message
    })
  }
}


module.exports = {
  checkOwnerExists,
  getMe,
  signupOwner,
  signupAdmin,
  setupPin,
  checkEmail,
  loginWithPin,
  loginWithPassword,
  addToWhitelist,
  getWhitelist,
  verifyPin,
  deleteAdmin,
  sendOtp,
  verifyOtp,
  resetPassword,
  resetPin
}