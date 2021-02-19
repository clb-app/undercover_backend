const mongoose = require("mongoose");

const Word = mongoose.model("Word", {
  type: Number,
  word: String,
});

module.exports = Word;
