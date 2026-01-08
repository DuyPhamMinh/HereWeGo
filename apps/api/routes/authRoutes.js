var express = require("express");
var router = express.Router();
const jsonwebtoken = require("jsonwebtoken");
var User = require(global.__basedir + "/apps/model/User");
const config = require(global.__basedir + "/config/config");

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is locked. Please contact administrator."
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        var authorities = [];
        authorities.push(user.role);

        var claims = [];
        if (user.role === "admin") {
            claims.push("tour.view");
            claims.push("tour.edit");
            claims.push("tour.delete");
            claims.push("booking.view");
            claims.push("booking.edit");
            claims.push("booking.delete");
            claims.push("user.view");
            claims.push("user.edit");
            claims.push("user.delete");
        } else {
            claims.push("booking.view");
            claims.push("booking.create");
        }

        const token = jsonwebtoken.sign(
            {
                userId: user._id.toString(),
                user: user.email,
                roles: authorities,
                claims: claims
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        const userResponse = user.toObject();
        delete userResponse.password;

        return res.json({
            success: true,
            token: token,
            user: userResponse
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

router.post("/register", async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, newsletter } = req.body;

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

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const newUser = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone: phone || undefined,
            password,
            newsletter: newsletter === true || newsletter === 'true',
            role: 'user'
        });

        await newUser.save();

        const userResponse = newUser.toObject();
        delete userResponse.password;

        var claims = ["booking.view", "booking.create"];
        const token = jsonwebtoken.sign(
            {
                userId: newUser._id.toString(),
                user: newUser.email,
                roles: ["user"],
                claims: claims
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token: token,
            user: userResponse
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
});

var verifyToken = require(global.__basedir + "/apps/Util/VerifyToken");
router.get("/test-security", verifyToken, (req, res) => {
    res.json({
        success: true,
        message: "Authentication successful",
        userData: req.userData
    });
});

module.exports = router;
