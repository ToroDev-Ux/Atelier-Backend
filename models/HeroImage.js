// HeroImage.js

// Brings in the tool that lets us define a data shape for MongoDB
const mongoose = require('mongoose')

// Defines what one hero image document must look like
const heroImageSchema = new mongoose.Schema({

  // The actual link to the image — required, must always be provided
  imageUrl: {
    type: String,
    required: true,
  },

  // A short description of the image, for accessibility — optional
  altText: {
    type: String,
    required: false,
  },

}, {
  // Automatically adds createdAt and updatedAt fields to every document
  timestamps: true,
})

// Turns the schema into an actual usable Model, named "HeroImage"
const HeroImage = mongoose.model('HeroImage', heroImageSchema)

// Makes this Model available to other files (like our controller)
module.exports = HeroImage