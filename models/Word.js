const mongoose = require("mongoose");

const Word = mongoose.model("Word", {
  word1: String,
  word2: String,
});

module.exports = Word;
