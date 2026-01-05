var DatabaseConnection = require(global.__basedir + '/apps/Database/Database');
var Config = require(global.__basedir + "/config/config");
var TourRepository = require(global.__basedir + "/apps/Repository/TourRepository");
var CategoryRepository = require(global.__basedir + "/apps/Repository/CategoryRepository");

class TourService {
    tourRepository;
    categoryRepository;
    session;
    client;
    database;

    constructor() {
        this.client = null;
        this.session = null;
        this.database = null;
        this.tourRepository = null;
        this.categoryRepository = null;
    }

    async connect() {
        this.client = DatabaseConnection.getMongoClient();
        await this.client.connect();
        this.database = this.client.db(Config.mongodb.database);
        this.session = this.client.startSession();
        this.session.startTransaction();
        this.tourRepository = new TourRepository(this.database, this.session);
        this.categoryRepository = new CategoryRepository(this.database, this.session);
    }

    async insertTour(tour, category = null) {
        try {
            await this.connect();
            
            var categoryResult = null;
            if (category) {
                categoryResult = await this.categoryRepository.insertCategory(category);
                tour.categoryId = categoryResult.insertedId;
            }

            var result = await this.tourRepository.insertTour(tour);
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

    async deleteTour(id) {
        try {
            await this.connect();
            var result = await this.tourRepository.deleteTour(id);
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

    async updateTour(tour) {
        try {
            await this.connect();
            var result = await this.tourRepository.updateTour(tour);
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

    async getTour(id) {
        try {
            await this.connect();
            var result = await this.tourRepository.getTour(id);
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

    async getTourList(skip = 0, take = 100, query = {}) {
        try {
            await this.connect();
            var tourList = await this.tourRepository.getTourList(skip, take, query);
            var total = await this.tourRepository.countTours(query);
            return {
                data: tourList,
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

module.exports = TourService;

