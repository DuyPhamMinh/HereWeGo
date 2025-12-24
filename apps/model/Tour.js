const mongoose = require("mongoose");

const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tour title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Tour description is required"],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 day"],
    },
    durationUnit: {
      type: String,
      enum: ["days", "hours"],
      default: "days",
    },
    maxPersons: {
      type: Number,
      default: 2,
      min: [1, "Max persons must be at least 1"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
    },
    image: {
      type: String,
      default: "/static/img/packages-1.jpg",
    },
    images: [{
      type: String,
    }],
    category: {
      type: String,
      enum: ["adventure", "beach", "cultural", "mountain", "city", "nature", "other"],
      default: "other",
    },
    rating: {
      type: Number,
      default: 5,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    highlights: [{
      type: String,
    }],
    itinerary: [{
      day: Number,
      title: String,
      description: String,
    }],
    includes: [{
      type: String,
    }],
    excludes: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Index for search
tourSchema.index({ title: 'text', description: 'text', destination: 'text' });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

