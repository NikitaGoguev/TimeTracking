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

async function getDBConnection() {
  try {
    const client = await clientPromise;
    return client.db("timerApp");
  } catch (error) {
    console.log("Init db error", error);
    throw error;
  }
}

//#region auth
//res checked
async function findUserByUsername(username) {
  const db = await getDBConnection();
  let res;
  try {
    res = await db.collection("users").findOne({ username });
  } catch (error) {
    console.log("findUserByUsername error");
  }
  if (!res) return;

  return renameKey(res, "_id", "id");
}

//res checked
async function findUserBySessionId(sessionId) {
  const db = await getDBConnection();
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

//res checked
async function createSession(userId) {
  const db = await getDBConnection();
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

//res checked
async function deleteSession(sessionId) {
  const db = await getDBConnection();
  try {
    await db.collection("sessions").deleteOne({ sessionId: sessionId });
  } catch (error) {
    console.log("deleteSession error");
  }
}

//res checked
async function createUser(username, password) {
  const db = await getDBConnection();
  let newUser = {
    username: username,
    password: hash(password),
  };
  try {
    const res = await db.collection("users").insertOne(newUser);
    if (res.insertedCount === 0) return;
  } catch (error) {
    console.log("createUser error");
    return;
  }
  return renameKey(newUser, "_id", "id");
}
//#endregion auth

//#region timers
//res checked
async function createNewTimer(desc, userId) {
  const db = await getDBConnection();
  const newTimer = {
    userId: userId,
    description: desc,
    start: new Date(),
    isActive: true,
  };
  let res;
  try {
    res = await db.collection("timers").insertOne(newTimer);
    if (res.insertedCount === 0) return;
  } catch (error) {
    console.log("createNewTimer error");
    return;
  }
  return renameKey(newTimer, "_id", "id");
}

async function stopTimer(userId, timerId, stopTime) {
  const timer = await findTimerById(userId, timerId);
  if (timer.length === 0) return;
  const db = await getDBConnection();
  let timerData;
  try {
    timerData = await db.collection("timers").updateOne(
      {
        _id: ObjectId(timerId),
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

async function findTimerById(userId, timerId) {
  const db = await getDBConnection();
  let res;
  try {
    res = await db
      .collection("timers")
      .find({
        userId: userId,
        _id: ObjectId(timerId),
      })
      .toArray();
    return res.map((timerData) => createTimerView(timerData));
  } catch (error) {
    console.log("findTimer by id error");
    //console.log(error);
    return [];
  }
}

async function findTimers(userId, isActive) {
  const db = await getDBConnection();
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
  findTimerById,
};
