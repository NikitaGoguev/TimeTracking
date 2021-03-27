const express = require("express");
const wsServer = require("./infrastructure/ws/wsServer.js");

const router = express.Router();

router.get("/", async (req, res) => {
  const isActive = req.query.isActive;
  if (!isActive) return res.json(await req.db.findTimers(req.user.id));
  if (!(isActive === "true" || isActive === "false")) return res.sendStatus(400);
  res.json(await req.db.findTimers(req.user.id, isActive === "true" ? true : false));
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  res.json(await req.db.findTimerById(req.user.id, id));
});

router.post("/", async (req, res) => {
  const desc = req.body.description;
  if (!desc) return res.sendStatus(400);
  const newTimer = await req.db.createNewTimer(desc, req.user.id);
  wsServer.sendMessageAllTimers(req.user);
  res.json(newTimer);
});

//`/api/timers/${id}/stop`
router.post("/:id/stop", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.sendStatus(400);
  const timer = await req.db.stopTimer(req.user.id, id, new Date());
  if (!timer) return res.sendStatus(404);
  wsServer.sendMessageAllTimers(req.user);
  res.send(JSON.stringify(timer));
});

module.exports = router;
