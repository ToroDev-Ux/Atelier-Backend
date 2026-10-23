
const bcrypt = require('bcrypt')
const Admin = require('../models/Admin')
const AllowedAdmin = require('../models/AllowedAdmin')
const Otp = require('../models/Otp')
const jwt = require('jsonwebtoken')
const validator = require('validator')

const {
  sendOtpEmail,
  sendPasswordResetConfirmation,
  sendPinResetConfirmation
} = require('../utils/sendEmail')

// Normalize email addresses consistently.
const normalizeEmail = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const findAdminByEmail = (email) =>
  Admin.findOne({
    email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' }
  })

const findAllowedAdmin = (email) =>
  AllowedAdmin.findOne({
    email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' }
  })

const checkOwnerExists = async (req, res) => {
  try {
    const owner = await Admin.findOne({ isOwner: true })
    return res.status(200).json({ ownerExists: !!owner })
  } catch (error) {
    console.error('Owner check failed:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id)
      .select('-password -pin')

    if (!admin) {
      return res.status(404).json({ message: 'Account not found' })
    }

    return res.status(200).json(admin)
  } catch (error) {
    console.error('Get profile failed:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

const signupOwner = async (req, res) => {
  try {
    const { fullName, password, age, address, phone } = req.body
    const email = normalizeEmail(req.body.email)

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      })
    }

    if (
      typeof fullName !== 'string' ||
      !fullName.trim() ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: 'Provide your name and a password of at least 8 characters'
      })
    }

    // Check for an existing Owner.
    const existingOwner = await Admin.findOne({ isOwner: true })

    if (existingOwner) {
      return res.status(409).json({
        message: 'An Owner account already exists'
      })
    }

    // Prevent duplicate accounts.
    const existingAccount = await findAdminByEmail(email)

    if (existingAccount) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      })
    }

    // Require a verified signup OTP.
    const verifiedOtp = await Otp.findOne({
      email,
      purpose: 'signup',
      verified: true
    })

    if (!verifiedOtp) {
      return res.status(403).json({
        message: 'Please verify your email first'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newOwner = await Admin.create({
      fullName: fullName.trim(),
      email,
      password: hashedPassword,
      role: 'Owner',
      age,
      address,
      phone,
      isOwner: true
    })

    await Otp.deleteMany({ email, purpose: 'signup' })

    return res.status(201).json({
      message: 'Owner account created',
      email: newOwner.email
    })
  } catch (error) {
    console.error('Owner signup failed:', error)

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email or Owner status already exists'
      })
    }

    return res.status(400).json({ message: 'Signup failed' })
  }
}

const signupAdmin = async (req, res) => {
  try {
    const {
      fullName,
      password,
      age,
      address,
      phone,
      role
    } = req.body

    const email = normalizeEmail(req.body.email)

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      })
    }

    if (
      typeof fullName !== 'string' ||
      !fullName.trim() ||
      typeof password !== 'string' ||
      password.length < 8 ||
      typeof role !== 'string' ||
      !role.trim()
    ) {
      return res.status(400).json({
        message: 'Provide your name, role, and a password of at least 8 characters'
      })
    }

    // Only whitelisted addresses may create Admin accounts.
    const isWhitelisted = await findAllowedAdmin(email)

    if (!isWhitelisted) {
      return res.status(403).json({
        message: 'This email is not authorized to sign up'
      })
    }

    const existingAccount = await findAdminByEmail(email)

    if (existingAccount) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      })
    }

    const verifiedOtp = await Otp.findOne({
      email,
      purpose: 'signup',
      verified: true
    })

    if (!verifiedOtp) {
      return res.status(403).json({
        message: 'Please verify your email first'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newAdmin = await Admin.create({
      fullName: fullName.trim(),
      email,
      password: hashedPassword,
      role: role.trim(),
      age,
      address,
      phone,
      isOwner: false
    })

    await Otp.deleteMany({ email, purpose: 'signup' })

    return res.status(201).json({
      message: 'Admin account created',
      email: newAdmin.email
    })
  } catch (error) {
    console.error('Admin signup failed:', error)

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      })
    }

    return res.status(400).json({ message: 'Signup failed' })
  }
}

const setupPin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const { pin } = req.body

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      })
    }

    if (typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({
        message: 'PIN must contain 4 to 6 digits'
      })
    }

    const admin = await findAdminByEmail(email)

    if (!admin) {
      return res.status(404).json({ message: 'Account not found' })
    }

    const hashedPin = await bcrypt.hash(pin, 10)

    admin.pin = hashedPin
    admin.pinSet = true
    await admin.save()

    return res.status(200).json({
      message: 'PIN set successfully'
    })
  } catch (error) {
    console.error('PIN setup failed:', error)
    return res.status(400).json({ message: 'Failed to set PIN' })
  }
}

const checkEmail = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      })
    }

    const admin = await findAdminByEmail(email)

    if (!admin) {
      return res.status(404).json({
        message: 'No account found with this email'
      })
    }

    return res.status(200).json({
      exists: true,
      fullName: admin.fullName,
      role: admin.role,
      isOwner: admin.isOwner,
      pinSet: admin.pinSet
    })
  } catch (error) {
    console.error('Email check failed:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

const loginWithPin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const { pin } = req.body

    const admin = await findAdminByEmail(email)

    if (!admin || !admin.pinSet || !admin.pin) {
      return res.status(400).json({
        message: 'Invalid login attempt'
      })
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

    return res.status(200).json({
      message: 'Login successful',
      token,
      fullName: admin.fullName
    })
  } catch (error) {
    console.error('PIN login failed:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

const loginWithPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const { password } = req.body

    const admin = await findAdminByEmail(email)

    if (!admin) {
      return res.status(400).json({
        message: 'Invalid login attempt'
      })
    }

    const isMatch = await bcrypt.compare(password, admin.password)

    if (!isMatch) {
      return res.status(401).json({
        message: 'Incorrect password'
      })
    }

    admin.lastLogin = new Date()
    await admin.save()

    const token = jwt.sign(
      { id: admin._id, isOwner: admin.isOwner },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    )

    return res.status(200).json({
      message: 'Login successful',
      token,
      fullName: admin.fullName
    })
  } catch (error) {
    console.error('Password login failed:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

const addToWhitelist = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      })
    }

    const requestingAdmin = await Admin.findById(req.admin.id)

    if (!requestingAdmin || !requestingAdmin.isOwner) {
      return res.status(403).json({
        message: 'Only the Owner can add new admins'
      })
    }

    const existing = await findAllowedAdmin(email)

    if (existing) {
      return res.status(409).json({
        message: 'This email is already whitelisted'
      })
    }

    const newEntry = await AllowedAdmin.create({
      email,
      addedBy: requestingAdmin.email
    })

    return res.status(201).json({
      message: 'Email added to whitelist',
      data: newEntry
    })
  } catch (error) {
    console.error('Adding whitelist entry failed:', error)
    return res.status(400).json({
      message: 'Failed to add email'
    })
  }
}

const getWhitelist = async (req, res) => {
  try {
    const list = await AllowedAdmin.find().sort({ createdAt: -1 })
    return res.status(200).json(list)
  } catch (error) {
    console.error('Fetching whitelist failed:', error)
    return res.status(500).json({
      message: 'Failed to fetch whitelist'
    })
  }
}

const verifyPin = async (req, res) => {
  try {
    const { id, pin } = req.body
    const admin = await Admin.findById(id)

    if (!admin || !admin.pinSet || !admin.pin) {
      return res.status(404).json({ message: 'Account not found' })
    }

    const isMatch = await bcrypt.compare(pin, admin.pin)

    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect PIN' })
    }

    return res.status(200).json({ message: 'PIN verified' })
  } catch (error) {
    console.error('PIN verification failed:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

const deleteAdmin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const { pin } = req.body

    const requestingAdmin = await Admin.findById(req.admin.id)

    if (!requestingAdmin || !requestingAdmin.isOwner) {
      return res.status(403).json({
        message: 'Only the Owner can remove admins'
      })
    }

    if (!requestingAdmin.pin) {
      return res.status(401).json({
        message: 'Set your PIN before removing an Admin'
      })
    }

    const isMatch = await bcrypt.compare(pin, requestingAdmin.pin)

    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect PIN' })
    }

    await AllowedAdmin.deleteOne({
      email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' }
    })

    await Admin.deleteOne({
      email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
      isOwner: false
    })

    return res.status(200).json({ message: 'Removed permanently' })
  } catch (error) {
    console.error('Admin removal failed:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

// Generates a random 6-digit OTP.
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString()

const sendOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const { purpose, signupType } = req.body

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      })
    }

    if (!['signup', 'password-reset', 'pin-reset'].includes(purpose)) {
      return res.status(400).json({ message: 'Invalid OTP purpose' })
    }

    if (purpose === 'signup') {
      if (!['owner', 'admin'].includes(signupType)) {
        return res.status(400).json({ message: 'Invalid signup type' })
      }

      const existingAccount = await findAdminByEmail(email)

      if (existingAccount) {
        return res.status(409).json({
          message: 'An account with this email already exists'
        })
      }

      if (signupType === 'owner') {
        const owner = await Admin.findOne({ isOwner: true })

        if (owner) {
          return res.status(409).json({
            message: 'An Owner account already exists'
          })
        }
      }

      if (signupType === 'admin') {
        const allowed = await findAllowedAdmin(email)

        if (!allowed) {
          return res.status(403).json({
            message: 'This email is not authorized to sign up'
          })
        }
      }
    } else {
      const existingAccount = await findAdminByEmail(email)

      if (!existingAccount) {
        return res.status(404).json({
          message: 'No account found with this email'
        })
      }
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await Otp.deleteMany({ email, purpose })

    await Otp.create({
      email,
      code,
      purpose,
      expiresAt,
      verified: false
    })

    await sendOtpEmail(email, code)

    return res.status(200).json({
      message: 'OTP sent to your email'
    })
  } catch (error) {
    console.error('Sending OTP failed:', error)
    return res.status(500).json({
      message: 'Failed to send OTP'
    })
  }
}

const verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const { code, purpose } = req.body

    if (!validator.isEmail(email) || !code || !purpose) {
      return res.status(400).json({
        message: 'Email, code, and purpose are required'
      })
    }

    const record = await Otp.findOne({
      email,
      purpose
    }).sort({ createdAt: -1 })

    if (!record || record.code !== String(code)) {
      return res.status(400).json({ message: 'Invalid code' })
    }

    if (!record.expiresAt || record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id })
      return res.status(400).json({ message: 'Code has expired' })
    }

    record.verified = true
    await record.save()

    return res.status(200).json({
      message: 'Verified successfully'
    })
  } catch (error) {
    console.error('OTP verification failed:', error)
    return res.status(500).json({
      message: 'Verification failed'
    })
  }
}

const resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const { code, newPassword } = req.body

    const record = await Otp.findOne({
      email,
      purpose: 'password-reset'
    }).sort({ createdAt: -1 })

    if (
      !record ||
      record.code !== String(code) ||
      !record.expiresAt ||
      record.expiresAt < new Date()
    ) {
      return res.status(400).json({
        message: 'Invalid or expired code'
      })
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters'
      })
    }

    const admin = await findAdminByEmail(email)

    if (!admin) {
      return res.status(404).json({ message: 'Account not found' })
    }

    admin.password = await bcrypt.hash(newPassword, 10)
    await admin.save()

    await Otp.deleteMany({ email, purpose: 'password-reset' })

    sendPasswordResetConfirmation(email).catch((err) => {
      console.error('Password reset confirmation failed:', err.message)
    })

    return res.status(200).json({
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('Password reset failed:', error)
    return res.status(500).json({ message: 'Reset failed' })
  }
}

const resetPin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const { code, newPin } = req.body

    const record = await Otp.findOne({
      email,
      purpose: 'pin-reset'
    }).sort({ createdAt: -1 })

    if (
      !record ||
      record.code !== String(code) ||
      !record.expiresAt ||
      record.expiresAt < new Date()
    ) {
      return res.status(400).json({
        message: 'Invalid or expired code'
      })
    }

    if (typeof newPin !== 'string' || !/^\d{4,6}$/.test(newPin)) {
      return res.status(400).json({
        message: 'PIN must contain 4 to 6 digits'
      })
    }

    const admin = await findAdminByEmail(email)

    if (!admin) {
      return res.status(404).json({ message: 'Account not found' })
    }

    admin.pin = await bcrypt.hash(newPin, 10)
    admin.pinSet = true
    await admin.save()

    await Otp.deleteMany({ email, purpose: 'pin-reset' })

    sendPinResetConfirmation(email).catch((err) => {
      console.error('PIN reset confirmation failed:', err.message)
    })

    return res.status(200).json({
      message: 'PIN reset successfully'
    })
  } catch (error) {
    console.error('PIN reset failed:', error)
    return res.status(500).json({ message: 'Reset failed' })
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
