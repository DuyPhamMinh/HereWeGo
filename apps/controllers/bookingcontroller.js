var express = require("express");
var router = express.Router();
var { isAuthenticated } = require(__dirname + "/../middleware/auth");
var Tour = require(__dirname + "/../model/Tour");
var Booking = require(__dirname + "/../model/Booking");
var User = require(__dirname + "/../model/User");
var Review = require(__dirname + "/../model/Review");
var vnpay = require(__dirname + "/../Util/vnpay");
var { sanitizeText } = require(__dirname + "/../util/profanityFilter");

router.get("/", async function (req, res) {
  try {
    const tourId = req.query.tour;
    let tour = null;

    if (tourId) {
      tour = await Tour.findById(tourId);
      if (!tour || !tour.isActive) {
        return res.render("booking.ejs", {
          activePage: "booking",
          tour: null,
          error: "Tour not found or not available",
          user: req.session.user || null,
        });
      }
      if (tour.availableDates && tour.availableDates.length > 0) {
        tour.availableDates = tour.availableDates.filter(date => new Date(date) >= new Date()).sort((a, b) => new Date(a) - new Date(b));
      }
    }

    const tours = await Tour.find({ isActive: true })
      .select("title destination price discountPrice")
      .sort({ title: 1 });

    res.render("booking.ejs", {
      activePage: "booking",
      tour: tour,
      tours: tours,
      user: req.session.user || null,
      error: null,
      success: null,
    });
  } catch (error) {
    console.error("Error loading booking page:", error);
    res.render("booking.ejs", {
      activePage: "booking",
      tour: null,
      tours: [],
      user: req.session.user || null,
      error: "Error loading booking page",
      success: null,
    });
  }
});

router.post("/", async function (req, res) {
  try {
    let {
      tourId,
      guestName,
      guestEmail,
      guestPhone,
      bookingDate,
      numberOfPersons,
      specialRequest,
    } = req.body;

    if (Array.isArray(tourId)) {
      tourId = tourId[0];
    }

    if (tourId && typeof tourId === "object") {
      tourId = tourId.toString();
    }

    if (!tourId) {
      return res.render("booking.ejs", {
        activePage: "booking",
        tour: null,
        tours: await Tour.find({ isActive: true })
          .select("title destination price discountPrice")
          .sort({ title: 1 }),
        user: req.session.user || null,
        error: "Please select a tour",
        success: null,
        formData: req.body,
      });
    }

    const tour = await Tour.findById(tourId);
    if (!tour || !tour.isActive) {
      return res.render("booking.ejs", {
        activePage: "booking",
        tour: null,
        tours: await Tour.find({ isActive: true })
          .select("title destination price discountPrice")
          .sort({ title: 1 }),
        user: req.session.user || null,
        error: "Tour not found or not available",
        success: null,
        formData: req.body,
      });
    }

    if (!bookingDate) {
      return res.render("booking.ejs", {
        activePage: "booking",
        tour: tour,
        tours: await Tour.find({ isActive: true })
          .select("title destination price discountPrice")
          .sort({ title: 1 }),
        user: req.session.user || null,
        error: "Vui lòng chọn ngày khởi hành",
        success: null,
        formData: req.body,
      });
    }

    if (!tour.availableDates || tour.availableDates.length === 0) {
      return res.render("booking.ejs", {
        activePage: "booking",
        tour: tour,
        tours: await Tour.find({ isActive: true })
          .select("title destination price discountPrice")
          .sort({ title: 1 }),
        user: req.session.user || null,
        error: "Tour này chưa có lịch khởi hành. Vui lòng liên hệ hotline để đặt tour.",
        success: null,
        formData: req.body,
      });
    }

    const selectedDate = new Date(bookingDate);
    if (selectedDate < new Date()) {
      return res.render("booking.ejs", {
        activePage: "booking",
        tour: tour,
        tours: await Tour.find({ isActive: true })
          .select("title destination price discountPrice")
          .sort({ title: 1 }),
        user: req.session.user || null,
        error: "Ngày đặt tour không thể là ngày trong quá khứ",
        success: null,
        formData: req.body,
      });
    }

    if (tour.availableDates && tour.availableDates.length > 0) {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const availableDateStrs = tour.availableDates.map(d => new Date(d).toISOString().split('T')[0]);
      if (!availableDateStrs.includes(selectedDateStr)) {
        return res.render("booking.ejs", {
          activePage: "booking",
          tour: tour,
          tours: await Tour.find({ isActive: true })
            .select("title destination price discountPrice")
            .sort({ title: 1 }),
          user: req.session.user || null,
          error: "Ngày bạn chọn không có trong lịch khởi hành. Vui lòng chọn ngày khác.",
          success: null,
          formData: req.body,
        });
      }
    }

    const persons = parseInt(numberOfPersons) || 1;
    if (persons < 1) {
      return res.render("booking.ejs", {
        activePage: "booking",
        tour: tour,
        tours: await Tour.find({ isActive: true })
          .select("title destination price discountPrice")
          .sort({ title: 1 }),
        user: req.session.user || null,
        error: "Number of persons must be at least 1",
        success: null,
        formData: req.body,
      });
    }

    if (tour.maxPersons && persons > tour.maxPersons) {
      return res.render("booking.ejs", {
        activePage: "booking",
        tour: tour,
        tours: await Tour.find({ isActive: true })
          .select("title destination price discountPrice")
          .sort({ title: 1 }),
        user: req.session.user || null,
        error: `Maximum ${tour.maxPersons} persons allowed for this tour`,
        success: null,
        formData: req.body,
      });
    }

    const pricePerPerson = tour.discountPrice || tour.price;
    const totalPrice = pricePerPerson * persons;

    let userId = null;
    let bookingGuestName = guestName;
    let bookingGuestEmail = guestEmail;
    let bookingGuestPhone = guestPhone;

    if (req.session && req.session.user) {
      userId = req.session.user.id;
      const user = await User.findById(userId);
      if (user) {
        bookingGuestName =
          bookingGuestName || `${user.firstName} ${user.lastName}`;
        bookingGuestEmail = bookingGuestEmail || user.email;
        bookingGuestPhone = bookingGuestPhone || user.phone || "";
      }
    } else {

      if (!bookingGuestName || !bookingGuestEmail) {
        return res.render("booking.ejs", {
          activePage: "booking",
          tour: tour,
          tours: await Tour.find({ isActive: true })
            .select("title destination price discountPrice")
            .sort({ title: 1 }),
          user: null,
          error: "Please provide your name and email, or login to continue",
          success: null,
          formData: req.body,
        });
      }
    }

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
      paymentStatus: "pending",
    });

    await booking.save();

    await booking.populate("tour", "title destination");

    res.render("booking.ejs", {
      activePage: "booking",
      tour: null,
      tours: await Tour.find({ isActive: true })
        .select("title destination price discountPrice")
        .sort({ title: 1 }),
      user: req.session.user || null,
      error: null,
      success: `Booking created successfully! Booking ID: ${booking._id
        .toString()
        .substring(18, 24)}. We will contact you soon.`,
      booking: booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.render("booking.ejs", {
      activePage: "booking",
      tour: null,
      tours: await Tour.find({ isActive: true })
        .select("title destination price discountPrice")
        .sort({ title: 1 }),
      user: req.session.user || null,
      error: error.message || "An error occurred while creating booking",
      success: null,
      formData: req.body,
    });
  }
});

router.get("/my-bookings", isAuthenticated, async function (req, res) {
  try {
    const userId = req.session.user.id;
    const bookings = await Booking.find({ user: userId })
      .populate(
        "tour",
        "title destination image price discountPrice duration durationUnit"
      )
      .sort({ createdAt: -1 });

    const bookingsWithReviews = await Promise.all(
      bookings.map(async (booking) => {
        const bookingObj = booking.toObject();
        const review = await Review.findOne({
          booking: booking._id,
          user: userId,
          isActive: true,
        });
        bookingObj.review = review;
        return bookingObj;
      })
    );

    res.render("my-bookings.ejs", {
      activePage: "my-bookings",
      bookings: bookingsWithReviews,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error loading bookings:", error);
    res.render("my-bookings.ejs", {
      activePage: "my-bookings",
      bookings: [],
      user: req.session.user,
      error: "Error loading bookings",
    });
  }
});

router.post("/:id/review", isAuthenticated, async function (req, res) {
  try {
    const bookingId = req.params.id;
    const userId = req.session.user.id;
    const { rating, title, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: "Comment is required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only review your own bookings" });
    }

    if (booking.status !== "completed" && booking.paymentStatus !== "paid") {
      return res.status(400).json({
        error: "You can only review completed or paid bookings"
      });
    }

    const existingReview = await Review.findOne({
      booking: bookingId,
      user: userId,
    });

    const titleText = title ? title.trim() : "";
    const commentText = comment.trim();

    const sanitizedTitle = sanitizeText(titleText);
    const sanitizedComment = sanitizeText(commentText);

    if (sanitizedTitle.hasProfanity || sanitizedComment.hasProfanity) {
      return res.status(400).json({
        error: "Đánh giá của bạn chứa từ ngữ không phù hợp. Vui lòng chỉnh sửa lại."
      });
    }

    if (existingReview) {

      existingReview.rating = rating;
      existingReview.title = sanitizedTitle.sanitized;
      existingReview.comment = sanitizedComment.sanitized;
      existingReview.isApproved = true;
      await existingReview.save();

      return res.json({
        success: true,
        message: "Đánh giá đã được cập nhật",
        review: existingReview,
      });
    }

    const review = new Review({
      booking: bookingId,
      tour: booking.tour,
      user: userId,
      rating: parseInt(rating),
      title: sanitizedTitle.sanitized,
      comment: sanitizedComment.sanitized,
      isApproved: true,
      isActive: true,
    });

    await review.save();

    res.json({
      success: true,
      message: "Đánh giá đã được gửi thành công",
      review: review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    if (error.code === 11000) {

      return res.status(400).json({ error: "Bạn đã đánh giá booking này rồi" });
    }
    res.status(500).json({ error: "Có lỗi xảy ra khi tạo đánh giá" });
  }
});

router.get("/:id/review", isAuthenticated, async function (req, res) {
  try {
    const bookingId = req.params.id;
    const userId = req.session.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    const review = await Review.findOne({
      booking: bookingId,
      user: userId,
    });

    res.json({
      success: true,
      review: review || null,
    });
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Có lỗi xảy ra khi tải đánh giá" });
  }
});

router.get("/invoice/:id", isAuthenticated, async function (req, res) {
  try {
    const bookingId = req.params.id;
    const userId = req.session.user.id;

    const booking = await Booking.findById(bookingId)
      .populate("user", "firstName lastName email phone")
      .populate(
        "tour",
        "title destination image price discountPrice duration durationUnit"
      );

    if (!booking) {
      return res.status(404).render("404.ejs", {
        activePage: "404",
        error: "Hóa đơn không tồn tại",
      });
    }

    const bookingUserId =
      booking.user && booking.user._id
        ? booking.user._id.toString()
        : booking.user
        ? booking.user.toString()
        : null;
    if (bookingUserId !== userId) {
      return res.status(403).render("404.ejs", {
        activePage: "404",
        error: "Bạn không có quyền xem hóa đơn này",
      });
    }

    if (booking.paymentStatus !== "paid") {
      return res.status(403).render("404.ejs", {
        activePage: "404",
        error: "Hóa đơn chỉ có sẵn cho các booking đã thanh toán",
      });
    }

    res.render("invoice.ejs", {
      activePage: "invoice",
      booking: booking,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error loading invoice:", error);
    res.status(500).render("404.ejs", {
      activePage: "404",
      error: "Lỗi khi tải hóa đơn",
    });
  }
});

router.post("/:id/payment/vnpay", async function (req, res) {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId).populate(
      "tour",
      "title destination"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This booking has already been paid",
      });
    }

    const amountVnd = vnpay.usdToVnd(booking.totalPrice);

    const orderId = booking._id.toString();

    const orderDescription = `Thanh toan don dat tour: ${
      booking.tour.title || "Tour"
    }`;

    const ipAddr = vnpay.getIpAddress(req);

    const paymentUrl = vnpay.createPaymentUrl({
      orderId: orderId,
      amount: amountVnd,
      orderDescription: orderDescription,
      ipAddr: ipAddr,
    });

    booking.vnpayTxnRef = orderId;
    booking.vnpayAmount = amountVnd;
    booking.paymentMethod = "vnpay";
    await booking.save();

    res.json({
      success: true,
      paymentUrl: paymentUrl,
      message: "Payment URL created successfully",
    });
  } catch (error) {
    console.error("Error creating VNPay payment URL:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment URL",
      error: error.message,
    });
  }
});

router.get("/vnpay-return", async function (req, res) {
  try {
    const vnp_Params = req.query;

    const isValid = vnpay.verifyReturnUrl(vnp_Params);

    if (!isValid) {
      return res.render("payment-result.ejs", {
        activePage: "booking",
        success: false,
        message: "Invalid payment signature",
        booking: null,
        user: req.session.user || null,
      });
    }

    const bookingId = vnp_Params["vnp_TxnRef"];
    const responseCode = vnp_Params["vnp_ResponseCode"];
    const transactionNo = vnp_Params["vnp_TransactionNo"];
    const amount = parseInt(vnp_Params["vnp_Amount"]) / 100;

    const booking = await Booking.findById(bookingId).populate(
      "tour",
      "title destination"
    );

    if (!booking) {
      return res.render("payment-result.ejs", {
        activePage: "booking",
        success: false,
        message: "Booking not found",
        booking: null,
        user: req.session.user || null,
      });
    }

    booking.vnpayResponseCode = responseCode;
    booking.vnpayTransactionNo = transactionNo;
    booking.vnpayTransactionId = transactionNo;

    if (responseCode === "00") {
      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      booking.paymentMethod = "vnpay";

      await booking.save();

      return res.render("payment-result.ejs", {
        activePage: "booking",
        success: true,
        message: "Payment successful! Your booking has been confirmed.",
        booking: booking,
        user: req.session.user || null,
      });
    } else {

      booking.paymentStatus = "pending";
      await booking.save();

      let errorMessage = "Payment failed";
      switch (responseCode) {
        case "07":
          errorMessage =
            "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).";
          break;
        case "09":
          errorMessage = "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking";
          break;
        case "10":
          errorMessage =
            "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần";
          break;
        case "11":
          errorMessage =
            "Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.";
          break;
        case "12":
          errorMessage = "Thẻ/Tài khoản bị khóa.";
          break;
        case "51":
          errorMessage = "Tài khoản không đủ số dư để thực hiện giao dịch.";
          break;
        case "65":
          errorMessage = "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.";
          break;
        case "75":
          errorMessage = "Ngân hàng thanh toán đang bảo trì.";
          break;
        case "79":
          errorMessage = "Nhập sai mật khẩu thanh toán quá số lần quy định.";
          break;
        default:
          errorMessage = `Payment failed with code: ${responseCode}`;
      }

      return res.render("payment-result.ejs", {
        activePage: "booking",
        success: false,
        message: errorMessage,
        booking: booking,
        user: req.session.user || null,
      });
    }
  } catch (error) {
    console.error("Error processing VNPay return:", error);
    res.render("payment-result.ejs", {
      activePage: "booking",
      success: false,
      message: "Error processing payment result",
      booking: null,
      user: req.session.user || null,
    });
  }
});

module.exports = router;
