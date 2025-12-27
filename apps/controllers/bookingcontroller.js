var express = require("express");
var router = express.Router();
var { isAuthenticated } = require(__dirname + "/../middleware/auth");
var Tour = require(__dirname + "/../model/Tour");
var Booking = require(__dirname + "/../model/Booking");
var User = require(__dirname + "/../model/User");
var vnpay = require(__dirname + "/../Util/vnpay");

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

// View invoice for paid booking (requires authentication)
router.get("/invoice/:id", isAuthenticated, async function (req, res) {
  try {
    const bookingId = req.params.id;
    const userId = req.session.user.id;
    
    const booking = await Booking.findById(bookingId)
      .populate('user', 'firstName lastName email phone')
      .populate('tour', 'title destination image price discountPrice duration durationUnit');
    
    if (!booking) {
      return res.status(404).render("404.ejs", {
        activePage: '404',
        error: "Hóa đơn không tồn tại"
      });
    }
    
    // Check if user owns this booking
    const bookingUserId = booking.user && booking.user._id ? booking.user._id.toString() : booking.user ? booking.user.toString() : null;
    if (bookingUserId !== userId) {
      return res.status(403).render("404.ejs", {
        activePage: '404',
        error: "Bạn không có quyền xem hóa đơn này"
      });
    }
    
    // Only show invoice for paid bookings
    if (booking.paymentStatus !== 'paid') {
      return res.status(403).render("404.ejs", {
        activePage: '404',
        error: "Hóa đơn chỉ có sẵn cho các booking đã thanh toán"
      });
    }
    
    res.render("invoice.ejs", {
      activePage: 'invoice',
      booking: booking,
      user: req.session.user
    });
  } catch (error) {
    console.error("Error loading invoice:", error);
    res.status(500).render("404.ejs", {
      activePage: '404',
      error: "Lỗi khi tải hóa đơn"
    });
  }
});

// Create VNPay payment URL for a booking
router.post("/:id/payment/vnpay", async function (req, res) {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId).populate('tour', 'title destination');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    
    // Check if booking is already paid
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: "This booking has already been paid"
      });
    }
    
    // Convert USD to VND
    const amountVnd = vnpay.usdToVnd(booking.totalPrice);
    
    // Create order ID (using booking ID)
    const orderId = booking._id.toString();
    
    // Create order description
    const orderDescription = `Thanh toan don dat tour: ${booking.tour.title || 'Tour'}`;
    
    // Get IP address
    const ipAddr = vnpay.getIpAddress(req);
    
    // Create payment URL
    const paymentUrl = vnpay.createPaymentUrl({
      orderId: orderId,
      amount: amountVnd,
      orderDescription: orderDescription,
      ipAddr: ipAddr
    });
    
    // Update booking with VNPay transaction info
    booking.vnpayTxnRef = orderId;
    booking.vnpayAmount = amountVnd;
    booking.paymentMethod = 'vnpay';
    await booking.save();
    
    res.json({
      success: true,
      paymentUrl: paymentUrl,
      message: "Payment URL created successfully"
    });
  } catch (error) {
    console.error("Error creating VNPay payment URL:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment URL",
      error: error.message
    });
  }
});

// VNPay return URL (callback after payment)
router.get("/vnpay-return", async function (req, res) {
  try {
    const vnp_Params = req.query;
    
    // Verify signature
    const isValid = vnpay.verifyReturnUrl(vnp_Params);
    
    if (!isValid) {
      return res.render("payment-result.ejs", {
        activePage: 'booking',
        success: false,
        message: "Invalid payment signature",
        booking: null,
        user: req.session.user || null
      });
    }
    
    // Get booking ID from vnp_TxnRef
    const bookingId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const transactionNo = vnp_Params['vnp_TransactionNo'];
    const amount = parseInt(vnp_Params['vnp_Amount']) / 100; // VNPay trả về số tiền nhân 100
    
    // Find booking
    const booking = await Booking.findById(bookingId).populate('tour', 'title destination');
    
    if (!booking) {
      return res.render("payment-result.ejs", {
        activePage: 'booking',
        success: false,
        message: "Booking not found",
        booking: null,
        user: req.session.user || null
      });
    }
    
    // Update booking with VNPay response
    booking.vnpayResponseCode = responseCode;
    booking.vnpayTransactionNo = transactionNo;
    booking.vnpayTransactionId = transactionNo;
    
    // Check payment result
    // Response code '00' means success
    if (responseCode === '00') {
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      booking.paymentMethod = 'vnpay';
      
      await booking.save();
      
      return res.render("payment-result.ejs", {
        activePage: 'booking',
        success: true,
        message: "Payment successful! Your booking has been confirmed.",
        booking: booking,
        user: req.session.user || null
      });
    } else {
      // Payment failed
      booking.paymentStatus = 'pending';
      await booking.save();
      
      let errorMessage = "Payment failed";
      switch (responseCode) {
        case '07':
          errorMessage = "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).";
          break;
        case '09':
          errorMessage = "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking";
          break;
        case '10':
          errorMessage = "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần";
          break;
        case '11':
          errorMessage = "Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.";
          break;
        case '12':
          errorMessage = "Thẻ/Tài khoản bị khóa.";
          break;
        case '51':
          errorMessage = "Tài khoản không đủ số dư để thực hiện giao dịch.";
          break;
        case '65':
          errorMessage = "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.";
          break;
        case '75':
          errorMessage = "Ngân hàng thanh toán đang bảo trì.";
          break;
        case '79':
          errorMessage = "Nhập sai mật khẩu thanh toán quá số lần quy định.";
          break;
        default:
          errorMessage = `Payment failed with code: ${responseCode}`;
      }
      
      return res.render("payment-result.ejs", {
        activePage: 'booking',
        success: false,
        message: errorMessage,
        booking: booking,
        user: req.session.user || null
      });
    }
  } catch (error) {
    console.error("Error processing VNPay return:", error);
    res.render("payment-result.ejs", {
      activePage: 'booking',
      success: false,
      message: "Error processing payment result",
      booking: null,
      user: req.session.user || null
    });
  }
});

module.exports = router;

