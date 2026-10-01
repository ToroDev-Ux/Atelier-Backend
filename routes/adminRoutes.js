const express = require('express')
const router = express.Router()
const {
    checkOwnerExists,
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
    getMe,
    resetPin
} = require('../controllers/adminController')
const protectRoute = require('../middleware/authMiddleware')

router.get('/admin/owner-exists', checkOwnerExists)
router.get('/admin/me', protectRoute, getMe)
router.post('/admin/signup-owner', signupOwner)
router.post('/admin/signup-admin', signupAdmin)
router.post('/admin/setup-pin', setupPin)
router.post('/admin/check-email', checkEmail)
router.post('/admin/login-pin', loginWithPin)
router.post('/admin/login-password', loginWithPassword)
router.post('/admin/whitelist', protectRoute, addToWhitelist)
router.get('/admin/whitelist', protectRoute, getWhitelist)
router.post('/admin/verify-pin', protectRoute, verifyPin)
router.delete('/admin/remove', protectRoute, deleteAdmin)
router.post('/admin/send-otp', sendOtp)
router.post('/admin/verify-otp', verifyOtp)
router.post('/admin/reset-password', resetPassword)
router.post('/admin/reset-pin', resetPin)

module.exports = router