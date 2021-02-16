const mongoose = require("mongoose");

const Player = mongoose.model("Player", {
  nickname: {
    type: String,
    required: true,
  },
  role: String,
  word: String,
  party_id: {
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
