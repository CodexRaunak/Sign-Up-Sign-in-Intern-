const express = require("express");
const app = express();
const mongoose = require("mongoose");
const MONGO_URL = "mongodb://127.0.0.1:27017/registration";
const path = require("path");
const passport = require("passport");
const User = require("./models/user.js");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const { wrapAsync } = require("./utils/wrapAsync.js");
const flash = require("connect-flash");
const ejsMate = require("ejs-mate");

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

const sessionOptions = {
  secret: "secretcode",
  resave: false,
  saveUninitialized: true,
};

app.use(session(sessionOptions));
app.use(flash());

async function main() {
  await mongoose.connect(MONGO_URL);
}
main()
  .then(() => console.log("connected to DB"))
  .catch((err) => console.log(err));

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.send("Root is working");
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.post(
  "/signup",
  wrapAsync(async (req, res) => {
    let { username, email, password } = req.body;
    let newUser = new User({ username, email });
    let registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.flash("success", "Registered Successfully");
    res.redirect("/signup");
  })
);

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/signup",
    failureFlash: true,
  }),
  wrapAsync(async (req, res) => {
    req.flash("success", "Successfully Logged In");
    res.redirect("/signup");
  })
);

app.use((err, req, res, next) => {
  req.flash("error", err.message);
  res.redirect("/signup");
});

app.listen(8080, () => {
  console.log("server is listening to 8080");
});
