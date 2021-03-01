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
app.use(wordRoutes);

mongoose.connect(process.env.MONGODB_URI, {
  useCreateIndex: true,
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
});

io.on("connection", (socket) => {
  socket.on("joinParty", async (data) => {
    const findParty = await Party.findOne({ code: data.code }).populate(
      "players"
    );
    console.log(findParty);
    const findPlayer = await Player.findOne({ token: data.token });
    for (let i = 0; i < findParty.players.length; i++) {
      if (findParty.players[i]._id.equals(findPlayer._id)) {
        io.emit("updateParty", findParty);
        break;
      }
    }
  });

  socket.on("startParty", async (code) => {
    console.log(code);
    const findParty = await Party.findOne({ code }).populate("players");

    let c = 0,
      u = 0,
      m = 0;

    let i = 0;
    const oldPlayers = [...findParty.players];
    while (i < oldPlayers.length) {
      const rand = Math.round(Math.random() * 2);
      let findPlayer;

      if (rand === 0 && c < findParty.roles.civils) {
        findPlayer = await Player.findOne({ _id: oldPlayers[i]._id });
        findPlayer.word = findParty.words[0].word;
        await findPlayer.save();
        c++;
        i++;
      } else if (rand === 1 && u < findParty.roles.undercovers) {
        findPlayer = await Player.findOne({ _id: oldPlayers[i]._id });
        findPlayer.word = findParty.words[1].word;
        await findPlayer.save();
        u++;
        i++;
      } else if (m < findParty.roles.mrwhite) {
        m++;
        i++;
      }
    }

    const newPlayers = [];
    while (oldPlayers.length > 0) {
      maxIndex = oldPlayers.length - 1;
      const rand = Math.round(Math.random() * maxIndex);
      const player = oldPlayers.splice(rand, 1).pop();
      newPlayers.push(player);
    }

    findParty.players = newPlayers;

    await findParty.save();

    io.emit("server-startParty", findParty);
  });

  socket.on("client-play", async (value, player) => {
    console.log("playing...");
    const findPlayer = await Player.findById({ _id: player._id });
    findPlayer.isAlreadyPlayed = true;

    const newWords = [...findPlayer.words];
    newWords.push(value);
    findPlayer.words = newWords;

    await findPlayer.save();

    const findParty = await Party.findOne({ _id: player.party_id }).populate(
      "players"
    );

    io.emit("server-startParty", findParty);
  });

  socket.on("client-lapOver", async (party) => {
    const findParty = await Party.findOne({ _id: party._id }).populate(
      "players"
    );
    io.emit("server-lapOver", findParty);
  });
});

app.all("*", (req, res) => {
  return res.status(404).json({ error: "Page not found" });
});

http.listen(process.env.PORT, () => {
  console.log("Server Has Started on port " + process.env.PORT);
});
