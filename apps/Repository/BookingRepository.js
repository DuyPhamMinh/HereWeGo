var ObjectId = require('mongodb').ObjectId;

class BookingRepository {
    context;
    session;

    constructor(context, session = null) {
        this.context = context;
        this.session = session;
    }

    async insertBooking(booking) {
        var session = this.session;
        return await this.context.collection("bookings").insertOne(booking, { session });
    }

    async updateBooking(booking) {
        var session = this.session;
        const updateData = { ...booking };
        delete updateData._id;
        return await this.context.collection("bookings").updateOne(
            { "_id": new ObjectId(booking._id) },
            { $set: updateData },
            { session }
        );
    }

    async deleteBooking(id) {
        var session = this.session;
        return await this.context.collection("bookings").deleteOne(
            { "_id": new ObjectId(id) },
            { session }
        );
    }

    async getBooking(id) {
        return await this.context.collection("bookings").findOne(
            { "_id": new ObjectId(id) },
            {}
        );
    }

    async getBookingList(skip, take, query = {}) {
        const cursor = await this.context.collection("bookings").find(query, {}).skip(skip).limit(take);
        return await cursor.toArray();
    }

    async countBookings(query = {}) {
        return await this.context.collection("bookings").countDocuments(query);
    }

    async getBookingsByUser(userId, skip, take) {
        const query = { "user": new ObjectId(userId) };
        const cursor = await this.context.collection("bookings").find(query, {}).skip(skip).limit(take).sort({ createdAt: -1 });
        return await cursor.toArray();
    }

    async getBookingsByTour(tourId, skip, take) {
        const query = { "tour": new ObjectId(tourId) };
        const cursor = await this.context.collection("bookings").find(query, {}).skip(skip).limit(take);
        return await cursor.toArray();
    }
}

module.exports = BookingRepository;

