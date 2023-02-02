const socket = io();
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnections;
let myDataChannel;

const welcome = document.getElementById("welcome");
const call = document.getElementById("call");

call.hidden = true;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label == camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {}
}
async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraContrains = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraContrains : initialConstrains);
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
  if (!cameraOff) {
    cameraBtn.innerText = "Camera Off";
    cameraOff = true;
  } else {
    cameraBtn.innerText = "Camera On";
    cameraOff = false;
  }
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);

  if (myPeerConnections) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnections.getSenders().find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

socket.on("welcome", async () => {
  myDataChannel = myPeerConnections.createDataChannel("chat");
  myDataChannel.addEventListener("message", console.log);
  console.log("made data channel");
  const offer = await myPeerConnections.createOffer();
  myPeerConnections.setLocalDescription(offer);
  console.log("setn the offer");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  myPeerConnections.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", console.log);
  });
  myPeerConnections.setRemoteDescription(offer);
  const answer = await myPeerConnections.createAnswer();
  myPeerConnections.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  myPeerConnections.setRemoteDescription(answer);
});
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnections.addIceCandidate(ice);
});
//RTC
function makeConnection() {
  myPeerConnections = new RTCPeerConnection({
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302", "stun:stun4.l.google.com:19302"],
      },
    ],
  });
  myPeerConnections.addEventListener("icecandidate", handleIce);
  myPeerConnections.addEventListener("addstream", handleAddStream);
  myStream.getTracks().forEach((track) => myPeerConnections.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  console.log("got event from my Peer");
  console.log(data);
  const peersFace = document.getElementById("peersFace");
  peersFace.srcObject = data.stream;
}
