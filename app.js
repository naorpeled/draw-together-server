const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

let rooms = new Map();
// id, clients, canvas, messages

io.on('connection', function(socket) {
  const roomId = socket.handshake.query.roomId;
  socket.join(roomId);
  if(!rooms.get(roomId)) {
    rooms.set(roomId, {
      clients: [],
      messages: [],
      canvas: ''
    });
  }
  let roomInfo = rooms.get(roomId);
  socket.on('onClientConnect', function(name) {
    console.log(`A user named ${name} has connected to room #${roomId}.`);

    if(roomInfo.canvas) {
      socket.emit('initialCanvasLoad', roomInfo.canvas);
    }

    let info = roomInfo;
    info.clients.push({
      name, 
      id: socket.id
    });

    io.to(roomId).emit('onClientConnect', info.clients, info.messages);
  });

  socket.on('onDraw', function(data) {
    let info = roomInfo;
    const newCanvas = data.canvas;
    info.canvas = newCanvas;

    socket.to(roomId).emit('onDraw', data);
  });

  socket.on('onCanvasClear', () => {
    console.log('Clearning canvas...');
    let info = roomInfo;
    info.canvas = '';

    socket.to(socket.handshake.query.roomId).emit('onCanvasClear');
  });

  socket.on('onChatMessage', (data) => {
    let info = roomInfo;
    
    info.messages.push(data);
    socket.to(roomId).emit('onChatMessage', data);
  })

  socket.on('disconnect', () => {
    let info = roomInfo;
    let clients = info.clients.filter(user => {
      return user.id != socket.id;
    });
    info.clients = clients;

    socket.to(roomId).emit('onClientDisconnect', clients);
  });
});

server.listen(8000, function(){
  console.log('listening on *:8000');
});                