const router = require("express").Router();

const Word = require("../models/Word");

router.post("/word/new", async (req, res) => {
  try {
    const { data } = req.fields;

    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].words.length; j++) {
        const newWord = new Word({
          type: data[i].type,
          word: data[i].words[j],
        });

        await newWord.save();
      }
    }
    return res.status(200).json({ success: "Completed" });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

module.exports = router;
