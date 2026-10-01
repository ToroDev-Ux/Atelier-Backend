// createAdmin.js
// One-time script — run manually to create the very first Owner account

const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])

require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const Admin = require('./models/Admin')

const createOwner = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    const existingOwner = await Admin.findOne({ isOwner: true })
    if (existingOwner) {
      console.log('An Owner account already exists:', existingOwner.email)
      process.exit()
    }

    // Fill in your real details here before running
    const fullName = 'Your Full Name'
    const email = 'youremail@example.com'
    const plainPassword = 'YourSecurePassword123!'
    const plainPin = '1234'
    const role = 'Owner'
    const age = 22
    const address = 'Lagos, Nigeria'
    const phone = '08012345678'

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(plainPassword, salt)
    const hashedPin = await bcrypt.hash(plainPin, salt)

    const newOwner = await Admin.create({
      fullName,
      email,
      password: hashedPassword,
      pin: hashedPin,
      role,
      age,
      address,
      phone,
      isOwner: true,
    })

    console.log('Owner account created successfully:', newOwner.email)
    process.exit()

  } catch (error) {
    console.log('Failed to create Owner:', error.message)
    process.exit(1)
  }
}

createOwner()