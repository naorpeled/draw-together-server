const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('onDraw', function(data) {
    socket.broadcast.emit('onDraw', data);
  });
  socket.on('onCanvasClear', () => {
    console.log('clearning canvas');
    socket.broadcast.emit('onCanvasClear');
  })
});

server.listen(8000, function(){
  console.log('listening on *:8000');
});                