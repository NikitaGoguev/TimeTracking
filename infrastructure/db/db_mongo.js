require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");
const { nanoid } = require("nanoid");
const { hash } = require("../hash.js");

//#region for rename _id => id
const clone = (obj) => Object.assign({}, obj);
const renameKey = (object, key, newKey) => {
  const clonedObj = clone(object);
  const targetKey = clonedObj[key];
  delete clonedObj[key];
  clonedObj[newKey] = targetKey;
  return clonedObj;
};
//#endregion

const clientPromise = new MongoClient.connect(process.env.DB_URI, {
  useUnifiedTopology: true,
  poolSize: 10,
});

let db;
(async () => {
  try {
    const client = await clientPromise;
    db = client.db("timerApp");
  } catch (error) {
    console.log("Init db error", error);
  }
})();

//#region auth
async function findUserByUsername(username) {
  let res;
  try {
    res = await db.collection("users").findOne({ username });
  } catch (error) {
    console.log("findUserByUsername error");
  }
  if (!res) return;
  return renameKey(res, "_id", "id");
}

async function findUserBySessionId(sessionId) {
  let session;
  try {
    session = await db.collection("sessions").findOne(
      {
        sessionId: sessionId,
      },
      {
        projection: { userId: 1 },
      }
    );
  } catch (error) {
    console.log("findUserBySessionId error 1");
    return;
  }

  if (!session) {
    return;
  }
  let res;
  try {
    res = await db.collection("users").findOne({ _id: ObjectId(session.userId) });
  } catch (error) {
    console.log("findUserBySessionId error 2");
    return;
  }
  return renameKey(res, "_id", "id");
}

async function createSession(userId) {
  const sessionId = nanoid();
  try {
    await db.collection("sessions").insertOne({
      userId: userId,
      sessionId: sessionId,
    });
  } catch (error) {
    console.log("createSession error");
    return;
  }
  return sessionId;
}

async function deleteSession(sessionId) {
  try {
    await db.collection("sessions").deleteOne({ sessionId: sessionId });
  } catch (error) {
    console.log("deleteSession error");
  }
}

async function createUser(username, password) {
  let newUser;
  try {
    newUser = await db.collection("users").insertOne(
      {
        username: username,
        password: hash(password),
      },
      {
        projection: { _id: 1, username: 1, password: 1 },
      }
    );
  } catch (error) {
    console.log("createUser error");
    return;
  }

  return renameKey(newUser, "_id", "id");
}
//#endregion auth

//#region timers
async function createNewTimer(desc, userId) {
  let res;
  try {
    res = await db.collection("timers").insertOne(
      {
        userId: userId,
        description: desc,
        start: new Date(),
        isActive: true,
      },
      ["_id"]
    );
  } catch (error) {
    console.log("createNewTimer error");
    return;
  }
  return renameKey(res, "_id", "id");
}

async function stopTimer(id, stopTime) {
  let timerData;
  try {
    timerData = await db.collection("timers").updateOne(
      {
        _id: ObjectId(id),
      },
      {
        $set: {
          end: stopTime,
          isActive: false,
        },
      },
      {
        projection: { _id: 1, userId: 1, description: 1, isActive: 1, start: 1, end: 1 },
      }
    );
  } catch (error) {
    console.log("stopTimer error");
  }

  if (!timerData) return;
  return createTimerView(renameKey(timerData, "_id", "id"));
}

async function findTimers(userId, isActive) {
  let res;
  try {
    if (isActive === undefined) {
      res = await db.collection("timers").find({ userId: userId }).toArray();
    } else {
      res = await db
        .collection("timers")
        .find({
          userId: userId,
          isActive: isActive,
        })
        .toArray();
    }
    return res.map((timerData) => createTimerView(timerData));
  } catch (error) {
    console.log("findTimers error");
  }
}

function createTimerView(timerData) {
  return {
    start: timerData.start,
    end: timerData.end,
    duration: timerData.end ? timerData.end - timerData.start : null,
    description: timerData.description,
    isActive: timerData.isActive,
    id: timerData._id,
    userId: timerData.userId,
    get progress() {
      return Date.now() - this.start;
    },
  };
}
//#endregion timers

module.exports = {
  findUserByUsername,
  findUserBySessionId,
  createSession,
  deleteSession,
  createUser,
  createNewTimer,
  stopTimer,
  findTimers,
};
