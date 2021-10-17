const router = require("express").Router();
const passport = require("passport");
const auth_connection = require("../config/auth_database").auth_connection;
const User = auth_connection.models.User;
const fs = require("fs");

/**
 * -------------- POST ROUTES ----------------
 */

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/login-success",
    failureRedirect: "/login-failure",
  })
);

router.post("/register", (req, res, next) => {
  const newUser = new User({
    fullname: req.body.fullname,
    username: req.body.username,
    password: req.body.password,
  });

  newUser.save().then((user) => {
    console.log(user);
    res.redirect("/login");
  });
});

/**
 * -------------- GET ROUTES ----------------
 */

// router.get("/", (req, res, next) => {
//   var html = fs.readFileSync(process.cwd() + "/pages/home.html", "utf8");
//   res.send(html);
// });

router.get("/login", (req, res, next) => {
  var html = fs.readFileSync(process.cwd() + "/pages/login.html", "utf8");
  res.send(html);
});

router.get("/register", (req, res, next) => {
  var html = fs.readFileSync(process.cwd() + "/pages/register.html", "utf8");
  res.send(html);
});

/**
 * Lookup how to authenticate users on routes with Local Strategy
 * Google Search: "How to use Express Passport Local Strategy"
 *
 * Also, look up what behaviour express session has without a maxage set
 */

const AuthMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  var html = fs.readFileSync(
    process.cwd() + "/pages/unauthenticated.html",
    "utf8"
  );
  res.send(html);
};

router.get("/protected-route", AuthMiddleware, (req, res, next) => {
  // This is how you check if a user is authenticated and protect a route.
  res.send(
    `<h1>You are authenticated as: ${req.user.username}</h1><p><a href="/logout">Logout and reload</a></p>`
  );
});

router.get("/logout", (req, res, next) => {
  req.logout();
  res.redirect("/protected-route");
});

router.get("/login-success", AuthMiddleware, (req, res, next) => {
  res.send(
    `<p>You successfully logged in as: ${req.user.username}. --> <a href="/manage_articles">Manage Articles</a></p>`
  );
});

router.get("/login-failure", (req, res, next) => {
  var html = fs.readFileSync(
    process.cwd() + "/pages/login-failure.html",
    "utf8"
  );
  res.send(html);
});

router.get("/get-user", AuthMiddleware, (req, res, next) => {
  res.send(JSON.stringify({ autor: req.user.fullname }));
});

module.exports = router;
// module.exports.router = router;
module.exports.AuthMiddleware = AuthMiddleware;
