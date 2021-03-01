const mongoose = require("mongoose");

const Party = mongoose.model("Party", {
  creation_date: {
    type: Date,
    default: new Date(),
  },
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
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
  ],
  token: String,
  code: Number,
  roles: Object,
  words: Array,
});

module.exports = Party;
