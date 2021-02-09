const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  const isActive = req.query.isActive;
  if (!isActive) return res.json(await req.db.findTimers(req.user.id));
  if (!(isActive === "true" || isActive === "false")) return res.sendStatus(400);
  res.json(await req.db.findTimers(req.user.id, isActive === "true" ? true : false));
});

router.post("/", async (req, res) => {
  const desc = req.body.description;
  if (!desc) return res.sendStatus(400);
  const newTimer = await req.db.createNewTimer(desc, req.user.id);
  res.json(newTimer);
});

//`/api/timers/${id}/stop`
router.post("/:id/stop", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.sendStatus(400);
  const timer = await req.db.stopTimer(id, new Date());
  if (!timer) return res.sendStatus(404);
  res.send(JSON.stringify(timer));
});

module.exports = router;
