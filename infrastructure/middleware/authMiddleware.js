const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) return next();
  const user = await req.db.findUserBySessionId(req.cookies["sessionId"]);
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
  const sessionId = await req.db.createSession(req.user.id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/"); //signed, secure
};

exports.auth = auth;
exports.authCheck = authCheck;
exports.authProceed = authProceed;

// module.exports = {
//   init,
//   auth,
//   authCheck,
//   authProceed,
// };
