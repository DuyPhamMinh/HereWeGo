var DatabaseConnection = require(global.__basedir + '/apps/Database/Database');
var Config = require(global.__basedir + "/config/config");
var BookingRepository = require(global.__basedir + "/apps/Repository/BookingRepository");
var TourRepository = require(global.__basedir + "/apps/Repository/TourRepository");

class BookingService {
    bookingRepository;
    tourRepository;
    session;
    client;
    database;

    constructor() {
        this.client = null;
        this.session = null;
        this.database = null;
        this.bookingRepository = null;
        this.tourRepository = null;
    }

    async connect() {
        this.client = DatabaseConnection.getMongoClient();
        await this.client.connect();
        this.database = this.client.db(Config.mongodb.database);
        this.session = this.client.startSession();
        this.session.startTransaction();
        this.bookingRepository = new BookingRepository(this.database, this.session);
        this.tourRepository = new TourRepository(this.database, this.session);
    }

    async insertBooking(booking) {
        try {
            await this.connect();
            
            // Verify tour exists
            if (booking.tour) {
                const tour = await this.tourRepository.getTour(booking.tour.toString());
                if (!tour) {
                    throw new Error("Tour not found");
                }
            }

            var result = await this.bookingRepository.insertBooking(booking);
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

    async deleteBooking(id) {
        try {
            await this.connect();
            var result = await this.bookingRepository.deleteBooking(id);
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

    async updateBooking(booking) {
        try {
            await this.connect();
            var result = await this.bookingRepository.updateBooking(booking);
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

    async getBooking(id) {
        try {
            await this.connect();
            var result = await this.bookingRepository.getBooking(id);
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

    async getBookingList(skip = 0, take = 100, query = {}) {
        try {
            await this.connect();
            var bookingList = await this.bookingRepository.getBookingList(skip, take, query);
            var total = await this.bookingRepository.countBookings(query);
            return {
                data: bookingList,
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

    async getBookingsByUser(userId, skip = 0, take = 100) {
        try {
            await this.connect();
            var bookingList = await this.bookingRepository.getBookingsByUser(userId, skip, take);
            return bookingList;
        } catch (error) {
            throw error;
        } finally {
            await this.session.endSession();
            if (this.client) {
                await this.client.close();
            }
        }
    }

    async getBookingsByTour(tourId, skip = 0, take = 100) {
        try {
            await this.connect();
            var bookingList = await this.bookingRepository.getBookingsByTour(tourId, skip, take);
            return bookingList;
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

module.exports = BookingService;

