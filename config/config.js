// Configuration helper - Load from environment variables with fallback to Setting.json
require("dotenv").config();
const path = require("path");
const fs = require("fs");

// Try to load Setting.json as fallback
let settingConfig = {};
try {
  const settingPath = path.join(__dirname, "Setting.json");
  if (fs.existsSync(settingPath)) {
    settingConfig = require(settingPath);
  }
} catch (error) {
  console.warn("Warning: Could not load Setting.json");
}

// Get JWT secret with proper fallback
function getJWTSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  
  if (settingConfig.jwt && settingConfig.jwt.secret) {
    return settingConfig.jwt.secret;
  }
  
  // Fallback to a default secret (should be changed in production)
  console.warn("Warning: Using default JWT secret. Please set JWT_SECRET in .env file");
  return "default-secret-key-change-in-production";
}

// Get JWT expires in
function getJWTExpiresIn() {
  return process.env.JWT_EXPIRES_IN || 
         (settingConfig.jwt && settingConfig.jwt.expiresIn) || 
         "24h";
}

// Get MongoDB URI
function getMongoDBUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  
  // Try to construct from individual parts
  const username = process.env.MONGODB_USERNAME || settingConfig.mongodb?.username || "";
  const password = process.env.MONGODB_PASSWORD || settingConfig.mongodb?.password || "";
  const database = process.env.MONGODB_DATABASE || settingConfig.mongodb?.database || "account";
  
  if (username && password) {
    return `mongodb+srv://${username}:${password}@cluster.mongodb.net/${database}?retryWrites=true&w=majority`;
  }
  
  throw new Error("MONGODB_URI is required in .env file");
}

// Get Session Secret
function getSessionSecret() {
  return process.env.SESSION_SECRET || "default-session-secret-change-in-production";
}

// Export functions and computed values
const config = {
  getJWTSecret,
  getJWTExpiresIn,
  getMongoDBUri,
  getSessionSecret,
};

// Add computed properties
Object.defineProperty(config, 'jwt', {
  get: function() {
    return {
      secret: getJWTSecret(),
      expiresIn: getJWTExpiresIn(),
    };
  }
});

Object.defineProperty(config, 'mongodb', {
  get: function() {
    return {
      uri: getMongoDBUri(),
    };
  }
});

Object.defineProperty(config, 'session', {
  get: function() {
    return {
      secret: getSessionSecret(),
    };
  }
});

module.exports = config;

