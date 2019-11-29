'use strict';

var isCaller = false;

var pc;
var localStream;
var remoteStream;
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

////////////////////////////////////////////////////
//显示本地视频
navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true
})
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  if(!isCaller){
    console.log('send ready', room);
    socket.emit('ready', room);
  }
}

//////////////////////////////////
//建立连接
var socket = io.connect();
////////////////////////////////////////////
//加入或创建房间
var room = 'foo';
socket.emit('create or join', room);
console.log('Attempted to create or  join room', room);
socket.on('created', function(room) {
  console.log('Created room ' + room);
  isCaller = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room +' is full');
});

socket.on('joined', function(room) {
  console.log('joined: ' , room);
});

//////////////////////////////////////
socket.on('offer', function (message) {
  console.log('recv offer', message);
  pc = new RTCPeerConnection(null);
  pc.setRemoteDescription(new RTCSessionDescription(message));
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  pc.createAnswer().then(function (answer) {
    pc.setLocalDescription(answer);
    console.log('send answer', answer);
    socket.emit('answer', room,answer);
  });
  pc.addEventListener('icecandidate', function (event) {
    var iceCandidate = event.candidate;
    if (iceCandidate) {
       console.log('send  ice ',iceCandidate);
       socket.emit('ice', room,iceCandidate);
    }
  });
  pc.addEventListener('addstream', function (event) {
    console.log('Remote stream added.');
    remoteStream = event.stream;
    remoteVideo.srcObject = remoteStream;
  });
});

socket.on('answer', function (message) {
    console.log('recv answer', message);
    pc.setRemoteDescription(new RTCSessionDescription(message));
});

socket.on('ice', function (message) {
     console.log('recv ice', message);
     pc.addIceCandidate(new RTCIceCandidate(message));
});

const offerOptions = {
    offerToReceiveVideo: 1,
    offerToReceiveAudio: 1
};

socket.on('call', function(client) {
  console.log('rev call ');
  pc = new RTCPeerConnection(null);
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  pc.createOffer(offerOptions).then(function (offer) {
     pc.setLocalDescription(offer);
     console.log('send  offer ',offer);
     socket.emit('offer', room,offer);
  });
  pc.addEventListener('icecandidate', function (event) {
    var iceCandidate = event.candidate;
    if (iceCandidate) {
      console.log('send  ice ',iceCandidate);
      socket.emit('ice', room,iceCandidate);
    }
  });
  pc.addEventListener('addstream', function (event) {
    console.log('Remote stream added.');
    remoteStream = event.stream;
    remoteVideo.srcObject = remoteStream;
  });
});