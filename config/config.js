
require("dotenv").config();
const path = require("path");
const fs = require("fs");

let settingConfig = {};
try {
  const settingPath = path.join(__dirname, "Setting.json");
  if (fs.existsSync(settingPath)) {
    settingConfig = require(settingPath);
  }
} catch (error) {
  console.warn("Warning: Could not load Setting.json");
}

function getJWTSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (settingConfig.jwt && settingConfig.jwt.secret) {
    return settingConfig.jwt.secret;
  }

  console.warn("Warning: Using default JWT secret. Please set JWT_SECRET in .env file");
  return "default-secret-key-change-in-production";
}

function getJWTExpiresIn() {
  return process.env.JWT_EXPIRES_IN ||
         (settingConfig.jwt && settingConfig.jwt.expiresIn) ||
         "24h";
}

function getMongoDBUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const username = process.env.MONGODB_USERNAME || settingConfig.mongodb?.username || "";
  const password = process.env.MONGODB_PASSWORD || settingConfig.mongodb?.password || "";
  const database = process.env.MONGODB_DATABASE || settingConfig.mongodb?.database || "account";

  if (username && password) {
    return `mongodb+srv://${username}:${password}@cluster.mongodb.net/${database}?retryWrites=true&w=majority`;
  }

  throw new Error("MONGODB_URI is required in .env file");
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || "default-session-secret-change-in-production";
}

function getMongoDBDatabase() {

  if (process.env.MONGODB_DATABASE) {
    return process.env.MONGODB_DATABASE;
  }

  if (settingConfig.mongodb?.database) {
    return settingConfig.mongodb.database;
  }

  const uri = getMongoDBUri();
  if (uri) {
    try {
      const urlParts = uri.split('/');
      if (urlParts.length > 3) {
        const dbPart = urlParts[urlParts.length - 1].split('?')[0];
        if (dbPart) return dbPart;
      }
    } catch (e) {

    }
  }

  return "account";
}

const config = {
  getJWTSecret,
  getJWTExpiresIn,
  getMongoDBUri,
  getMongoDBDatabase,
  getSessionSecret,
};

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
      database: getMongoDBDatabase(),
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

