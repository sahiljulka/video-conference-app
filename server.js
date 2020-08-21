const { PORT } = require("./keys.js");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

app.listen(PORT, (req, res) => {
  console.log(`Listening on ${PORT}`);
});
