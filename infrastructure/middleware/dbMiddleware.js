const db = require("../db/db_mongo.js");

const addDB = () => (req, res, next) => {
  try {
    req.db = db;
    next();
  } catch (error) {
    return res.sendStatus(500).send(error.message);
  }
};

exports.addDB = addDB;
