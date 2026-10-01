// authMiddleware.js

const jwt = require('jsonwebtoken')

const protectRoute = (req, res, next) => {
  try {
    // Tokens are typically sent in the request header like: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    // Extracts just the token part, removing "Bearer "
    const token = authHeader.split(' ')[1]

    // Verifies the token is genuine and not expired, using the same secret that created it
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attaches the decoded info (id, isOwner) to the request, so the controller can use it later
    req.admin = decoded

    next() // token is valid — let the request continue to the actual controller

  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

module.exports = protectRoute