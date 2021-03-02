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
  isAlreadyPlayed: {
    type: Boolean,
    default: false,
  },
  is_ready: {
    type: Boolean,
    default: false,
  },
  words: Array,
  token: String,
  votes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
  ],
  voteAgainst: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
    default: null,
  },
});

module.exports = Player;
