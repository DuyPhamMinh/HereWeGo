var ObjectId = require('mongodb').ObjectId;

class TourRepository {
    context;
    session;

    constructor(context, session = null) {
        this.context = context;
        this.session = session;
    }

    async insertTour(tour) {
        var session = this.session;
        return await this.context.collection("tours").insertOne(tour, { session });
    }

    async updateTour(tour) {
        var session = this.session;
        const updateData = { ...tour };
        delete updateData._id;
        return await this.context.collection("tours").updateOne(
            { "_id": new ObjectId(tour._id) },
            { $set: updateData },
            { session }
        );
    }

    async deleteTour(id) {
        var session = this.session;
        return await this.context.collection("tours").deleteOne(
            { "_id": new ObjectId(id) },
            { session }
        );
    }

    async getTour(id) {
        return await this.context.collection("tours").findOne(
            { "_id": new ObjectId(id) },
            {}
        );
    }

    async getTourList(skip, take, query = {}) {
        const cursor = await this.context.collection("tours").find(query, {}).skip(skip).limit(take);
        return await cursor.toArray();
    }

    async countTours(query = {}) {
        return await this.context.collection("tours").countDocuments(query);
    }
}

module.exports = TourRepository;

