const mongoose = require("mongoose");
const config = require("./config");

const connectDB = async () => {
  try {
    const mongoUri = config.mongodb.uri;
    
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables or config");
    }
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    console.error("Please check your MONGODB_URI in .env file");
    process.exit(1);
  }
};

module.exports = connectDB;
