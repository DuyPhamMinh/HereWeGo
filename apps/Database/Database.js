var config = require(global.__basedir + "/config/config");
const { MongoClient } = require('mongodb');

class DatabaseConnection {
    static url;
    static user;
    static pass;

    constructor() {
        
    }

    static getMongoClient() {
        // Sử dụng config.js để lấy MongoDB URI (đã xử lý env variables và fallback)
        this.url = config.mongodb.uri;
        
        // Fallback to local MongoDB nếu không có URI
        if (!this.url) {
            this.url = "mongodb://127.0.0.1:27017/?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000";
        }

        const client = new MongoClient(this.url);
        return client;
    }
}

module.exports = DatabaseConnection;

