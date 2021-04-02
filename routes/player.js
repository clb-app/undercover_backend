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

router.get("/player", isAuthenticated, async (req, res) => {
  try {
    const { _id } = req.player;
    const { reload } = req.query;

    const findPlayer = await Player.findById({ _id });

    if (reload) {
      console.log("if");
      findPlayer.alive = true;
      findPlayer.isAlreadyPlayed = false;
      findPlayer.words = [];
      findPlayer.votes = [];
      findPlayer.voteAgainst = null;
      findPlayer.word = null;
      findPlayer.role = null;

      await findPlayer.save();
    }

    return res.status(200).json({ player: findPlayer });
  } catch (error) {
    return res.status(400).json({ error: err });
  }
});

module.exports = router;
