var express = require("express");
var router = express.Router();
var User = require(__dirname + "/../model/User");

router.get("/", function (req, res) {
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("register.ejs", {
    error: null,
    success: null,
  });
});

router.post("/", async function (req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      password,
      confirmPassword,
      terms,
      newsletter,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.render("register.ejs", {
        error: "All required fields must be filled",
        success: null,
        formData: req.body,
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.render("register.ejs", {
        error: "Please enter a valid email address",
        success: null,
        formData: req.body,
      });
    }

    if (password !== confirmPassword) {
      return res.render("register.ejs", {
        error: "Passwords do not match",
        success: null,
        formData: req.body,
      });
    }

    if (password.length < 6) {
      return res.render("register.ejs", {
        error: "Password must be at least 6 characters",
        success: null,
        formData: req.body,
      });
    }

    if (!terms) {
      return res.render("register.ejs", {
        error: "You must agree to the terms and conditions",
        success: null,
        formData: req.body,
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.render("register.ejs", {
        error: "Email already registered. Please login instead.",
        success: null,
        formData: req.body,
      });
    }

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: phone || undefined,
      birthDate: birthDate || undefined,
      password,
      newsletter: newsletter === "on" || newsletter === true,
    });

    await newUser.save();

    req.session.user = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
    };

    if (newUser.role === 'admin') {
      res.redirect("/admin");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.render("register.ejs", {
      error: error.message || "An error occurred during registration",
      success: null,
      formData: req.body,
    });
  }
});

module.exports = router;
