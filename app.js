const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

let clients = [];
let currentCanvas = null;
let chatMessages = [];

io.on('connection', function(socket) {
  socket.on('onClientConnect', function(name) {
    socket.emit('initialCanvasLoad', currentCanvas);
    console.log(`A user named ${name} has connected.`);
    clients.push({
      name, 
      id: socket.id
    });
    io.emit('onClientConnect', clients, chatMessages);
  });

  socket.on('onDraw', function(data) {
    currentCanvas = data.canvas;
    socket.broadcast.emit('onDraw', data);
  });

  socket.on('onCanvasClear', () => {
    console.log('Clearning canvas...');
    currentCanvas = null;
    socket.broadcast.emit('onCanvasClear');
  });

  socket.on('onChatMessage', (data) => {
    chatMessages.push(data);
    socket.broadcast.emit('onChatMessage', data);
  })

  socket.on('disconnect', () => {
    clients =  clients.filter(user => {
      return user.id != socket.id;
    });
    socket.broadcast.emit('onClientDisconnect', clients);
  });
});

server.listen(8000, function(){
  console.log('listening on *:8000');
});                