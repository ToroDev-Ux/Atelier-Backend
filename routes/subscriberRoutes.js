const express = require('express');
const router = express.Router();
const protectRoute = require('../middleware/authMiddleware')
const { createSubscriber, getSubscribers, markAsRead, sendReply } = require('../controllers/subscriberController')
// When a POST request hits /contact, run createSubscriber
router.post('/contact', createSubscriber);
router.get('/admin/messages', protectRoute, getSubscribers)
router.patch('/admin/messages/:id/read', protectRoute, markAsRead)

router.post('/admin/messages/:id/reply', protectRoute, sendReply)
module.exports = router;