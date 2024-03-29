const Player = require("../models/Player");

const isAuthenticated = async (req, res, next) => {
  console.log("isAutenticated");
  try {
    const token = req.headers.authorization.replace("Bearer ", "");
    const checkToken = await Player.findOne({ token });

    if (checkToken) {
      req.player = checkToken;
      console.log("next");
      return next();
    } else {
      return res.status(401).json("Unauthorized");
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

module.exports = isAuthenticated;
