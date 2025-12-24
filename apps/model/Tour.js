const mongoose = require("mongoose");

const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "Untitled Tour",
    },
    description: {
      type: String,
      default: "",
    },
    shortDescription: {
      type: String,
    },
    destination: {
      type: String,
      trim: true,
      default: "Unknown",
    },
    duration: {
      type: Number,
      default: 1,
    },
    durationUnit: {
      type: String,
      trim: true,
      default: "days",
    },
    maxPersons: {
      type: Number,
      default: 10,
    },
    price: {
      type: Number,
      default: 0,
    },
    discountPrice: {
      type: Number,
    },
    image: {
      type: String,
      default: "/static/img/packages-1.jpg",
    },
    category: {
      type: String,
      trim: true,
      default: "National",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    highlights: [String],
    includes: [String],
    excludes: [String],
    itinerary: [
      {
        day: { type: Number },
        title: { type: String },
        description: { type: String },
      },
    ],
    rating: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search functionality
tourSchema.index({ title: "text", description: "text", destination: "text", category: "text" });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

