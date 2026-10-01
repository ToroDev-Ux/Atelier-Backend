// models/Subscriber.js

const mongoose = require('mongoose')

const subscriberSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: false,
  },

  message: {
    type: String,
    required: true,
  },

  isRead: {
    type: Boolean,
    default: false,
  },
  replies: [{
  message: String,
  sentAt: { type: Date, default: Date.now }
}]

}, {
  timestamps: true,
})


const Subscriber = mongoose.model('Subscriber', subscriberSchema)

module.exports = Subscriber