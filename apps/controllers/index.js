var express = require("express");
var router = express.Router();

// Main routes
router.get("/", function (req, res) {
  res.render("index.ejs");
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
