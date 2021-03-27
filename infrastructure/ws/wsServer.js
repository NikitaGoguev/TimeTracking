const WebSocket = require("ws");
const db = require("../db/db_mongo.js");
const cookie = require("cookie"); //for ws auth

const wss = new WebSocket.Server({ clientTracking: false, noServer: true });
const wsClients = new Map();

const init = (server) => {
  server.on("upgrade", async (req, socket, head) => {
    const cookies = cookie.parse(req.headers["cookie"]);
    const sessionId = cookies && cookies["sessionId"];
    if (!sessionId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    const user = await db.findUserBySessionId(sessionId);
    if (!user) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    req.user = user;
    req.sessionId = sessionId;
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", async (ws, req) => {
    const { user } = req;
    wsClients.set(user.id.toString(), ws);
    sendMessageAllTimers(user);
    const intervalId = setInterval(async () => {
      sendMessageActiveTimers(user);
    }, 1000);

    ws.on("close", () => {
      clearInterval(intervalId);
      wsClients.delete(user.id.toString());
    });
  });
};

async function sendMessageAllTimers(user) {
  const timers = await db.findTimers(user.id);
  const ws = wsClients.get(user.id.toString());
  if (!ws) return;
  ws.send(
    JSON.stringify({
      type: "all_timers",
      activeTimers: timers.filter((t) => t.isActive === true),
      oldTimers: timers.filter((t) => t.isActive === false),
    })
  );
}

async function sendMessageActiveTimers(user) {
  const timers = await db.findTimers(user.id, true);
  const ws = wsClients.get(user.id.toString());
  if (!ws) return;
  ws.send(
    JSON.stringify({
      type: "active_timers",
      activeTimers: timers,
    })
  );
}

module.exports = {
  init,
  sendMessageAllTimers,
  sendMessageActiveTimers,
};
