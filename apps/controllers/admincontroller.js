var express = require("express");
var router = express.Router();
var { isAuthenticated, isAdmin } = require(__dirname + "/../middleware/auth");
var User = require(__dirname + "/../model/User");
var Tour = require(__dirname + "/../model/Tour");
var Review = require(__dirname + "/../model/Review");
var Booking = require(__dirname + "/../model/Booking");

router.use(isAuthenticated);
router.use(isAdmin);

router.get("/", async function (req, res) {
  try {

    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.render("admin/dashboard.ejs", {
      activePage: 'dashboard',
      totalUsers: totalUsers,
      totalAdmins: totalAdmins,
      totalRegularUsers: totalRegularUsers,
      newUsersThisMonth: newUsersThisMonth
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.render("admin/dashboard.ejs", {
      activePage: 'dashboard',
      totalUsers: 0,
      totalAdmins: 0,
      totalRegularUsers: 0,
      newUsersThisMonth: 0
    });
  }
});

router.get("/transactions", function (req, res) {
  res.render("admin/transactions.ejs", { activePage: 'transactions' });
});

router.get("/chats", async function (req, res) {
  try {
    const { Conversation, Message } = require(__dirname + "/../model/Chat");
    const User = require(__dirname + "/../model/User");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const statusFilter = req.query.status || '';

    let query = { isActive: statusFilter !== 'inactive' };
    if (statusFilter === 'inactive') {
      query.isActive = false;
    }

    if (search) {

    }

    const totalConversations = await Conversation.countDocuments(query);

    let conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    if (search) {
      conversations = conversations.filter(conv => {
        return conv.participants.some(p =>
          p.userName.toLowerCase().includes(search.toLowerCase()) ||
          p.userEmail.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    for (let conv of conversations) {
      const messageCount = await Message.countDocuments({ conversationId: conv._id });
      conv.messageCount = messageCount;

      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        isRead: false
      });
      conv.unreadCount = unreadCount;
    }

    const totalPages = Math.ceil(totalConversations / limit);

    const totalChatsCount = await Conversation.countDocuments({ isActive: true });
    const activeChatsCount = await Conversation.countDocuments({ isActive: true });
    const inactiveChatsCount = await Conversation.countDocuments({ isActive: false });
    const totalMessagesCount = await Message.countDocuments();
    const unreadMessagesCount = await Message.countDocuments({ isRead: false });

    res.render("admin/chats.ejs", {
      activePage: 'chats',
      conversations: conversations,
      currentPage: page,
      totalPages: totalPages,
      totalConversations: totalConversations,
      search: search,
      statusFilter: statusFilter,
      limit: limit,
      totalChatsCount: totalChatsCount,
      activeChatsCount: activeChatsCount,
      inactiveChatsCount: inactiveChatsCount,
      totalMessagesCount: totalMessagesCount,
      unreadMessagesCount: unreadMessagesCount,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.render("admin/chats.ejs", {
      activePage: 'chats',
      conversations: [],
      error: "Error loading conversations",
      totalChatsCount: 0,
      activeChatsCount: 0,
      inactiveChatsCount: 0,
      totalMessagesCount: 0,
      unreadMessagesCount: 0
    });
  }
});

router.get("/chats/:conversationId", async function (req, res) {
  try {
    const { Conversation, Message } = require(__dirname + "/../model/Chat");
    const conversationId = req.params.conversationId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({ conversationId: conversationId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({
      conversation: conversation,
      messages: messages
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Error loading conversation" });
  }
});

router.post("/chats/:conversationId/reply", async function (req, res) {
  try {
    const { Conversation, Message } = require(__dirname + "/../model/Chat");
    const conversationId = req.params.conversationId;
    const { content } = req.body;
    const adminId = req.session.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Nội dung tin nhắn không được để trống" });
    }

    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Chỉ admin mới có thể trả lời tin nhắn" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Hội thoại không tồn tại" });
    }

    const isAdminParticipant = conversation.participants.some(
      (p) => p.userId.toString() === adminId.toString()
    );
    if (!isAdminParticipant) {
      return res.status(403).json({ error: "Bạn không phải là thành viên của hội thoại này" });
    }

    const message = new Message({
      conversationId: conversationId,
      senderId: adminId,
      senderName: adminUser.firstName + " " + adminUser.lastName,
      content: content.trim(),
      isRead: false,
    });

    await message.save();

    conversation.lastMessage = content.trim();
    conversation.lastMessageAt = new Date();

    await conversation.save();

    message.isRead = true;
    await message.save();

    res.json({
      success: true,
      message: message,
    });
  } catch (error) {
    console.error("Error sending admin reply:", error);
    res.status(500).json({ error: "Có lỗi xảy ra khi gửi tin nhắn" });
  }
});

router.get("/bookings", async function (req, res) {
  try {
    const Booking = require(__dirname + "/../model/Booking");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const statusFilter = req.query.status || '';
    const paymentStatusFilter = req.query.paymentStatus || '';

    let query = {};
    if (search) {
      query.$or = [
        { guestName: { $regex: search, $options: 'i' } },
        { guestEmail: { $regex: search, $options: 'i' } },
        { guestPhone: { $regex: search, $options: 'i' } }
      ];
    }
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (paymentStatusFilter) {
      query.paymentStatus = paymentStatusFilter;
    }

    const totalBookings = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate('user', 'firstName lastName email')
      .populate('tour', 'title destination image price discountPrice')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalPages = Math.ceil(totalBookings / limit);

    const totalBookingsCount = await Booking.countDocuments();
    const confirmedCount = await Booking.countDocuments({ status: 'confirmed' });
    const pendingCount = await Booking.countDocuments({ status: 'pending' });
    const cancelledCount = await Booking.countDocuments({ status: 'cancelled' });
    const completedCount = await Booking.countDocuments({ status: 'completed' });
    const paidCount = await Booking.countDocuments({ paymentStatus: 'paid' });
    const paymentPendingCount = await Booking.countDocuments({ paymentStatus: 'pending' });
    const refundedCount = await Booking.countDocuments({ paymentStatus: 'refunded' });

    res.render("admin/bookings.ejs", {
      activePage: 'bookings',
      bookings: bookings,
      currentPage: page,
      totalPages: totalPages,
      totalBookings: totalBookings,
      search: search,
      statusFilter: statusFilter,
      paymentStatusFilter: paymentStatusFilter,
      limit: limit,
      totalBookingsCount: totalBookingsCount,
      confirmedCount: confirmedCount,
      pendingCount: pendingCount,
      cancelledCount: cancelledCount,
      completedCount: completedCount,
      paidCount: paidCount,
      paymentPendingCount: paymentPendingCount,
      refundedCount: refundedCount,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.render("admin/bookings.ejs", {
      activePage: 'bookings',
      bookings: [],
      error: "Error loading bookings",
      totalBookingsCount: 0,
      confirmedCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
      completedCount: 0
    });
  }
});

router.get("/bookings/:id", async function (req, res) {
  try {
    const Booking = require(__dirname + "/../model/Booking");
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('tour', 'title destination image price discountPrice duration durationUnit');
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Error fetching booking" });
  }
});

router.post("/users", async function (req, res) {
  try {

    res.setHeader('Content-Type', 'application/json');

    const { firstName, lastName, email, phone, birthDate, password, role, newsletter } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "First name, last name, email and password are required" });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: phone || undefined,
      birthDate: birthDate || undefined,
      password,
      role: role || 'user',
      newsletter: newsletter === 'on' || newsletter === true
    });

    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.json({ success: true, message: "User created successfully", user: userResponse });
  } catch (error) {
    console.error("Error creating user:", error);

    res.status(500).json({ error: error.message || "Error creating user" });
  }
});

router.get("/users", async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const roleFilter = req.query.role || '';

    let query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (roleFilter) {
      query.role = roleFilter;
    }

    const totalUsers = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/users.ejs", {
      activePage: 'users',
      users: users,
      currentPage: page,
      totalPages: totalPages,
      totalUsers: totalUsers,
      search: search,
      roleFilter: roleFilter,
      limit: limit,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.render("admin/users.ejs", {
      activePage: 'users',
      users: [],
      error: "Error loading users"
    });
  }
});

router.post("/users/:id/toggle-lock", async function (req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');

    const userId = req.params.id;

    if (userId === req.session.user.id) {
      return res.status(400).json({ error: "Cannot lock your own account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    const action = user.isActive ? "unlocked" : "locked";
    res.json({
      success: true,
      message: `User account ${action} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error("Error toggling user lock:", error);
    res.status(500).json({ error: error.message || "Error toggling user lock" });
  }
});

router.post("/users/:id/role", async function (req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');

    const { role } = req.body;
    const userId = req.params.id;

    if (userId === req.session.user.id) {
      return res.status(400).json({ error: "Cannot change your own role" });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(userId, { role: role }, { new: true });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "User role updated successfully" });
  } catch (error) {
    console.error("Error changing user role:", error);
    res.status(500).json({ error: error.message || "Error changing user role" });
  }
});

router.get("/users/:id", async function (req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Error fetching user" });
  }
});

router.post("/users/:id", async function (req, res) {
  try {
    const { firstName, lastName, email, phone, birthDate, role, newsletter } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.birthDate = birthDate || user.birthDate;
    user.role = role || user.role;
    user.newsletter = newsletter === 'on' || newsletter === true;

    await user.save();

    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: error.message || "Error updating user" });
  }
});

router.delete("/users/:id", async function (req, res) {
  try {
    const userId = req.params.id;

    if (userId === req.session.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
});

router.post("/tours", async function (req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');

    const {
      title, description, shortDescription, destination, duration, durationUnit,
      maxPersons, price, discountPrice, image, images, category, rating, isActive,
      isFeatured, highlights, includes, excludes, itinerary, availableDates
    } = req.body;

    if (!title || !description || !destination || !duration || !price) {
      return res.status(400).json({ error: "Title, description, destination, duration, and price are required" });
    }

    let processedItinerary = [];
    if (itinerary && Array.isArray(itinerary)) {
      processedItinerary = itinerary.map(item => ({
        day: item.day ? parseInt(item.day) : undefined,
        title: item.title || '',
        description: item.description || '',
        places: Array.isArray(item.places) ? item.places : (item.places ? item.places.split(',').map(p => p.trim()).filter(p => p) : []),
        activities: Array.isArray(item.activities) ? item.activities : (item.activities ? item.activities.split(',').map(a => a.trim()).filter(a => a) : []),
        hotel: item.hotel || ''
      }));
    }

    let processedDates = [];
    if (availableDates && Array.isArray(availableDates)) {
      processedDates = availableDates
        .map(dateStr => {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        })
        .filter(date => date !== null);
    }

    const newTour = new Tour({
      title,
      description,
      shortDescription: shortDescription || description.substring(0, 150),
      destination,
      duration: parseInt(duration),
      durationUnit: durationUnit || 'days',
      maxPersons: maxPersons ? parseInt(maxPersons) : 2,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      image: image || "/static/img/packages-1.jpg",
      images: Array.isArray(images) ? images.filter(img => img && img.trim()) : [],
      category: category || 'other',
      rating: rating ? parseFloat(rating) : 5,
      isActive: isActive !== false && isActive !== 'false',
      isFeatured: isFeatured === true || isFeatured === 'true',
      highlights: Array.isArray(highlights) ? highlights : (highlights ? highlights.split(',').map(h => h.trim()) : []),
      includes: Array.isArray(includes) ? includes : (includes ? includes.split(',').map(i => i.trim()) : []),
      excludes: Array.isArray(excludes) ? excludes : (excludes ? excludes.split(',').map(e => e.trim()) : []),
      itinerary: processedItinerary,
      availableDates: processedDates
    });

    await newTour.save();

    res.json({ success: true, message: "Tour created successfully", tour: newTour });
  } catch (error) {
    console.error("Error creating tour:", error);
    res.status(500).json({ error: error.message || "Error creating tour" });
  }
});

router.get("/tours", async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const categoryFilter = req.query.category || '';
    const statusFilter = req.query.status || '';

    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } }
      ];
    }
    if (categoryFilter) {
      query.category = categoryFilter;
    }
    if (statusFilter === 'active') {
      query.isActive = true;
    } else if (statusFilter === 'inactive') {
      query.isActive = false;
    }

    const totalTours = await Tour.countDocuments(query);

    const tours = await Tour.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalPages = Math.ceil(totalTours / limit);

    res.render("admin/tours.ejs", {
      activePage: 'tours',
      tours: tours,
      currentPage: page,
      totalPages: totalPages,
      totalTours: totalTours,
      search: search,
      categoryFilter: categoryFilter,
      statusFilter: statusFilter,
      limit: limit,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.render("admin/tours.ejs", {
      activePage: 'tours',
      tours: [],
      error: "Error loading tours"
    });
  }
});

router.post("/tours/:id/toggle-status", async function (req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');

    const tourId = req.params.id;
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ error: "Tour not found" });
    }

    tour.isActive = !tour.isActive;
    await tour.save();

    const action = tour.isActive ? "activated" : "deactivated";
    res.json({
      success: true,
      message: `Tour ${action} successfully`,
      isActive: tour.isActive
    });
  } catch (error) {
    console.error("Error toggling tour status:", error);
    res.status(500).json({ error: error.message || "Error toggling tour status" });
  }
});

router.post("/tours/:id/toggle-featured", async function (req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');

    const tourId = req.params.id;
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ error: "Tour not found" });
    }

    tour.isFeatured = !tour.isFeatured;
    await tour.save();

    const action = tour.isFeatured ? "featured" : "unfeatured";
    res.json({
      success: true,
      message: `Tour ${action} successfully`,
      isFeatured: tour.isFeatured
    });
  } catch (error) {
    console.error("Error toggling tour featured:", error);
    res.status(500).json({ error: error.message || "Error toggling tour featured" });
  }
});

router.get("/tours/:id", async function (req, res) {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ error: "Tour not found" });
    }
    res.json(tour);
  } catch (error) {
    console.error("Error fetching tour:", error);
    res.status(500).json({ error: "Error fetching tour" });
  }
});

router.post("/tours/:id", async function (req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');

    const {
      title, description, shortDescription, destination, duration, durationUnit,
      maxPersons, price, discountPrice, image, images, category, rating, isActive,
      isFeatured, highlights, includes, excludes, itinerary, availableDates
    } = req.body;

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ error: "Tour not found" });
    }

    if (title) tour.title = title;
    if (description) tour.description = description;
    if (shortDescription !== undefined) tour.shortDescription = shortDescription;
    if (destination) tour.destination = destination;
    if (duration) tour.duration = parseInt(duration);
    if (durationUnit) tour.durationUnit = durationUnit;
    if (maxPersons) tour.maxPersons = parseInt(maxPersons);
    if (price) tour.price = parseFloat(price);
    if (discountPrice !== undefined) tour.discountPrice = discountPrice ? parseFloat(discountPrice) : undefined;
    if (image) tour.image = image;
    if (images !== undefined) {
      tour.images = Array.isArray(images) ? images.filter(img => img && img.trim()) : [];
    }
    if (category) tour.category = category;
    if (rating) tour.rating = parseFloat(rating);
    if (isActive !== undefined) tour.isActive = isActive !== false && isActive !== 'false';
    if (isFeatured !== undefined) tour.isFeatured = isFeatured === true || isFeatured === 'true';
    if (highlights !== undefined) {
      tour.highlights = Array.isArray(highlights) ? highlights : (highlights ? highlights.split(',').map(h => h.trim()) : []);
    }
    if (includes !== undefined) {
      tour.includes = Array.isArray(includes) ? includes : (includes ? includes.split(',').map(i => i.trim()) : []);
    }
    if (excludes !== undefined) {
      tour.excludes = Array.isArray(excludes) ? excludes : (excludes ? excludes.split(',').map(e => e.trim()) : []);
    }
    if (itinerary !== undefined) {
      if (Array.isArray(itinerary)) {
        tour.itinerary = itinerary.map(item => ({
          day: item.day ? parseInt(item.day) : undefined,
          title: item.title || '',
          description: item.description || '',
          places: Array.isArray(item.places) ? item.places : (item.places ? item.places.split(',').map(p => p.trim()).filter(p => p) : []),
          activities: Array.isArray(item.activities) ? item.activities : (item.activities ? item.activities.split(',').map(a => a.trim()).filter(a => a) : []),
          hotel: item.hotel || ''
        }));
      } else {
        tour.itinerary = [];
      }
    }
    if (availableDates !== undefined) {
      if (Array.isArray(availableDates)) {
        tour.availableDates = availableDates
          .map(dateStr => {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
          })
          .filter(date => date !== null);
      } else {
        tour.availableDates = [];
      }
    }

    await tour.save();

    res.json({ success: true, message: "Tour updated successfully", tour: tour });
  } catch (error) {
    console.error("Error updating tour:", error);
    res.status(500).json({ error: error.message || "Error updating tour" });
  }
});

router.delete("/tours/:id", async function (req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');

    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
      return res.status(404).json({ error: "Tour not found" });
    }

    res.json({ success: true, message: "Tour deleted successfully" });
  } catch (error) {
    console.error("Error deleting tour:", error);
    res.status(500).json({ error: "Error deleting tour" });
  }
});

router.get("/packages", function (req, res) {
  res.render("admin/packages.ejs", { activePage: 'packages' });
});

router.get("/tables", function (req, res) {
  res.render("admin/tables.ejs", { activePage: 'tables' });
});

router.get("/settings", function (req, res) {
  res.render("admin/settings.ejs", { activePage: 'settings' });
});

router.get("/reviews", async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const status = req.query.status;
    const search = req.query.search || "";
    const rating = req.query.rating;

    let query = {};

    if (status && status !== 'all') {
      if (status === 'pending') {
        query.isApproved = false;
        query.isActive = true;
      } else if (status === 'approved') {
        query.isApproved = true;
        query.isActive = true;
      } else if (status === 'rejected') {
        query.isActive = false;
      }
    }

    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } }
      ];
    }

    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName email')
      .populate('tour', 'title destination image')
      .populate('booking', 'bookingDate numberOfPersons')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limit);

    const stats = {
      total: await Review.countDocuments(),
      pending: await Review.countDocuments({ isApproved: false, isActive: true }),
      approved: await Review.countDocuments({ isApproved: true, isActive: true }),
      rejected: await Review.countDocuments({ isActive: false }),
    };

    res.render("admin/reviews.ejs", {
      activePage: 'reviews',
      reviews: reviews,
      currentPage: page,
      totalPages: totalPages,
      totalReviews: totalReviews,
      stats: stats,
      filters: {
        status: status || 'all',
        search: search,
        rating: rating || 'all',
      },
    });
  } catch (error) {
    console.error("Error loading reviews:", error);
    res.render("admin/reviews.ejs", {
      activePage: 'reviews',
      reviews: [],
      error: "Error loading reviews",
    });
  }
});

router.post("/reviews/:id/approve", async function (req, res) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    review.isApproved = true;
    review.isActive = true;
    await review.save();

    res.json({ success: true, message: "Review approved successfully" });
  } catch (error) {
    console.error("Error approving review:", error);
    res.status(500).json({ error: "Error approving review" });
  }
});

router.post("/reviews/:id/reject", async function (req, res) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    review.isApproved = false;
    review.isActive = false;
    await review.save();

    res.json({ success: true, message: "Review rejected successfully" });
  } catch (error) {
    console.error("Error rejecting review:", error);
    res.status(500).json({ error: "Error rejecting review" });
  }
});

router.delete("/reviews/:id", async function (req, res) {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Error deleting review" });
  }
});

module.exports = router;

