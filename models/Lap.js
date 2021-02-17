const mongoose = require("mongoose");

const Lap = mongoose.model("Lap", {
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Party",
  },
  lap_number: {
    type: Number,
    default: 1,
  },
  eliminated_players: Array,
});

module.exports = Lap;
