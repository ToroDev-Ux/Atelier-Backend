// AllowedAdmin.js

const mongoose = require('mongoose')

const allowedAdminSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true,
  },

  addedBy: {
    type: String,
    required: true,
  },

}, {
  timestamps: true,
})

const AllowedAdmin = mongoose.model('AllowedAdmin', allowedAdminSchema)

module.exports = AllowedAdmin