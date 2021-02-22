const router = require("express").Router();

const Player = require("../models/Player");

const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/player/new", async (req, res) => {
  try {
    const { nickname, token } = req.fields;

    const newPlayer = new Player({
      nickname,
      token,
    });

    await newPlayer.save();

    return res.status(200).json({ nickname: newPlayer.nickname });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

router.get("/player", isAuthenticated, (req, res) => {
  console.log("route");
  return res.status(200).json({ player: req.player });
});

module.exports = router;
