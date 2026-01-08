class Tour {
    _id;
    title;
    description;
    shortDescription;
    destination;
    duration;
    durationUnit;
    maxPersons;
    price;
    discountPrice;
    image;
    images;
    category;
    isActive;
    isFeatured;
    highlights;
    includes;
    excludes;
    itinerary;
    availableDates;
    rating;
    createdAt;
    updatedAt;

    constructor() {
        this.highlights = [];
        this.includes = [];
        this.excludes = [];
        this.itinerary = [];
        this.images = [];
        this.availableDates = [];
        this.isActive = true;
        this.isFeatured = false;
        this.rating = 5;
        this.durationUnit = "days";
    }
}

module.exports = Tour;

