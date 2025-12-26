var express = require("express");
var router = express.Router();

// API Routes
router.use("/auth", require("./authRoutes"));
router.use("/tours", require("./tourRoutes"));
router.use("/bookings", require("./bookingRoutes"));
router.use("/users", require("./userRoutes"));

// API health check
router.get("/", function (req, res) {
    res.json({
        success: true,
        message: "RESTful API is running",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            tours: "/api/tours",
            bookings: "/api/bookings",
            users: "/api/users"
        }
    });
});

module.exports = router;
