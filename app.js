const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

let clients = [];

io.on('connection', function(socket){
  socket.on('onClientConnect', function(name) {
    console.log(`A user named ${name} has connected.`);
    clients.push(name);
    io.emit('onClientConnect', clients);
  });
  
  socket.on('onClientDisconnect', function(name){
    clients.splice(clients.indexOf(name), 1); 
    io.emit('onClientDisconnect', clients);
  });

  socket.on('onDraw', function(data) {
    io.emit('onDraw', data);
  });

  socket.on('onCanvasClear', () => {
    console.log('clearning canvas');
    io.emit('onCanvasClear');
  })
});

server.listen(8000, function(){
  console.log('listening on *:8000');
});                