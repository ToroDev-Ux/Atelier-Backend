// backgroundImages.js

// Imports the HeroImage model so we can work with hero images in MongoDB
const HeroImage = require('./models/HeroImage')

// Array containing all the hero images we want to store in MongoDB
const images = [

  // Image 1
  {
    imageUrl: 'https://images.unsplash.com/photo-1679023559573-d12c6b137142?q=90&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'A Moody Zen & Japandi Living Room'
  },

  // Image 2
  {
    imageUrl: 'https://plus.unsplash.com/premium_photo-1671269942411-fa6815b5335f?q=90&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'A Modern Japandi Interior of a Living Room'
  },

  // Image 3
  {
    imageUrl: 'https://images.unsplash.com/photo-1764313679680-3dbe3f02bf5f?q=90&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'A Earthy & Organic Minimalist Vanity Nook'
  },

  // Image 4
  {
    imageUrl: 'https://images.unsplash.com/photo-1766330977451-de1b64b5e641?q=90&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'A Modern Home Office and Reading Room'
  },

  // Image 5
  {
    imageUrl: 'https://images.unsplash.com/photo-1623903800664-a840b8be323b?q=90&w=1920auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'A Modern Minimalist Dining Space'
  },

  // Image 6
  {
    imageUrl: 'https://images.unsplash.com/photo-1764001597000-4576f423d6fe?q=90&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'A Minimalist Dining Setup with Warm Lighting'
  },

  // Image 7
  {
    imageUrl: 'https://images.unsplash.com/photo-1677568556685-09e40967e1f4?q=90&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'A Spacious Furniture Showroom & Living Space'
  },

  // Image 8
  {
    imageUrl: 'https://images.unsplash.com/photo-1712169603032-7b7b2ff1ea2f?q=90&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'A Dramatic & Tranquil Traditional Tea Space'
  },

  // Image 9
  {
    imageUrl: 'https://images.unsplash.com/photo-1772442363851-738a548f6c5c?q=90&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'A Warm Minimalist Dining Area'
  },

  // Image 10
  {
    imageUrl: 'https://plus.unsplash.com/premium_photo-1676525800265-008a39b0e722?q=90&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    altText: 'A Minimalist Living Room'
  }

]

// Function responsible for adding hero images to MongoDB
const seedHeroImages = async () => {

  try {

    // Checks how many hero images currently exist
    const count = await HeroImage.countDocuments()

    // Only inserts the images if the collection is empty
    if (count === 0) {

      // Adds all 10 images to MongoDB
      await HeroImage.insertMany(images)

      // Confirms that the images were successfully added
      console.log('10 hero images added successfully')

    } else {

      // Prevents duplicate images from being created
      console.log(`Hero images already exist (${count} images)`)

    }

  } catch (error) {

    // Shows the error if something goes wrong while seeding
    console.log('Hero image seeding failed:', error.message)

  }
}

// Makes the seedHeroImages function available to server.js
module.exports = seedHeroImages