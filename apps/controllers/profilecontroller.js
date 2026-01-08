var express = require("express");
var router = express.Router();
var { isAuthenticated } = require(__dirname + "/../middleware/auth");
var User = require(__dirname + "/../model/User");

router.use(isAuthenticated);

router.get("/", async function (req, res) {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.redirect("/login");
    }

    res.render("profile.ejs", {
      activePage: 'profile',
      user: user,
      error: null,
      success: null
    });
  } catch (error) {
    console.error("Error loading profile:", error);
    res.render("profile.ejs", {
      activePage: 'profile',
      user: req.session.user,
      error: "Error loading profile",
      success: null
    });
  }
});

router.post("/", async function (req, res) {
  try {
    const { firstName, lastName, email, phone, birthDate, newsletter } = req.body;
    const userId = req.session.user.id;

    if (!firstName || !lastName || !email) {
      return res.render("profile.ejs", {
        activePage: 'profile',
        user: await User.findById(userId).select('-password'),
        error: "First name, last name, and email are required",
        success: null,
        formData: req.body
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.render("profile.ejs", {
        activePage: 'profile',
        user: await User.findById(userId).select('-password'),
        error: "Please enter a valid email address",
        success: null,
        formData: req.body
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: userId }
    });
    if (existingUser) {
      return res.render("profile.ejs", {
        activePage: 'profile',
        user: await User.findById(userId).select('-password'),
        error: "Email already registered by another user",
        success: null,
        formData: req.body
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.redirect("/login");
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email.toLowerCase();
    user.phone = phone || undefined;
    user.birthDate = birthDate || undefined;
    user.newsletter = newsletter === 'on' || newsletter === true;

    await user.save();

    req.session.user = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };

    res.render("profile.ejs", {
      activePage: 'profile',
      user: await User.findById(userId).select('-password'),
      error: null,
      success: "Profile updated successfully!"
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.render("profile.ejs", {
      activePage: 'profile',
      user: await User.findById(req.session.user.id).select('-password'),
      error: error.message || "An error occurred while updating profile",
      success: null,
      formData: req.body
    });
  }
});

router.post("/change-password", async function (req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.user.id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render("profile.ejs", {
        activePage: 'profile',
        user: await User.findById(userId).select('-password'),
        error: "All password fields are required",
        success: null
      });
    }

    if (newPassword !== confirmPassword) {
      return res.render("profile.ejs", {
        activePage: 'profile',
        user: await User.findById(userId).select('-password'),
        error: "New passwords do not match",
        success: null
      });
    }

    if (newPassword.length < 6) {
      return res.render("profile.ejs", {
        activePage: 'profile',
        user: await User.findById(userId).select('-password'),
        error: "New password must be at least 6 characters",
        success: null
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.redirect("/login");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.render("profile.ejs", {
        activePage: 'profile',
        user: await User.findById(userId).select('-password'),
        error: "Current password is incorrect",
        success: null
      });
    }

    user.password = newPassword;
    await user.save();

    res.render("profile.ejs", {
      activePage: 'profile',
      user: await User.findById(userId).select('-password'),
      error: null,
      success: "Password changed successfully!"
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.render("profile.ejs", {
      activePage: 'profile',
      user: await User.findById(req.session.user.id).select('-password'),
      error: error.message || "An error occurred while changing password",
      success: null
    });
  }
});

module.exports = router;

