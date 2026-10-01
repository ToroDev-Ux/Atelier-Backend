// heroImageController.js

// Brings in our HeroImage model so we can query MongoDB with it
const HeroImage = require('../models/HeroImage')

// This function handles what happens when someone requests hero images
const getHeroImages = async (req, res) => {
  try {

    // Asks MongoDB for every document in the HeroImage collection
    const images = await HeroImage.find()

    // Sends them back as a JSON response, with a 200 (success) status
    res.status(200).json(images)

  } catch (error) {

    // If something goes wrong (e.g. database error), send a 500 (server error) response
    res.status(500).json({ message: 'Failed to fetch hero images', error: error.message })
  }
}

// Makes this function available to our routes file
module.exports = { getHeroImages }