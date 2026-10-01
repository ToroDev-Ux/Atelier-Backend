// controllers/subscriberController.js

// Brings in our Subscriber model so we can save data using it
const Subscriber = require('../models/Subscriber')

const validator = require('validator')
const { sendConfirmationEmail, sendNewMessageNotification } = require('../utils/sendEmail')
const { sendReplyEmail } = require('../utils/sendEmail')



// This function runs whenever a POST request hits our contact route
const createSubscriber = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' })
    }

    const newSubscriber = await Subscriber.create({ name, email, phone, message })

    sendConfirmationEmail(newSubscriber)
    sendNewMessageNotification(newSubscriber)

    res.status(201).json({ message: 'Message sent successfully', data: newSubscriber })
  } catch (error) {
    res.status(400).json({ message: 'Failed to send message', error: error.message })
  }
}


const getSubscribers = async (req, res) => {
  try {
    // Fetches every subscriber, newest first
    const subscribers = await Subscriber.find().sort({ createdAt: -1 })

    res.status(200).json(subscribers)
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch messages',
      error: error.message
    })
  }
}


const markAsRead = async (req, res) => {
  try {
    const { id } = req.params

    const updated = await Subscriber.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    )

    if (!updated) {
      return res.status(404).json({ message: 'Message not found' })
    }

    res.status(200).json(updated)
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update message',
      error: error.message
    })
  }
}


const sendReply = async (req, res) => {
  try {
    const { id } = req.params
    const { replyMessage } = req.body

    const subscriber = await Subscriber.findById(id)
    if (!subscriber) return res.status(404).json({ message: 'Message not found' })

    subscriber.replies.push({ message: replyMessage })
    await subscriber.save()

    await sendReplyEmail(subscriber.email, subscriber.name, replyMessage)

    res.status(200).json({ message: 'Reply sent successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to send reply', error: error.message })
  }
}


// Makes these functions available to our routes file
module.exports = {
  createSubscriber,
  getSubscribers,
  markAsRead,
  sendReply
}