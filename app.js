require("dotenv").config();

var MongoClient = require("mongodb").MongoClient;
var mongo_url = process.env.DB_MONGO_URL;
var articles_dbo;
MongoClient.connect(
  mongo_url,
  { useUnifiedTopology: true },
  function (err, db) {
    if (err) throw "Failed to connect to mongoDB: " + err;
    articles_dbo = db.db(process.env.DB_NAME);
    console.log(
      `MongoDB is connected on: ` + mongo_url.replace(/(?<=:)[^:]+(?=@)/, "xx") // hide the password
    );
  }
);

const express = require("express");
const app = express();
app.use(express.text({ type: "text/html" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * -------------- SESSION SETUP ----------------
 */

const session = require("express-session");
const MongoStore = require("connect-mongo")(session); // npm i connect-mongo@3
const database = require("./config/auth_database");

const sessionStore = new MongoStore({
  mongooseConnection: database.auth_connection,
  dbName: process.env.DB_NAME,
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // one day
    },
  })
);

/**
 * -------------- PASSPORT AUTHENTICATION ----------------
 */

var passport = require("passport");

require("./config/passport");

app.use(passport.initialize());
app.use(passport.session());

/**
 * -------------- ROUTES ----------------
 */

var routes = require("./routes");
// const { routes, AuthMiddleware } = require("./routes");
app.use(routes); // Imports all of the routes from ./routes/index.js

const path = require("path");
const fs = require("fs");
const multiparty = require("connect-multiparty");
const multipartyMiddleware = multiparty({ uploadDir: "./cke-images" });
const morgan = require("morgan");
const { nextTick } = require("process");
const PORT = process.env.PORT || 3000;

// app.use(express.static(path.resolve(__dirname, "\\build")));
app.use(express.static("/"), express.static("build"));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/cke-images", express.static(path.join(__dirname, "cke-images")));
// app.use(express.static(path.join(__dirname, "build")));
// app.get("/", function (req, res) {
//   res.sendFile(path.join(__dirname, "build", "index.html"));
// });
// app.get("*", (req, res, next) => {
//   var rel_url = req.params[0];
//   var html = fs.readFileSync(process.cwd() + "/build" + rel_url, "utf8");
//   if (html == undefined) {
//     next();
//     return;
//   }
//   res.send(html);
//   res.end();
//   // next();
//   return;
// });

app.post("/save_article", routes.AuthMiddleware, (req, res, next) => {
  var json = JSON.parse(req.body);
  if (json.id == "-1") {
    json.create_time = new Date().toUTCString();
    articles_dbo.collection("last_article_id").findOne(function (err, result) {
      json.id = result.id;
      articles_dbo.collection("last_article_id").updateOne(
        { _id: result._id },
        {
          $set: { "id": ++json.id },
        },
        function (err, result) {
          articles_dbo
            .collection("articles")
            .insertOne(json, function (err, result) {
              res.write(JSON.stringify({ status: "ok", new_id: json.id }));
              res.end();
            });
        }
      );
    });
  } else {
    json.update_time = new Date().toUTCString();
    articles_dbo.collection("articles").updateOne(
      { id: json.id },
      {
        $set: json,
      },
      function (err, result) {
        if (err) throw "error in updating article";
        res.write(JSON.stringify({ status: "ok" }));
        res.end();
      }
    );
  }
});

app.post(
  "/uploads",
  [multipartyMiddleware, routes.AuthMiddleware],
  (req, res, next) => {
    if (false) {
      var temp_file = path.join(__dirname, req.files.upload.path);
      var temp_file_path = temp_file.path;
      const targe_path_url = path.join(
        __dirname,
        "/build/",
        req.files.upload.path
      );
      if (
        true ||
        path.extname(temp_file.originalFilename).toLowerCase() === ".png" ||
        ".jpg"
      ) {
        fs.rename(temp_file, targe_path_url, (err) => {
          if (err) return console.log(err);
        });
      }
    }

    res.write(
      JSON.stringify({
        "uploaded": true,
        "fileName": req.files.upload.name,
        "url": "/" + req.files.upload.path.replace(/\\/, "/"),
      })
    );

    res.end();
    console.log("file uploaded: " + req.files.upload.name);
  }
);

function goto_index(res) {
  var html = fs.readFileSync(process.cwd() + "/build/index.html", "utf8");
  res.header("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Origin", "*");
  res.send(html);
  res.end();
}

app.get("/edit_article", routes.AuthMiddleware, (req, res, next) => {
  goto_index(res);
});

app.get("/manage_articles", routes.AuthMiddleware, (req, res, next) => {
  goto_index(res);
});

function replace_og(txt, regex, replace, do_quotes = true) {
  if (do_quotes) {
    replace = replace.replace(/"/g, "&quot;");
  }
  return txt.replace(regex, replace);
}

app.get("/view_article", (req, res, next) => {
  var article_id = parseInt(req.query.id);
  articles_dbo
    .collection("articles")
    .findOne({ id: article_id }, function (err, result) {
      if (result == undefined) {
        res.sendStatus(404); // Not Found
        return;
      }
      res.header("Content-Type", "text/html; charset=utf-8");
      var html = fs.readFileSync(process.cwd() + "/pages/article.html", "utf8");
      html = replace_og(html, /\$TITLE/g, result.title);
      html = replace_og(html, /\$DESCRIPTION/g, result.description);
      html = replace_og(html, /\$CONTENT/g, result.content, false);
      res.send(html);
    });
});

app.get("/get_article", (req, res, next) => {
  var article_id = parseInt(req.query.id);
  articles_dbo
    .collection("articles")
    .findOne({ id: article_id }, function (err, result) {
      if (result == undefined) res.write(JSON.stringify({}));
      else res.write(JSON.stringify(result));
      res.end();
    });
});

function return_all_articles(res) {
  articles_dbo
    .collection("articles")
    .find({})
    .toArray(function (err, result) {
      if (result == undefined) throw "no acticles";
      res.write(JSON.stringify(result));
      res.end();
    });
}

app.get("/get_all_articles", (req, res, next) => {
  return_all_articles(res);
});

app.get("/delete_article", routes.AuthMiddleware, (req, res, next) => {
  articles_dbo
    .collection("articles")
    .deleteOne({ id: parseInt(req.query.id) }, function (err, obj) {
      if (err) throw err;
      if (obj.deletedCount == 0); // throw "noting deleted";
      return_all_articles(res);
    });
});

const early_date = new Date("1 Jan 2000");
function compare_by_dates(a, b) {
  var a_uptime =
    a.update_time != null
      ? Date.parse(a.update_time)
      : Date.parse(a.create_time);
  var b_uptime =
    b.update_time != null
      ? Date.parse(b.update_time)
      : Date.parse(b.create_time);

  return a_uptime > b_uptime ? 1 : a_uptime == b_uptime ? 0 : -1;
}

app.get("/articles_toc", (req, res, next) => {
  articles_dbo
    .collection("articles")
    .find({}, { projection: { _id: 0, content: 0 } })
    .toArray(function (err, articles) {
      if (articles == undefined) throw "no acticles";
      res.header("Content-Type", "text/html; charset=utf-8");
      articles.sort(compare_by_dates);
      res.write(
        `<html><head><title>Articles List</title><style>.id {color: red; font-weight: bold;} div {margin-top: 9px;}</style></head><body><h2>Articles List</h2>`
      );
      for (let i = 0; i < articles.length; i++) {
        var article = articles[i];
        res.write(
          `<div><span class="id">${article.id}</span>) <span><a href="/view_article?id=${article.id}" target="_blank">${article.title}</a></span></div>`
        );
      }
      res.write(`</body><html>`);
      res.end();
    });
});

const { exec } = require("child_process");
app.get("/backup", routes.AuthMiddleware, (req, res, next) => {
  exec("./run_backup_articles_db", (err, stdout, stderr) => {
    if (err) {
      console.error(err);
    } else {
      res.send(stdout);
    }
  });
});

app.listen(PORT, () => {
  console.log("listening on port: " + PORT);
});
