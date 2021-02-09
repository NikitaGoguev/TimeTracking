const express = require("express");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const db = require("./infrastructure/db/db_mongo.js");
const { hash } = require("./infrastructure/hash.js");
const { auth, authCheck, authProceed, addDB } = require("./infrastructure/middleware/authMiddleware.js").init(db);

const app = express();

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
});

app.set("view engine", "njk");

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

app.get("/", auth(), (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
  });
});

app.post(
  "/signup",
  bodyParser.urlencoded({ extended: false }),
  async (req, res, next) => {
    const { username, password } = req.body;
    const existedUser = await db.findUserByUsername(username);
    if (existedUser) {
      return res.redirect("/?authError=Already exist. Please login.");
    }
    req.user = await db.createUser(username, password);
    next();
  },
  authProceed()
);

app.post(
  "/login",
  bodyParser.urlencoded({ extended: false }),
  async (req, res, next) => {
    const { username, password } = req.body;
    const user = await db.findUserByUsername(username);
    if (!user || hash(password) !== user.password) {
      return res.redirect("/?authError=true");
    }
    req.user = user;
    next();
  },
  authProceed()
);

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }
  await db.deleteSession(req.sessionId);
  res.clearCookie("sessionId").redirect("/");
});

app.use("/api/timers", auth(), authCheck(), addDB(), require("./timersApi"));

app.use((err, req, res, next) => {
  res.sendStatus(500).send(err.message);
  next(); // eslint err
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
