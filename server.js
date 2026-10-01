// server.js

const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])

require('dotenv').config()

const express = require('express')
const connectDB = require('./config/db')
const seedHeroImages = require('./backgroundImages')
const heroImageRoutes = require('./routes/heroImageRoutes')
const subscriberRoutes = require('./routes/subscriberRoutes')
const adminRoutes = require('./routes/adminRoutes')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const app = express()

// Define the limiter BEFORE using it below
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many submissions, please try again later.' }
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again later.' }
})

app.use(express.json())
app.use(cors())

app.use('/api/v1', heroImageRoutes)

// Apply the rate limiter to specific routes
app.use('/api/v1/contact', contactLimiter)
app.use('/api/v1/admin/login-pin', loginLimiter)
app.use('/api/v1/admin/login-password', loginLimiter)

app.use('/api/v1', subscriberRoutes)
app.use('/api/v1', adminRoutes)

app.get('/', (req, res) => {
  res.send('Atelier backend is running')
})

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()
    await seedHeroImages()

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.log('Server startup failed:', error.message)
    process.exit(1)
  }
}

startServer()