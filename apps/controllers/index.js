var express = require("express");
var router = express.Router();

// Main routes
router.get("/", async function (req, res) {
  try {
    const Tour = require(__dirname + "/../model/Tour");
    // Get featured tours for homepage
    const featuredTours = await Tour.find({ isActive: true, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(6);
    
    // If no featured tours, get active tours
    const tours = featuredTours.length > 0 
      ? featuredTours 
      : await Tour.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(6);
    
    res.render("index.ejs", { tours: tours });
  } catch (error) {
    console.error("Error loading tours:", error);
    res.render("index.ejs", { tours: [] });
  }
});

// Page routes
router.use("/about", require(__dirname + "/aboutcontroller"));
router.use("/services", require(__dirname + "/servicecontroller"));
router.use("/packages", require(__dirname + "/packagescontroller"));
router.use("/blog", require(__dirname + "/blogcontroller"));
router.use("/contact", require(__dirname + "/contactcontroller"));
router.use("/destination", require(__dirname + "/destinationcontroller"));
router.use("/tour", require(__dirname + "/tourcontroller"));
router.use("/booking", require(__dirname + "/bookingcontroller"));
router.use("/gallery", require(__dirname + "/gallerycontroller"));
router.use("/guides", require(__dirname + "/guidescontroller"));
router.use("/testimonial", require(__dirname + "/testimonialcontroller"));
router.use("/404", require(__dirname + "/errorcontroller"));
router.use("/login", require(__dirname + "/logincontroller"));
router.use("/register", require(__dirname + "/registercontroller"));
router.use("/admin", require(__dirname + "/admincontroller"));
router.use("/logout", require(__dirname + "/logoutcontroller"));
router.use("/profile", require(__dirname + "/profilecontroller"));

module.exports = router;
