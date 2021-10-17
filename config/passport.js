var passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const auth_database = require("./auth_database");
const User = auth_database.auth_connection.models.User;

const customFields = {
  userNameField: "username",
  passwordField: "password",
};

passport.use(
  new LocalStrategy(customFields, function (username, password, cb) {
    User.findOne({ username: username })
      .then((user) => {
        if (!user) {
          return cb(null, false); // not authenticated (no such user)
        }
        if (password == user.password) {
          return cb(null, user); // authenticated
        } else {
          return cb(null, false); // not authenticated (invalid password)
        }
      })
      .catch((err) => {
        cb(err);
      });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((userId, done) => {
  User.findById(userId)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => done(err));
});
