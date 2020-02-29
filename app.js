const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// KEY     id
// VALUE   clients, canvas, messages
let rooms = new Map();

io.on('connection', function(socket) {
  const roomId = socket.handshake.query.roomId;
  socket.join(roomId);
  // Initialize the room
  if(!rooms.get(roomId)) {
    rooms.set(roomId, {
      clients: [],
      messages: [],
      canvas: ''
    });
  }
  let roomInfo = rooms.get(roomId);

  socket.emit('initialCanvasLoad', roomInfo.canvas);
  
  socket.on('onClientConnect', function(name) {
    console.log(`A user named ${name} has connected to room #${roomId}.`);

    // Update the list of clients
    roomInfo.clients.push({
      name, 
      id: socket.id
    });

    // We want to only transfer the connected users and previous messages
    const data = {
      users: roomInfo.clients,
      messages: roomInfo.messages
    }

    // Pass the list of clients and previous chat messages to this user
    socket.emit('onClientConnect', data);
    // Pass only the updated list of clients to the rest of the users
    socket.to(roomId).emit('onClientConnect', {users: data.users});
  });

  socket.on('onDraw', function(data) {
    // Update the current saved canvas
    const newCanvas = data.canvas;
    roomInfo.canvas = newCanvas;

    socket.to(roomId).emit('onDraw', data);
  });

  socket.on('onCanvasClear', () => {
    console.log('Clearning canvas...');
    roomInfo.canvas = '';

    socket.to(roomId).emit('onCanvasClear');
  });

  socket.on('onClientRescale', () => {
    const data = {
      canvas: roomInfo.canvas
    }
    socket.emit('onClientRescale', data);
  });

  socket.on('onChatMessage', (data) => {
    roomInfo.messages.push(data);

    socket.to(roomId).emit('onChatMessage', data);
  });

  socket.on('disconnect', () => {
    let clients = roomInfo.clients.filter(user => {
      return user.id != socket.id;
    });
    roomInfo.clients = clients;

    socket.to(roomId).emit('onClientDisconnect', clients);
  });
});

server.listen(8000, function(){
  console.log('listening on *:8000');
});                