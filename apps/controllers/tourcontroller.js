var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var Tour = require(__dirname + "/../model/Tour");
var Review = require(__dirname + "/../model/Review");

router.get("/", function (req, res) {
  res.render("tour.ejs");
});

// Get tour detail by ID
router.get("/:id", async function (req, res) {
  try {
    const tourId = req.params.id;
    const tour = await Tour.findById(tourId);
    
    if (!tour) {
      return res.status(404).render("404.ejs", {
        activePage: '404',
        error: "Tour not found"
      });
    }
    
    // Only show active tours to non-admin users
    if (!tour.isActive) {
      return res.status(404).render("404.ejs", {
        activePage: '404',
        error: "Tour not found"
      });
    }
    
    // Get related tours (same category, excluding current tour)
    const relatedTours = await Tour.find({
      category: tour.category,
      isActive: true,
      _id: { $ne: tourId }
    })
    .limit(3)
    .sort({ createdAt: -1 });
    
    // Get approved reviews for this tour
    // Convert tourId to ObjectId if it's a string
    const tourObjectId = mongoose.Types.ObjectId.isValid(tourId) 
      ? new mongoose.Types.ObjectId(tourId) 
      : tourId;
    
    const reviews = await Review.find({
      tour: tourObjectId,
      isApproved: true,
      isActive: true
    })
    .populate('user', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10); // Show latest 10 reviews
    
    // Calculate average rating
    const allReviews = await Review.find({
      tour: tourObjectId,
      isApproved: true,
      isActive: true
    });
    
    console.log(`Found ${allReviews.length} reviews for tour ${tourId}`); // Debug
    
    let averageRating = 5.0; // Default rating
    let totalReviews = allReviews.length;
    
    if (totalReviews > 0) {
      const sumRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (sumRating / totalReviews).toFixed(1);
    }
    
    // Calculate rating distribution
    const ratingDistribution = {
      5: allReviews.filter(r => r.rating === 5).length,
      4: allReviews.filter(r => r.rating === 4).length,
      3: allReviews.filter(r => r.rating === 3).length,
      2: allReviews.filter(r => r.rating === 2).length,
      1: allReviews.filter(r => r.rating === 1).length,
    };
    
    res.render("tour-detail.ejs", {
      activePage: 'tour',
      tour: tour,
      relatedTours: relatedTours,
      reviews: reviews,
      averageRating: averageRating,
      totalReviews: totalReviews,
      ratingDistribution: ratingDistribution,
      user: req.session.user || null
    });
  } catch (error) {
    console.error("Error loading tour detail:", error);
    res.status(500).render("404.ejs", {
      activePage: '404',
      error: "Error loading tour"
    });
  }
});

module.exports = router;

