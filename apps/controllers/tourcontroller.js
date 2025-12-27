var express = require("express");
var router = express.Router();
var Tour = require(__dirname + "/../model/Tour");

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
    
    res.render("tour-detail.ejs", {
      activePage: 'tour',
      tour: tour,
      relatedTours: relatedTours,
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

