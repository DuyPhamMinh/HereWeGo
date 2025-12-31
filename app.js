// Load environment variables
require("dotenv").config();

var express = require("express");
var bodyParser = require("body-parser");
var session = require("express-session");
var MongoStore = require("connect-mongo").default;
var connectDB = require(__dirname + "/config/database");

// Set global base directory
global.__basedir = __dirname;

var app = express();
var controller = require(__dirname + "/apps/controllers");
var apiRoutes = require(__dirname + "/apps/api/routes");

// Connect to MongoDB
connectDB();

app.set("views", __dirname + "/apps/views");
app.set("view engine", "ejs");

// Body parser middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Load config
const config = require(__dirname + "/config/config");

// Session configuration
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: config.mongodb.uri,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Make user available to all views
app.use(function (req, res, next) {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
});

app.use("/static", express.static(__dirname + "/public"));
app.use("/partical", express.static(__dirname + "/views/partical"));

// Serve favicon from root
app.get("/favicon.ico", function (req, res) {
  res.sendFile(__dirname + "/public/favicon.ico");
});

// API Routes (RESTful API)
app.use("/api", apiRoutes);

// View Routes (Traditional EJS views)
app.use(controller);

var server = app.listen(process.env.PORT || 8080, function () {
  console.log(`Server is running on port ${process.env.PORT || 8080}`);
});
