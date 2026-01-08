var express = require("express");
var router = express.Router();
var Booking = require(global.__basedir + "/apps/model/Booking");
var Tour = require(global.__basedir + "/apps/model/Tour");
var User = require(global.__basedir + "/apps/model/User");
var verifyToken = require(global.__basedir + "/apps/Util/VerifyToken");

router.get("/", verifyToken, async function (req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const statusFilter = req.query.status || '';

        let query = {};

        if (!req.userData.roles.includes('admin')) {
            query.user = req.userData.userId;
        }

        if (search && req.userData.roles.includes('admin')) {
            query.$or = [
                { guestName: { $regex: search, $options: 'i' } },
                { guestEmail: { $regex: search, $options: 'i' } },
                { guestPhone: { $regex: search, $options: 'i' } }
            ];
        }
        if (statusFilter) {
            query.status = statusFilter;
        }

        const totalBookings = await Booking.countDocuments(query);

        const bookings = await Booking.find(query)
            .populate('user', 'firstName lastName email phone')
            .populate('tour', 'title destination image price discountPrice duration durationUnit')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const totalPages = Math.ceil(totalBookings / limit);

        res.json({
            success: true,
            data: bookings,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalBookings,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: error.message
        });
    }
});

router.get("/:id", verifyToken, async function (req, res) {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('user', 'firstName lastName email phone')
            .populate('tour', 'title destination image price discountPrice duration durationUnit');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const userId = booking.user && booking.user._id ? booking.user._id.toString() : booking.user ? booking.user.toString() : null;
        if (!req.userData.roles.includes('admin') && userId && userId !== req.userData.userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching booking",
            error: error.message
        });
    }
});

router.post("/", verifyToken, async function (req, res) {
    try {
        const {
            tourId,
            guestName,
            guestEmail,
            guestPhone,
            bookingDate,
            numberOfPersons,
            specialRequest
        } = req.body;

        if (!tourId) {
            return res.status(400).json({
                success: false,
                message: "Tour ID is required"
            });
        }

        const tour = await Tour.findById(tourId);
        if (!tour || !tour.isActive) {
            return res.status(404).json({
                success: false,
                message: "Tour not found or not available"
            });
        }

        if (!bookingDate) {
            return res.status(400).json({
                success: false,
                message: "Booking date is required"
            });
        }

        const selectedDate = new Date(bookingDate);
        if (selectedDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Booking date cannot be in the past"
            });
        }

        const persons = parseInt(numberOfPersons) || 1;
        if (persons < 1) {
            return res.status(400).json({
                success: false,
                message: "Number of persons must be at least 1"
            });
        }

        if (tour.maxPersons && persons > tour.maxPersons) {
            return res.status(400).json({
                success: false,
                message: `Maximum ${tour.maxPersons} persons allowed for this tour`
            });
        }

        const pricePerPerson = tour.discountPrice || tour.price;
        const totalPrice = pricePerPerson * persons;

        const user = await User.findById(req.userData.userId);
        const bookingGuestName = guestName || `${user.firstName} ${user.lastName}`;
        const bookingGuestEmail = guestEmail || user.email;
        const bookingGuestPhone = guestPhone || user.phone || '';

        const booking = new Booking({
            user: req.userData.userId,
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
        await booking.populate('tour', 'title destination');
        await booking.populate('user', 'firstName lastName email');

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: "Error creating booking",
            error: error.message
        });
    }
});

router.put("/:id", verifyToken, async function (req, res) {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const isAdmin = req.userData.roles.includes('admin');
        const isOwner = booking.user && booking.user.toString() === req.userData.userId;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const {
            guestName, guestEmail, guestPhone, bookingDate,
            numberOfPersons, totalPrice, specialRequest, notes,
            status, paymentStatus, paymentMethod
        } = req.body;

        if ((status || paymentStatus || paymentMethod) && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only admin can update status and payment information"
            });
        }

        if (guestName) booking.guestName = guestName;
        if (guestEmail) booking.guestEmail = guestEmail;
        if (guestPhone !== undefined) booking.guestPhone = guestPhone;
        if (bookingDate) booking.bookingDate = new Date(bookingDate);
        if (numberOfPersons) booking.numberOfPersons = parseInt(numberOfPersons);
        if (totalPrice && isAdmin) booking.totalPrice = parseFloat(totalPrice);
        if (specialRequest !== undefined) booking.specialRequest = specialRequest;
        if (notes !== undefined && isAdmin) booking.notes = notes;
        if (status && isAdmin) {
            if (['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
                booking.status = status;
            }
        }
        if (paymentStatus && isAdmin) {
            if (['pending', 'paid', 'refunded'].includes(paymentStatus)) {
                booking.paymentStatus = paymentStatus;
            }
        }
        if (paymentMethod && isAdmin) {
            if (['cash', 'card', 'bank_transfer', 'online'].includes(paymentMethod)) {
                booking.paymentMethod = paymentMethod;
            }
        }

        await booking.save();
        await booking.populate('tour', 'title destination');
        await booking.populate('user', 'firstName lastName email');

        res.json({
            success: true,
            message: "Booking updated successfully",
            data: booking
        });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({
            success: false,
            message: "Error updating booking",
            error: error.message
        });
    }
});

router.delete("/:id", verifyToken, async function (req, res) {
    try {
        if (!req.userData.roles.includes('admin')) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.json({
            success: true,
            message: "Booking deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting booking",
            error: error.message
        });
    }
});

module.exports = router;
