const express = require("express");
const formidable = require("express-formidable");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(formidable());
app.use(cors());

const http = require("http").createServer(app);
const io = require("socket.io")(http);

// import des models
const Party = require("./models/Party");
const Player = require("./models/Player");

// import des routes
const partyRoutes = require("./routes/party");
app.use(partyRoutes);
const playerRoutes = require("./routes/player");
app.use(playerRoutes);
const wordRoutes = require("./routes/word");
const { find } = require("./models/Party");
app.use(wordRoutes);

mongoose.connect(process.env.MONGODB_URI_PROD, {
  useCreateIndex: true,
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
});

io.on("connection", (socket) => {
  // ce socket est utilisé lorsqu'un joueur rejoint la partie, il met à jour le navigateur de chaque joueur en incluant le nouveau joueur
  socket.on("joinParty", async (data) => {
    const findParty = await Party.findOne({ code: data.code }).populate(
      "players"
    );

    const findPlayer = await Player.findOne({ token: data.token });
    for (let i = 0; i < findParty.players.length; i++) {
      if (findParty.players[i]._id.equals(findPlayer._id)) {
        io.emit("updateParty", findParty);
        break;
      }
    }
  });

  // ce socket est utilisé lorsque le modérateur lance la partie, il assigne les mots à chaque joueur, change l'ordre des joueurs et met à jour le navigateur de chaque joueur pour jouer
  socket.on("startParty", async (code) => {
    const findParty = await Party.findOne({ code }).populate("players");

    let c = 0,
      u = 0,
      m = 0;

    let i = 0;
    const updatePlayers = [];
    while (i < findParty.players.length) {
      const rand = Math.round(Math.random() * 2);
      const findPlayer = await Player.findOne({
        _id: findParty.players[i]._id,
      });

      if (rand === 0 && c < findParty.roles.civils) {
        // findPlayer =
        findPlayer.word = findParty.words[0].word;
        findPlayer.role = "civil";
        // await findPlayer.save();
        updatePlayers.push(findPlayer);
        c++;
        i++;
      } else if (rand === 1 && u < findParty.roles.undercovers) {
        // findPlayer = await Player.findOne({ _id: oldPlayers[i]._id });
        findPlayer.word = findParty.words[1].word;
        findPlayer.role = "undercover";
        // await findPlayer.save();
        updatePlayers.push(findPlayer);
        u++;
        i++;
      } else if (m < findParty.roles.mrwhite) {
        // findPlayer = await Player.findOne({ _id: oldPlayers[i]._id });
        findPlayer.role = "mrwhite";
        updatePlayers.push(findPlayer);
        m++;
        i++;
      }
      await findPlayer.save();
    }

    const newPlayers = [];
    while (updatePlayers.length > 0) {
      maxIndex = updatePlayers.length - 1;
      const rand = Math.round(Math.random() * maxIndex);
      if (updatePlayers[rand].role === "mrwhite" && newPlayers.length === 0) {
      } else {
        const player = updatePlayers.splice(rand, 1).pop();
        newPlayers.push(player);
      }
    }

    findParty.players = newPlayers;

    await findParty.save();

    io.emit("server-startParty", findParty);
  });

  // ce socket est utilisé lorsqu'un joueur joue, il met à jour la clé "isAlreadyPlayed" du joueur, push le mot dans son array et permet au prochain joueur de jouer
  socket.on("client-play", async (value, player) => {
    const findPlayer = await Player.findById({ _id: player._id });
    findPlayer.isAlreadyPlayed = true;

    const newWords = [...findPlayer.words];
    newWords.push(value);
    findPlayer.words = newWords;

    await findPlayer.save();

    const findParty = await Party.findOne({ _id: player.party_id }).populate(
      "players"
    );

    const newWordsAlreadyUsed = [...findParty.wordsAlreadyUsed];
    newWordsAlreadyUsed.push(value);
    findParty.wordsAlreadyUsed = newWordsAlreadyUsed;

    await findParty.save();

    io.emit("server-startParty", findParty, value, player.nickname);
  });

  // ce socket est utilisé lorsque le dernier joueur joue, il met à jour le navigateur de tous les joueurs pour passer aux votes
  socket.on("client-lapOver", async (party) => {
    const findParty = await Party.findOne({ _id: party._id }).populate(
      "players"
    );
    io.emit("server-lapOver", findParty);
  });

  socket.on("client-startTimer", (mins) => {
    io.emit("server-startTimer", mins);
  });

  socket.on("client-closeVotes", (vote) => {
    console.log(vote);
  });

  // socket utilisé lorsqu'un joueur est éliminé et que le modérateur passe au tour suivant
  socket.on("client-nextLap", async (party, eliminatedPlayer) => {
    /* ici on cherche le joueur éliminé et on change son alive à false pour ne plus le faire jouer */
    const findPlayer = await Player.findById({ _id: eliminatedPlayer._id });
    findPlayer.alive = false;
    // console.log(findPlayer);

    await findPlayer.save();

    /* ici on remet les paramètres de la partie et des joueurs par défaut */
    const findParty = await Party.findById({ _id: party._id }).populate(
      "players"
    );

    findParty.lap += 1;

    const s = eliminatedPlayer.role === "mrwhite" ? "" : "s";
    const newRoles = { ...findParty.roles };
    newRoles[eliminatedPlayer.role + s] =
      newRoles[eliminatedPlayer.role + s] - 1; // on supprime un rôle
    findParty.roles = newRoles;

    await findParty.save();

    const newPlayers = [];
    findParty.players.map(async (player, index) => {
      const updatePlayer = await Player.findById({ _id: player._id });
      updatePlayer.isAlreadyPlayed = false;
      updatePlayer.voteAgainst = null;
      updatePlayer.votes = [];

      await updatePlayer.save();

      newPlayers.push(updatePlayer);

      if (index + 1 === findParty.players.length) {
        console.log("last index");
        findParty.players = newPlayers;

        io.emit("server-startParty", findParty);
      }
    });
  });
});

app.all("*", (req, res) => {
  return res.status(404).json({ error: "Page not found" });
});

http.listen(process.env.PORT, () => {
  console.log("Server Has Started on port " + process.env.PORT);
});
