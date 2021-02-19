const express = require("express");
const formidable = require("express-formidable");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(formidable());
app.use(cors());

// import des routes
const partyRoutes = require("./routes/party");
app.use(partyRoutes);
const playerRoutes = require("./routes/player");
app.use(playerRoutes);

mongoose.connect(process.env.MONGODB_URI, {
  useCreateIndex: true,
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
});

app.all("*", (req, res) => {
  return res.status(404).json({ error: "Page not found" });
});

app.listen(process.env.PORT, () => {
  console.log("Server Has Started on port " + process.env.PORT);
});
