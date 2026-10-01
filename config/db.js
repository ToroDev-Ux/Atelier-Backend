// Imports Mongoose so we can connect our Node.js application to MongoDB
const mongoose = require('mongoose')

// Creates an asynchronous function responsible for connecting to MongoDB
const connectDB = async () => {

  // Starts a try block so we can catch any errors that happen during the connection
  try {

    // Connects Mongoose to the MongoDB database
    // process.env.MONGO_URI gets the MongoDB connection string from the .env file
    // await makes JavaScript wait until the MongoDB connection succeeds or fails
    await mongoose.connect(process.env.MONGO_URI)

    // Runs only after the MongoDB connection is successful
    // This message lets us know that the database connection worked
    console.log('MongoDB connected successfully')

  // If something goes wrong inside the try block, JavaScript comes here
  } catch (error) {

    // Displays a message explaining that the MongoDB connection failed
    // error.message contains the actual reason for the failure
    console.log('MongoDB connection failed:', error.message)

    // Stops the Node.js application because the backend cannot work properly
    // without a successful database connection
    process.exit(1)
  }
}

// Exports the connectDB function so other files, such as server.js,
// can import it and use it
module.exports = connectDB