const express = require("express");
const router = express.Router();
const uid2 = require("uid2");

const Party = require("../models/Party");
const Player = require("../models/Player");
const Word = require("../models/Word");
const Lap = require("../models/Lap");

const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/party/new", async (req, res) => {
  try {
    const { playersNumber, roles, nickname } = req.fields;
    const token = req.headers.authorization.replace("Bearer ", "");

    console.log(roles);

    let player;
    if (token) {
      player = await Player.findOne({ token });
    }

    if (!player) {
      player = new Player({
        nickname,
        token,
        word: null,
      });
    }

    const code = Math.round(Math.random() * (999999 - 100000) + 100000);

    const findWords = await Word.find();

    const rand = Math.round(Math.random() * findWords.length - 1);
    const words = [];
    words.push(findWords[rand]);
    for (let i = 0; i < findWords.length; i++) {
      if (
        findWords[i].type === words[0].type &&
        findWords[i].word !== words[0].word
      ) {
        words.push(findWords[i]);
        break;
      }
    }

    const newParty = new Party({
      moderator_id: player._id,
      players_number: playersNumber,
      players: [player],
      token: uid2(16),
      code,
      roles,
      words,
    });

    player.party_id = newParty._id;

    const newLap = new Lap({
      party_id: newParty._id,
    });

    await player.save();
    await newParty.save();
    await newLap.save();

    return res.status(200).json(newParty);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

router.get("/party/join", async (req, res) => {
  try {
    const { code, nickname } = req.query;
    const token = req.headers.authorization.replace("Bearer ", "");

    const party = await Party.findOne({ code });
    let player = await Player.findOne({ token });

    if (party) {
      if (party.players.length < party.players_number) {
        if (player) {
          if (party.players.indexOf(player._id) !== -1) {
            return res
              .status(200)
              .json({ response: "You are already in the party" });
          }
        } else {
          player = new Player({
            nickname,
            token,
            word: null,
          });
        }

        const newPlayers = [...party.players];
        newPlayers.push(player);
        party.players = newPlayers;

        player.party_id = party._id;

        await party.save();
        await player.save();

        return res.status(200).json(party);
      } else {
        return res.status(401).json({ unauthorized: "The party is full" });
      }
    } else {
      return res.status(409).json({ conflict: "The code does not exist" });
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

router.get("/party/status", isAuthenticated, async (req, res) => {
  try {
    const { _id } = req.player;
    const { code } = req.query;

    const findParty = await Party.findOne({ code });

    for (let i = 0; i < findParty.players.length; i++) {
      if (findParty.players[i]._id.equals(_id)) {
        return res.status(200).json(findParty);
      }
    }

    return res
      .status(401)
      .json({ unauthorized: "You are not registered for this party" });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

router.get("/party/validation/", isAuthenticated, async (req, res) => {
  try {
    const { player } = req;

    player.is_ready = true;

    const party = await Party.findById(player.party_id);

    await player.save();

    return res.status(200).json(party);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

router.get("/party/play", isAuthenticated, async (req, res) => {
  try {
    const { player } = req;
    const { newWord } = req.query;

    const newWords = [...player.words];
    newWords.push(newWord);

    player.words = newWords;
    player.is_turn = false;

    await player.save();

    const party = await Party.findById(player.party_id);
    let nextPlayer;
    for (let i = 0; i < party.players.length; i++) {
      if (
        party.players[i]._id.equals(player._id) &&
        i + 1 < party.players.length
      ) {
        nextPlayer = party.players[i + 1]._id;
        break;
      }
    }

    let updateNextPlayer;
    if (nextPlayer) {
      updateNextPlayer = await Player.findOneAndUpdate(
        { _id: nextPlayer },
        { is_turn: true }
      );
    }

    return res.status(200).json(updateNextPlayer);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

module.exports = router;
