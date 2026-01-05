var ObjectId = require('mongodb').ObjectId;

class CategoryRepository {
    context;
    session;

    constructor(context, session = null) {
        this.context = context;
        this.session = session;
    }

    async insertCategory(category) {
        var session = this.session;
        return await this.context.collection("category").insertOne(category, { session });
    }

    async updateCategory(category) {
        var session = this.session;
        const updateData = { ...category };
        delete updateData._id;
        return await this.context.collection("category").updateOne(
            { "_id": new ObjectId(category._id) },
            { $set: updateData },
            { session }
        );
    }

    async deleteCategory(id) {
        var session = this.session;
        return await this.context.collection("category").deleteOne(
            { "_id": new ObjectId(id) },
            { session }
        );
    }

    async getCategory(id) {
        return await this.context.collection("category").findOne(
            { "_id": new ObjectId(id) },
            {}
        );
    }

    async getCategoryList(skip, take, query = {}) {
        const cursor = await this.context.collection("category").find(query, {}).skip(skip).limit(take);
        return await cursor.toArray();
    }

    async countCategories(query = {}) {
        return await this.context.collection("category").countDocuments(query);
    }
}

module.exports = CategoryRepository;

