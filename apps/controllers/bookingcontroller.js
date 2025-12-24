var express = require("express");
var router = express.Router();
var { isAuthenticated } = require(__dirname + "/../middleware/auth");
var Tour = require(__dirname + "/../model/Tour");
var Booking = require(__dirname + "/../model/Booking");
var User = require(__dirname + "/../model/User");

// Get booking page with optional tour ID
router.get("/", async function (req, res) {
  try {
    const tourId = req.query.tour;
    let tour = null;
    
    if (tourId) {
      tour = await Tour.findById(tourId);
      if (!tour || !tour.isActive) {
        return res.render("booking.ejs", {
          activePage: 'booking',
          tour: null,
          error: "Tour not found or not available",
          user: req.session.user || null
        });
      }
    }
    
    // Get all active tours for dropdown
    const tours = await Tour.find({ isActive: true })
      .select('title destination price discountPrice')
      .sort({ title: 1 });
    
    res.render("booking.ejs", {
      activePage: 'booking',
      tour: tour,
      tours: tours,
      user: req.session.user || null,
      error: null,
      success: null
    });
  } catch (error) {
    console.error("Error loading booking page:", error);
    res.render("booking.ejs", {
      activePage: 'booking',
      tour: null,
      tours: [],
      user: req.session.user || null,
      error: "Error loading booking page",
      success: null
    });
  }
});

// Create booking
router.post("/", async function (req, res) {
  try {
    let { 
      tourId, 
      guestName, 
      guestEmail, 
      guestPhone, 
      bookingDate, 
      numberOfPersons, 
      specialRequest 
    } = req.body;
    
    // Handle tourId if it's an array (shouldn't happen, but just in case)
    if (Array.isArray(tourId)) {
      tourId = tourId[0]; // Take the first value
    }
    
    // Convert to string if it's an object
    if (tourId && typeof tourId === 'object') {
      tourId = tourId.toString();
    }
    
    // Validation
    if (!tourId) {
      return res.render("booking.ejs", {
        activePage: 'booking',
        tour: null,
        tours: await Tour.find({ isActive: true }).select('title destination price discountPrice').sort({ title: 1 }),
        user: req.session.user || null,
        error: "Please select a tour",
        success: null,
        formData: req.body
      });
    }
    
    // Get tour
    const tour = await Tour.findById(tourId);
    if (!tour || !tour.isActive) {
      return res.render("booking.ejs", {
        activePage: 'booking',
        tour: null,
        tours: await Tour.find({ isActive: true }).select('title destination price discountPrice').sort({ title: 1 }),
        user: req.session.user || null,
        error: "Tour not found or not available",
        success: null,
        formData: req.body
      });
    }
    
    // Validate booking date
    if (!bookingDate) {
      return res.render("booking.ejs", {
        activePage: 'booking',
        tour: tour,
        tours: await Tour.find({ isActive: true }).select('title destination price discountPrice').sort({ title: 1 }),
        user: req.session.user || null,
        error: "Please select a booking date",
        success: null,
        formData: req.body
      });
    }
    
    const selectedDate = new Date(bookingDate);
    if (selectedDate < new Date()) {
      return res.render("booking.ejs", {
        activePage: 'booking',
        tour: tour,
        tours: await Tour.find({ isActive: true }).select('title destination price discountPrice').sort({ title: 1 }),
        user: req.session.user || null,
        error: "Booking date cannot be in the past",
        success: null,
        formData: req.body
      });
    }
    
    // Validate number of persons
    const persons = parseInt(numberOfPersons) || 1;
    if (persons < 1) {
      return res.render("booking.ejs", {
        activePage: 'booking',
        tour: tour,
        tours: await Tour.find({ isActive: true }).select('title destination price discountPrice').sort({ title: 1 }),
        user: req.session.user || null,
        error: "Number of persons must be at least 1",
        success: null,
        formData: req.body
      });
    }
    
    if (tour.maxPersons && persons > tour.maxPersons) {
      return res.render("booking.ejs", {
        activePage: 'booking',
        tour: tour,
        tours: await Tour.find({ isActive: true }).select('title destination price discountPrice').sort({ title: 1 }),
        user: req.session.user || null,
        error: `Maximum ${tour.maxPersons} persons allowed for this tour`,
        success: null,
        formData: req.body
      });
    }
    
    // Calculate total price
    const pricePerPerson = tour.discountPrice || tour.price;
    const totalPrice = pricePerPerson * persons;
    
    // Get user info
    let userId = null;
    let bookingGuestName = guestName;
    let bookingGuestEmail = guestEmail;
    let bookingGuestPhone = guestPhone;
    
    if (req.session && req.session.user) {
      userId = req.session.user.id;
      const user = await User.findById(userId);
      if (user) {
        bookingGuestName = bookingGuestName || `${user.firstName} ${user.lastName}`;
        bookingGuestEmail = bookingGuestEmail || user.email;
        bookingGuestPhone = bookingGuestPhone || user.phone || '';
      }
    } else {
      // For guest bookings, require name and email
      if (!bookingGuestName || !bookingGuestEmail) {
        return res.render("booking.ejs", {
          activePage: 'booking',
          tour: tour,
          tours: await Tour.find({ isActive: true }).select('title destination price discountPrice').sort({ title: 1 }),
          user: null,
          error: "Please provide your name and email, or login to continue",
          success: null,
          formData: req.body
        });
      }
    }
    
    // Create booking
    const booking = new Booking({
      user: userId,
      tour: tourId,
      guestName: bookingGuestName,
      guestEmail: bookingGuestEmail,
      guestPhone: bookingGuestPhone || undefined,
      bookingDate: selectedDate,
      numberOfPersons: persons,
      totalPrice: totalPrice,
      specialRequest: specialRequest || undefined,
      status: "pending",
      paymentStatus: "pending"
    });
    
    await booking.save();
    
    // Populate tour info for success message
    await booking.populate('tour', 'title destination');
    
    res.render("booking.ejs", {
      activePage: 'booking',
      tour: null,
      tours: await Tour.find({ isActive: true }).select('title destination price discountPrice').sort({ title: 1 }),
      user: req.session.user || null,
      error: null,
      success: `Booking created successfully! Booking ID: ${booking._id.toString().substring(18, 24)}. We will contact you soon.`,
      booking: booking
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.render("booking.ejs", {
      activePage: 'booking',
      tour: null,
      tours: await Tour.find({ isActive: true }).select('title destination price discountPrice').sort({ title: 1 }),
      user: req.session.user || null,
      error: error.message || "An error occurred while creating booking",
      success: null,
      formData: req.body
    });
  }
});

// Get user's bookings (requires authentication)
router.get("/my-bookings", isAuthenticated, async function (req, res) {
  try {
    const userId = req.session.user.id;
    const bookings = await Booking.find({ user: userId })
      .populate('tour', 'title destination image price discountPrice duration durationUnit')
      .sort({ createdAt: -1 });
    
    res.render("my-bookings.ejs", {
      activePage: 'my-bookings',
      bookings: bookings,
      user: req.session.user
    });
  } catch (error) {
    console.error("Error loading bookings:", error);
    res.render("my-bookings.ejs", {
      activePage: 'my-bookings',
      bookings: [],
      user: req.session.user,
      error: "Error loading bookings"
    });
  }
});

module.exports = router;

