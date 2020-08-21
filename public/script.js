var constraints = { audio: true, video: true };

navigator.mediaDevices.getUserMedia(constraints).then(function (mediaStream) {
  console.log(mediaStream);
  var videoContainer = document.querySelector("#video-container");
  const video = document.createElement("video");
  video.onloadedmetadata = function (e) {
    video.play();
  };
  video.srcObject = mediaStream;
  videoContainer.appendChild(video);
});
