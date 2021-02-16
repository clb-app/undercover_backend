const mongoose = require("mongoose");

const Player = mongoose.model("Player", {
  nickname: {
    type: String,
    required,
  },
  role: String,
  word: String,
  id_party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Party",
  },
  player_token: {
    type: String,
    default: null,
  },
  is_ready: {
    type: Boolean,
    default: false,
  },
});

module.exports = Player;
