var DatabaseConnection = require(global.__basedir + '/apps/Database/Database');
var Config = require(global.__basedir + "/config/config");
var UserRepository = require(global.__basedir + "/apps/Repository/UserRepository");
const bcrypt = require('bcryptjs');

class UserService {
    userRepository;
    session;
    client;
    database;

    constructor() {
        this.client = null;
        this.session = null;
        this.database = null;
        this.userRepository = null;
    }

    async connect() {
        this.client = DatabaseConnection.getMongoClient();
        await this.client.connect();
        this.database = this.client.db(Config.mongodb.database);
        this.session = this.client.startSession();
        this.session.startTransaction();
        this.userRepository = new UserRepository(this.database, this.session);
    }

    async insertUser(user) {
        try {
            await this.connect();

            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }

            var result = await this.userRepository.insertUser(user);
            await this.session.commitTransaction();
            return result;
        } catch (error) {
            await this.session.abortTransaction();
            throw error;
        } finally {
            await this.session.endSession();
            if (this.client) {
                await this.client.close();
            }
        }
    }

    async deleteUser(id) {
        try {
            await this.connect();
            var result = await this.userRepository.deleteUser(id);
            await this.session.commitTransaction();
            return result;
        } catch (error) {
            await this.session.abortTransaction();
            throw error;
        } finally {
            await this.session.endSession();
            if (this.client) {
                await this.client.close();
            }
        }
    }

    async updateUser(user) {
        try {
            await this.connect();

            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }

            var result = await this.userRepository.updateUser(user);
            await this.session.commitTransaction();
            return result;
        } catch (error) {
            await this.session.abortTransaction();
            throw error;
        } finally {
            await this.session.endSession();
            if (this.client) {
                await this.client.close();
            }
        }
    }

    async getUser(id) {
        try {
            await this.connect();
            var result = await this.userRepository.getUser(id);
            return result;
        } catch (error) {
            throw error;
        } finally {
            await this.session.endSession();
            if (this.client) {
                await this.client.close();
            }
        }
    }

    async getUserByEmail(email) {
        try {
            await this.connect();
            var result = await this.userRepository.getUserByEmail(email);
            return result;
        } catch (error) {
            throw error;
        } finally {
            await this.session.endSession();
            if (this.client) {
                await this.client.close();
            }
        }
    }

    async getUserList(skip = 0, take = 100, query = {}) {
        try {
            await this.connect();
            var userList = await this.userRepository.getUserList(skip, take, query);
            var total = await this.userRepository.countUsers(query);
            return {
                data: userList,
                total: total,
                skip: skip,
                take: take
            };
        } catch (error) {
            throw error;
        } finally {
            await this.session.endSession();
            if (this.client) {
                await this.client.close();
            }
        }
    }
}

module.exports = UserService;

