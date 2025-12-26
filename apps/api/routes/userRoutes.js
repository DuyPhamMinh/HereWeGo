var express = require("express");
var router = express.Router();
var User = require(global.__basedir + "/apps/model/User");
var verifyToken = require(global.__basedir + "/apps/Util/VerifyToken");

// All routes require authentication
router.use(verifyToken);

// Get current user profile
router.get("/me", async function (req, res) {
    try {
        const user = await User.findById(req.userData.userId).select('-password');
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching user",
            error: error.message 
        });
    }
});

// Update current user profile
router.put("/me", async function (req, res) {
    try {
        const { firstName, lastName, phone, birthDate, newsletter } = req.body;
        
        const user = await User.findById(req.userData.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        // Update fields (user cannot change email, password, or role)
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;
        if (birthDate) user.birthDate = new Date(birthDate);
        if (newsletter !== undefined) user.newsletter = newsletter === true || newsletter === 'true';
        
        await user.save();
        
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.json({ 
            success: true, 
            message: "Profile updated successfully",
            data: userResponse 
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ 
            success: false,
            message: "Error updating profile",
            error: error.message 
        });
    }
});

// Admin routes - Get all users
router.get("/", async function (req, res) {
    try {
        // Check if user has admin role
        if (!req.userData.roles.includes('admin')) {
            return res.status(403).json({ 
                success: false,
                message: "Access denied. Admin privileges required." 
            });
        }
        
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
        
        res.json({
            success: true,
            data: users,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalUsers,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching users",
            error: error.message 
        });
    }
});

// Admin route - Get user by ID
router.get("/:id", async function (req, res) {
    try {
        // Check if user has admin role or is requesting their own profile
        const isAdmin = req.userData.roles.includes('admin');
        const isOwnProfile = req.params.id === req.userData.userId;
        
        if (!isAdmin && !isOwnProfile) {
            return res.status(403).json({ 
                success: false,
                message: "Access denied" 
            });
        }
        
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching user",
            error: error.message 
        });
    }
});

// Admin route - Create user
router.post("/", async function (req, res) {
    try {
        // Check if user has admin role
        if (!req.userData.roles.includes('admin')) {
            return res.status(403).json({ 
                success: false,
                message: "Access denied. Admin privileges required." 
            });
        }
        
        const { firstName, lastName, email, phone, birthDate, password, role, newsletter } = req.body;
        
        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "First name, last name, email and password are required" 
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: "Password must be at least 6 characters" 
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: "Email already registered" 
            });
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
            newsletter: newsletter === true || newsletter === 'true'
        });
        
        await newUser.save();
        
        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;
        
        res.status(201).json({ 
            success: true, 
            message: "User created successfully",
            data: userResponse 
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ 
            success: false,
            message: error.message || "Error creating user" 
        });
    }
});

// Admin route - Update user
router.put("/:id", async function (req, res) {
    try {
        // Check if user has admin role
        if (!req.userData.roles.includes('admin')) {
            return res.status(403).json({ 
                success: false,
                message: "Access denied. Admin privileges required." 
            });
        }
        
        const { firstName, lastName, email, phone, birthDate, role, newsletter, isActive } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        // Prevent admin from changing their own role or locking themselves
        if (req.params.id === req.userData.userId) {
            if (role && role !== user.role) {
                return res.status(400).json({ 
                    success: false,
                    message: "Cannot change your own role" 
                });
            }
            if (isActive === false) {
                return res.status(400).json({ 
                    success: false,
                    message: "Cannot lock your own account" 
                });
            }
        }
        
        // Update fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email.toLowerCase();
        if (phone !== undefined) user.phone = phone;
        if (birthDate) user.birthDate = new Date(birthDate);
        if (role) user.role = role;
        if (newsletter !== undefined) user.newsletter = newsletter === true || newsletter === 'true';
        if (isActive !== undefined) user.isActive = isActive;
        
        await user.save();
        
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.json({ 
            success: true, 
            message: "User updated successfully",
            data: userResponse 
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ 
            success: false,
            message: error.message || "Error updating user" 
        });
    }
});

// Admin route - Delete user
router.delete("/:id", async function (req, res) {
    try {
        // Check if user has admin role
        if (!req.userData.roles.includes('admin')) {
            return res.status(403).json({ 
                success: false,
                message: "Access denied. Admin privileges required." 
            });
        }
        
        // Prevent admin from deleting themselves
        if (req.params.id === req.userData.userId) {
            return res.status(400).json({ 
                success: false,
                message: "Cannot delete your own account" 
            });
        }
        
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        res.json({ 
            success: true, 
            message: "User deleted successfully" 
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ 
            success: false,
            message: "Error deleting user",
            error: error.message 
        });
    }
});

module.exports = router;
