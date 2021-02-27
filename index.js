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
const { Socket } = require("net");
const { find } = require("./models/Party");
app.use(wordRoutes);

mongoose.connect(process.env.MONGODB_URI, {
  useCreateIndex: true,
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
});

// const findPartyFunc = async (data) => {
//   return
// };

// const findPlayerFunc = async (data) => {
//   return
// };

io.on("connection", (socket) => {
  // socket.emit("hello", `hello ${socket.id}`);

  socket.on("joinParty", async (data) => {
    const findParty = await Party.findOne({ code: data.code });
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
    const findParty = await Party.findOne({ code });

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
        oldPlayers[i].word = findParty.words[0].word;
        c++;
        i++;
      } else if (rand === 1 && u < findParty.roles.undercovers) {
        findPlayer = await Player.findOne({ _id: oldPlayers[i]._id });
        findPlayer.word = findParty.words[1].word;
        await findPlayer.save();
        oldPlayers[i].word = findParty.words[1].word;
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
  });
});

app.all("*", (req, res) => {
  return res.status(404).json({ error: "Page not found" });
});

http.listen(process.env.PORT, () => {
  console.log("Server Has Started on port " + process.env.PORT);
});
