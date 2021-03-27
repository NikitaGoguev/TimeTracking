const { hash } = require("../infrastructure/hash.js");

module.exports = {
  async up(db, _client) {
    await db.collection("users").insertOne({
      username: "admin",
      password: hash("pwd007"),
    });

    await db.collection("sessions").insertOne({});
    await db.collection("sessions").deleteMany({});

    await db.collection("timers").insertOne({});
    await db.collection("timers").deleteMany({});
  },

  async down(db, _client) {
    await db.collection("users").deleteMany({});
    await db.collection("timers").deleteMany({});
    await db.collection("sessions").deleteMany({});
  },
};
