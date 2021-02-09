let db;

const init = (dbInstanse) => {
  db = dbInstanse;
  return this;
};

const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) return next();
  const user = await db.findUserBySessionId(req.cookies["sessionId"]);
  if (user) {
    req.user = user;
    req.sessionId = req.cookies["sessionId"];
  }
  next();
};

const authCheck = () => (req, res, next) => {
  if (!req.user) return res.sendStatus(401);
  next();
};

const authProceed = () => async (req, res, next) => {
  if (!req.user) return next();
  const sessionId = await db.createSession(req.user.id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/"); //signed, secure
};

const addDB = () => (req, res, next) => {
  req.db = db;
  next();
};

exports.init = init;
exports.auth = auth;
exports.authCheck = authCheck;
exports.authProceed = authProceed;
exports.addDB = addDB;

// module.exports = {
//   init,
//   auth,
//   authCheck,
//   authProceed,
//   addDB,
// };
