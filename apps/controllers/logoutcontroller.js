var express = require("express");
var router = express.Router();

router.get("/", function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/");
  });
});

module.exports = router;
