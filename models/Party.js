const mongoose = require("mongoose");

const Party = mongoose.model("Party", {
  creation_date: new Date(),
  started: {
    type: Boolean,
    default: false,
  },
  ended: {
    type: Boolean,
    default: false,
  },
  moderator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
  },
  players_number: {
    type: Number,
    default: 5,
  },
  players: Array,
  token: String,
  roles: Object,
  words: Object,
});

module.exports = Party;
