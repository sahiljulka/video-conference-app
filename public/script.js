var constraints = { audio: true, video: true };
var socket = io();
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: 3000,
});
var videoContainer = document.querySelector("#video-container");
const $ = document.querySelector.bind(document);
const peers = {};
let userMediaStream;

/**
 * when a new user joins we make  a call to the new user along with our stream
 * and the new peer answers with it their stream
 */
const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  call.on("stream", (userVideoStream) => {
    if (peers[userVideoStream.id]) return;
    peers[userVideoStream.id] = true;
    addVideoStream(userVideoStream, false);
  });
};

const addVideoStream = (userVideoStream, isMuted) => {
  const video = document.createElement("video");
  video.muted = isMuted;
  video.srcObject = userVideoStream;
  video.onloadedmetadata = function (e) {
    video.play();
  };
  videoContainer.appendChild(video);
};

navigator.mediaDevices.getUserMedia(constraints).then(function (mediaStream) {
  // to add user own video stream when he connects to the room
  userMediaStream = mediaStream;
  addVideoStream(mediaStream, true);

  // to tell to user that a new user has joined the same room and
  // make a call connection request to the new person by sending my own stream
  socket.on("user-connected", (userId) => {
    var li = document.createElement("li");

    //depict the new user that joined the meeting on chat panel
    li.innerHTML = `${userId} joined the meeting`;
    $(".main__content").appendChild(li);
    scrollDownMessages();
    connectToNewUser(userId, mediaStream);
  });

  //to notify users still in the room the id of the user that left is displayed in the chat panel
  socket.on("user-left", (userId) => {
    var li = document.createElement("li");
    li.innerHTML = `${userId} left the meeting`;
    $(".main__content").appendChild(li);
    scrollDownMessages();
  });

  // to answer to the call made by existing users in the room
  peer.on("call", (call) => {
    // answer the call by own videostream
    call.answer(mediaStream);
    // to add the video stream of the existing user that called
    call.on("stream", (userVideoStream) => {
      if (peers[userVideoStream.id]) return;
      peers[userVideoStream.id] = true;
      addVideoStream(userVideoStream);
    });
  });
});

/**
 * open event is emitted when a new user joins
 * it gives unique id of the user joined
 */
peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

$(".main__footer input"),
  addEventListener("keydown", (e) => {
    if (e.which == 13 && $(".main__footer input").value !== 0) {
      socket.emit("message", $(".main__footer input").value);
      $(".main__footer input").value = "";
    }
  });

socket.on("newchat", (message) => {
  var li = document.createElement("li");
  li.innerHTML = `<b>user</b>: ${message}`;
  $(".main__content").appendChild(li);
  scrollDownMessages();
});

function scrollDownMessages() {
  let diff =
    $(".main__content").scrollHeight - $(".main__content").clientHeight;
  $(".main__content").scrollTo(0, diff);
}

const muteUnmute = (media) => {
  let caller =
    media === "audio"
      ? userMediaStream.getAudioTracks.bind(userMediaStream)
      : userMediaStream.getVideoTracks.bind(userMediaStream);

  let isUnMute = caller()[0].enabled;
  if (isUnMute) {
    caller()[0].enabled = false;
    media == "audio" ? muteUnMuteAudio(true) : muteUnMuteVideo(true);
  } else {
    caller()[0].enabled = true;
    media == "audio" ? muteUnMuteAudio(false) : muteUnMuteVideo(false);
  }
};

const muteUnMuteAudio = (muted) => {
  const html = muted
    ? `<i class="fa fa-lg fa-microphone-slash unmute"></i>
                <span>Unmute</span>`
    : `<i class="fa fa-lg fa-microphone"></i>
                <span>Mute</span>`;
  $(".audio").innerHTML = html;
};

const muteUnMuteVideo = (muted) => {
  const html = muted
    ? ` <i class="fa fa-lg fa-stop unmute"></i>
          <span>Start Video</span>`
    : ` <i class="fa fa-lg fa-play"></i>
          <span>Stop Video</span>`;
  $(".video").innerHTML = html;
};

const leaveMeeting = () => {
  let userId = peer.id;
  videoContainer.innerHTML = "<h1> You have left the meeting </h1>";
  socket.emit("user-leave", ROOM_ID, userId);
  userMediaStream.getTracks().forEach(function (track) {
    track.stop();
  });
};
