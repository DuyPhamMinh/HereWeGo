var express = require("express");
var router = express.Router();
var User = require(__dirname + "/../model/User");

router.get("/", function (req, res) {
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("login.ejs", {
    error: null,
    success: null,
  });
});

router.post("/", async function (req, res) {
  try {
    const { email, password, remember } = req.body;

    if (!email || !password) {
      return res.render("login.ejs", {
        error: "Please provide both email and password",
        success: null,
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.render("login.ejs", {
        error: "Please enter a valid email address",
        success: null,
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.render("login.ejs", {
        error: "Invalid email or password",
        success: null,
      });
    }

    if (user.isActive === false) {
      return res.render("login.ejs", {
        error: "Your account has been locked. Please contact administrator.",
        success: null,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render("login.ejs", {
        error: "Invalid email or password",
        success: null,
      });
    }

    req.session.user = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };

    if (remember) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7;
    }

    if (user.role === 'admin') {
      res.redirect("/admin");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.render("login.ejs", {
      error: "An error occurred during login",
      success: null,
    });
  }
});

module.exports = router;
