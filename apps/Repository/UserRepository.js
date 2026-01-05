var ObjectId = require('mongodb').ObjectId;

class UserRepository {
    context;
    session;

    constructor(context, session = null) {
        this.context = context;
        this.session = session;
    }

    async insertUser(user) {
        var session = this.session;
        return await this.context.collection("users").insertOne(user, { session });
    }

    async updateUser(user) {
        var session = this.session;
        const updateData = { ...user };
        delete updateData._id;
        return await this.context.collection("users").updateOne(
            { "_id": new ObjectId(user._id) },
            { $set: updateData },
            { session }
        );
    }

    async deleteUser(id) {
        var session = this.session;
        return await this.context.collection("users").deleteOne(
            { "_id": new ObjectId(id) },
            { session }
        );
    }

    async getUser(id) {
        return await this.context.collection("users").findOne(
            { "_id": new ObjectId(id) },
            {}
        );
    }

    async getUserByEmail(email) {
        return await this.context.collection("users").findOne(
            { "email": email },
            {}
        );
    }

    async getUserList(skip, take, query = {}) {
        const cursor = await this.context.collection("users").find(query, {}).skip(skip).limit(take);
        return await cursor.toArray();
    }

    async countUsers(query = {}) {
        return await this.context.collection("users").countDocuments(query);
    }
}

module.exports = UserRepository;

