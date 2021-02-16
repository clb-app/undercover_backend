const mongoose = require("mongoose");

const Loop = mongoose.model("Loop", {
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Party",
  },
  loop_number: {
    type: Number,
    default: 1,
  },
  eliminated_players: Array,
});

module.exports = Loop;
