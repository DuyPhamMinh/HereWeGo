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
    category;
    isActive;
    isFeatured;
    highlights;
    includes;
    excludes;
    itinerary;
    rating;
    createdAt;
    updatedAt;

    constructor() {
        this.highlights = [];
        this.includes = [];
        this.excludes = [];
        this.itinerary = [];
        this.isActive = true;
        this.isFeatured = false;
        this.rating = 5;
        this.durationUnit = "days";
    }
}

module.exports = Tour;

