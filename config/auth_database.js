require("dotenv").config();
const mongoose = require("mongoose");

/**
 * -------------- DATABASE ----------------
 */

const auth_connection = mongoose.createConnection(process.env.DB_MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "articles",
});

const UserSchema = new mongoose.Schema({
  fullname: String,
  username: String,
  password: String,
});

const User = auth_connection.model("User", UserSchema);

module.exports.auth_connection = auth_connection;
