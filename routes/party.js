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
    const { playersNumber, roles, nickname, timer } = req.fields;
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
      civil_word: words[0].word,
      timer,
    });

    player.party_id = newParty._id;

    const newLap = new Lap({
      party_id: newParty._id,
    });

    await player.save();
    await newParty.save();
    await newLap.save();

    return res.status(200).json({ party: newParty, player });
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
        newPlayers.push(player._id);
        party.players = newPlayers;

        player.party_id = party._id;

        await party.save();
        await player.save();

        return res.status(200).json({ party, player });
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

router.post("/party/vote", isAuthenticated, async (req, res) => {
  try {
    const { player } = req;
    const { _id, reload } = req.fields;

    const checkPlayerIsAlive = await Player.findById({ _id });

    if (player._id === _id) {
      return res.status(400).json({ error: "Can't vote against oneself" });
    } else if (!checkPlayerIsAlive.alive || !player.alive) {
      return res
        .status(400)
        .json({ error: "Can't vote against a player already eliminated" });
    } else {
      if (player.voteAgainst) {
        const findOldPlayerToRemoveVote = await Player.findById({
          _id: player.voteAgainst,
        });

        const updateVotes = [...findOldPlayerToRemoveVote.votes];

        for (let i = 0; i < updateVotes.length; i++) {
          if (updateVotes[i].equals(player._id)) {
            updateVotes.splice(i, 1);
            break;
          }
        }

        findOldPlayerToRemoveVote.votes = updateVotes;

        await findOldPlayerToRemoveVote.save();
      }
      const findPlayerToVoteAgainst = await Player.findById({ _id });

      const newVotes = [...findPlayerToVoteAgainst.votes];
      newVotes.push(player._id);
      findPlayerToVoteAgainst.votes = newVotes;

      await findPlayerToVoteAgainst.save();

      player.voteAgainst = findPlayerToVoteAgainst._id;

      await player.save();
      return res.status(200).json(findPlayerToVoteAgainst);
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

router.post("/party/results", async (req, res) => {
  try {
    const { _id } = req.fields;

    /* on retrouve la party avec l'id */
    const findParty = await Party.findById({ _id }).populate("players");
    console.log("findParty =", findParty);

    /* on recherche le player qui a le plus de votes contre soi */
    let eliminatedPlayer = findParty.players[0];
    // console.log(eliminatedPlayer);
    let eliminatedPlayers = [];
    eliminatedPlayers.push(findParty.players[0]);
    for (let i = 0; i < findParty.players.length; i++) {
      if (findParty.players[i].votes) {
        if (
          eliminatedPlayers[0].votes.length < findParty.players[i].votes.length
        ) {
          eliminatedPlayers = [];
          eliminatedPlayers.push(findParty.players[i]);
          // eliminatedPlayer = findParty.players[i];
          // console.log(eliminatedPlayers);
        } else if (
          eliminatedPlayers[0].votes.length ===
          findParty.players[i].votes.length
        ) {
          // console.log("else if = ", findParty.players[i].nickname);
          for (let j = 0; j < eliminatedPlayers.length; j++) {
            if (eliminatedPlayers[j]._id !== findParty.players[i]._id) {
              if (j + 1 === eliminatedPlayers.length) {
                // console.log("pushed");
                eliminatedPlayers.push(findParty.players[i]);
              }
            } else {
              break;
            }
          }
        }
      }
      // console.log(eliminatedPlayer);
    }

    // console.log(eliminatedPlayers);

    let next = null;
    if (eliminatedPlayers.length === 1) {
      // console.log("result if");
      /** on supprime un joueur d'une des catégories (civils undercovers ou mrwhite) */
      const s = eliminatedPlayers[0].role === "mrwhite" ? "" : "s";
      findParty.roles[eliminatedPlayers[0].role + s] =
        findParty.roles[eliminatedPlayers[0].role + s] - 1;

      /** ici on planifie la prochaine étape du jeu */
      /**
       * WHITE = mr white a été éliminé, il pourra donc tenter de saisir le mot des civils
       * OVER = les undercovers sont plus nombreux que les civils
       * WIN = il ne reste que des civils
       * NEXT = on continue car il reste suffisamment de joueurs
       */
      // let next = null;
      if (eliminatedPlayers[0].role === "mrwhite") {
        next = "WHITE";
      } else if (findParty.roles.civils === 1) {
        next = "OVER";
      } else if (
        findParty.roles.undercovers === 0 &&
        findParty.roles.mrwhite === 0
      ) {
        next = "WIN";
      } else {
        next = "NEXT";
      }

      const newEliminatedPlayer = await Player.find({
        _id: eliminatedPlayers[0]._id,
      }).populate("votes");

      return res
        .status(200)
        .json({ eliminatedPlayer: newEliminatedPlayer, next });
    } else {
      next = "EQUAL";

      return res
        .status(200)
        .json({ eliminatedPlayer: eliminatedPlayers, next });
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

module.exports = router;
