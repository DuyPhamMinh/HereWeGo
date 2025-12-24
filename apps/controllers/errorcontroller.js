var express = require("express");
var router = express.Router();

router.get("/", function (req, res) {
  res.render("404.ejs");
});
module.exports = router;

