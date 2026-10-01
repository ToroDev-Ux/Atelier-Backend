// Admin.js

const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({

  fullName: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  pin: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    required: true,
  },

  age: {
    type: Number,
    required: false,
  },

  address: {
    type: String,
    required: false,
  },

  phone: {
    type: String,
    required: false,
  },

  // True only for the very first account ever created
  isOwner: {
    type: Boolean,
    default: false,
  },
  pin: {
    type: String,
    required: false,
  },
  pinSet: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date
  },
}, {
  timestamps: true,
})

const Admin = mongoose.model('Admin', adminSchema)

module.exports = Admin