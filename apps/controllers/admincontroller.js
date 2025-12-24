var express = require("express");
var router = express.Router();
var { isAuthenticated, isAdmin } = require(__dirname + "/../middleware/auth");
var User = require(__dirname + "/../model/User");

// Apply authentication middleware to all admin routes
router.use(isAuthenticated);
router.use(isAdmin);

// Dashboard Overview
router.get("/", async function (req, res) {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });
    
    // Get users registered in last 30 days
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

// Transactions
router.get("/transactions", function (req, res) {
  res.render("admin/transactions.ejs", { activePage: 'transactions' });
});

// Bookings
router.get("/bookings", function (req, res) {
  res.render("admin/bookings.ejs", { activePage: 'bookings' });
});

// Create new user (API) - Must be before GET /users/:id to avoid route conflict
router.post("/users", async function (req, res) {
  try {
    // Ensure we return JSON
    res.setHeader('Content-Type', 'application/json');
    
    const { firstName, lastName, email, phone, birthDate, password, role, newsletter } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "First name, last name, email and password are required" });
    }
    
    // Email validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    // Create new user
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
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.json({ success: true, message: "User created successfully", user: userResponse });
  } catch (error) {
    console.error("Error creating user:", error);
    // Ensure we return JSON even on error
    res.status(500).json({ error: error.message || "Error creating user" });
  }
});

// Users Management
router.get("/users", async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const roleFilter = req.query.role || '';
    
    // Build query
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
    
    // Get total count
    const totalUsers = await User.countDocuments(query);
    
    // Get users with pagination
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

// Lock/Unlock user account - Must be before /users/:id to avoid route conflict
router.post("/users/:id/toggle-lock", async function (req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');
    
    const userId = req.params.id;
    
    // Prevent locking your own account
    if (userId === req.session.user.id) {
      return res.status(400).json({ error: "Cannot lock your own account" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Toggle isActive
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

// Change user role - Must be before /users/:id to avoid route conflict
router.post("/users/:id/role", async function (req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');
    
    const { role } = req.body;
    const userId = req.params.id;
    
    // Prevent changing your own role
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

// Get user by ID (API)
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

// Update user
router.post("/users/:id", async function (req, res) {
  try {
    const { firstName, lastName, email, phone, birthDate, role, newsletter } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Update fields
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

// Delete user
router.delete("/users/:id", async function (req, res) {
  try {
    const userId = req.params.id;
    
    // Prevent deleting yourself
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


// Packages
router.get("/packages", function (req, res) {
  res.render("admin/packages.ejs", { activePage: 'packages' });
});

// Tables
router.get("/tables", function (req, res) {
  res.render("admin/tables.ejs", { activePage: 'tables' });
});

// Settings
router.get("/settings", function (req, res) {
  res.render("admin/settings.ejs", { activePage: 'settings' });
});

module.exports = router;


