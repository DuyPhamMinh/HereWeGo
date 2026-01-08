
require("dotenv").config();

var express = require("express");
var bodyParser = require("body-parser");
var session = require("express-session");
var MongoStore = require("connect-mongo").default;
var connectDB = require(__dirname + "/config/database");

global.__basedir = __dirname;

var app = express();
var controller = require(__dirname + "/apps/controllers");
var apiRoutes = require(__dirname + "/apps/api/routes");

connectDB();

app.set("views", __dirname + "/apps/views");
app.set("view engine", "ejs");

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const config = require(__dirname + "/config/config");

app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: config.mongodb.uri,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(function (req, res, next) {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
});

app.use("/static", express.static(__dirname + "/public"));
app.use("/partical", express.static(__dirname + "/views/partical"));

app.get("/favicon.ico", function (req, res) {
  res.sendFile(__dirname + "/public/favicon.ico");
});

app.use("/api", apiRoutes);

app.use(controller);

var server = app.listen(process.env.PORT || 8080, function () {
  console.log(`Server is running on port ${process.env.PORT || 8080}`);
});

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

require(__dirname + "/apps/socket/chatSocket")(io);

module.exports = { app, io };
