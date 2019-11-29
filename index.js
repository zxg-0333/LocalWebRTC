'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(8080);

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {
  console.log('有用户加入进来');

  socket.on('ready',function(room){
    console.log('event ready');
    socket.to(room).emit('call');
  });

  socket.on('offer',function(room,message){
     console.log('event offer');
     socket.to(room).emit('offer',message);
  });

  socket.on('answer',function(room,message){
    console.log(' event answer');
    socket.to(room).emit('answer',message);
  });

  socket.on('ice',function(room,message){
    console.log('event ice'+'Client ID ' + socket.id );
     socket.to(room).emit('ice',message);
  });

  socket.on('create or join', function(room) {
    console.log('Received request to create or join room ' + room);
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log('Room ' + room + ' now has ' + numClients + ' client(s)');
    if (numClients === 0) {
      socket.join(room);
      console.log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);
    } else if (numClients === 1) {
      console.log('Client ID ' + socket.id + ' joined room ' + room);
      socket.join(room);
      socket.emit('joined', socket.id);
    } else { // max two clients
      socket.emit('full', room);
    }
  });
});
