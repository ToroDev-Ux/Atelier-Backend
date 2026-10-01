// heroImageRoutes.js

// Brings in Express so we can use its Router feature
const express = require('express')

// Creates a mini router — think of it as a small, separate set of routes
const router = express.Router()

// Brings in the controller function we just built
const { getHeroImages } = require('../controllers/heroImageController')

// When a GET request hits this route, run getHeroImages
router.get('/hero-images', getHeroImages)

// Makes this router available to server.js
module.exports = router