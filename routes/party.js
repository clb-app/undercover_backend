const express = require("express");
const router = express.Router();
const uid2 = require("uid2");

const Party = require("../models/Party");
const Player = require("../models/Player");
const Loop = require("../models/Loop");

router.post("/party/create", async (req, res) => {
  try {
    const { pseudo, playersNumber, roles } = req.fields;

    const code = Math.round(Math.random() * (9999 - 1000) + 1000);

    const newPlayer = new Player({
      nickname: pseudo,
    });

    const newParty = new Party({
      moderator_id: newPlayer._id,
      players_number: playersNumber,
      players: [newPlayer._id],
      token: uid2(16),
      code,
      roles,
    });

    newPlayer.party_id = newParty._id;

    const newLoop = new Loop({
      party_id: newParty._id,
    });

    await newPlayer.save();
    await newParty.save();
    await newLoop.save();

    return res.status(200).json({ token: newParty.token, code });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

module.exports = router;
