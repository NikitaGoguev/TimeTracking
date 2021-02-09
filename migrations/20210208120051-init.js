const { hash } = require("../infrastructure/hash.js");

module.exports = {
  async up(db, client) {
    await db.collection("users").updateOne(
      {
        username: "admin",
      },
      {
        $set: {
          password: hash("pwd007"),
        },
      },
      { upsert: true }
    );

    await db.collection("sessions").insertOne({});
    await db.collection("sessions").deleteMany({});

    await db.collection("timers").insertOne({});
    await db.collection("timers").deleteMany({});
  },

  async down(db, client) {
    await db.collection("users").deleteMany({});
    await db.collection("timers").deleteMany({});
    await db.collection("sessions").deleteMany({});
  },
};
