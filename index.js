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
});

app.all("*", (req, res) => {
  return res.status(404).json({ error: "Page not found" });
});

http.listen(process.env.PORT, () => {
  console.log("Server Has Started on port " + process.env.PORT);
});
