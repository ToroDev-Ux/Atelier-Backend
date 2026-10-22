// server.js

const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])

require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const connectDB = require('./config/db')
const seedHeroImages = require('./backgroundImages')
const heroImageRoutes = require('./routes/heroImageRoutes')
const subscriberRoutes = require('./routes/subscriberRoutes')
const adminRoutes = require('./routes/adminRoutes')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const app = express()

// Render sits behind a proxy. Without this, the rate limiters
// can't read the visitor's real IP and log X-Forwarded-For errors.
app.set('trust proxy', 1)

// Define the limiters BEFORE using them below
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

// Only these origins may call the API from a browser.
// FRONTEND_URL is your live Cloudflare URL, set in Render's Environment tab.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean)

app.use(cors({
  origin: allowedOrigins,
}))

// Basic backend status
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Atelier Backend',
    status: 'running',
    message: 'Atelier Backend is running',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  })
})

// Liveness check: confirms the server is running
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Atelier Backend',
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  })
})

// Readiness check: confirms MongoDB is connected and responsive
app.get('/health/ready', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return res.status(503).json({
        success: false,
        service: 'Atelier Backend',
        status: 'not_ready',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      })
    }

    await mongoose.connection.db.admin().ping()

    return res.status(200).json({
      success: true,
      service: 'Atelier Backend',
      status: 'ready',
      database: 'connected',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return res.status(503).json({
      success: false,
      service: 'Atelier Backend',
      status: 'not_ready',
      database: 'unavailable',
      timestamp: new Date().toISOString()
    })
  }
})

// Existing API routes
app.use('/api/v1', heroImageRoutes)

// Apply the rate limiters to specific routes
app.use('/api/v1/contact', contactLimiter)
app.use('/api/v1/admin/login-pin', loginLimiter)
app.use('/api/v1/admin/login-password', loginLimiter)

app.use('/api/v1', subscriberRoutes)
app.use('/api/v1', adminRoutes)

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