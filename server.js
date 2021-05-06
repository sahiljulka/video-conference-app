const { PORT } = require("./keys.js");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();
var http = require("http").createServer(app);
const io = require("socket.io")(http);

const { ExpressPeerServer } = require("peer");
const { Server } = require("http");
const peerServer = ExpressPeerServer(http, {
  debug: true,
});

app.use(express.static("public"));

app.use("/peerjs", peerServer);
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

/**
 * this is executed everytime a user connects to the server
 * it gives a socket object that can subscribe to events
 **/
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("a user disconnected");
  });

  // triggered when the leave meeting button is clicked
  socket.on("user-leave", (ROOM_ID, userId) => {
    socket.leave(ROOM_ID);
    socket.to(ROOM_ID).broadcast.emit("user-left", userId);
    console.log(`${userId} left the room`);
  });

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);

    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("message", (message) => {
      /**
       * we use io.to because we want even the sender to receive the message that it has sent to show on the chat screen(due to our implementation)
       * if we use socket.to(roomId).broadcast.emit() then the message would go to other clients not the sender
       */
      io.to(roomId).emit("newchat", message);
    });
  });
});

http.listen(PORT, (req, res) => {
  console.log(`Listening on ${PORT}`);
});
