const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io", {
  cors: { origin: "*" },
  methods: ["GET", "POST"],
})(server);

// KEY     id
// VALUE   clients, canvas, messages
let rooms = new Map();

io.on("connection", function (socket) {
  const roomId = socket.handshake.query.roomId;
  socket.join(roomId);
  // Initialize the room
  if (!rooms.get(roomId)) {
    rooms.set(roomId, {
      clients: [],
      messages: [],
      canvas: "",
    });
  }
  let roomInfo = rooms.get(roomId);

  socket.emit("initialCanvasLoad", roomInfo.canvas);

  socket.on("onClientConnect", function (name) {
    console.log(`A user named ${name} has connected to room #${roomId}.`);

    // Update the list of clients
    roomInfo.clients.push({
      name,
      id: socket.id,
    });

    // Pass the previous chat messages to this user
    socket.emit("onClientConnect", roomInfo.messages);
    // Pass the new user's name to the rest of the clients
    socket.to(roomId).emit("onClientConnect", name);
  });

  socket.on("onDraw", function (data) {
    // Update the current saved canvas
    const newCanvas = data.canvas;
    roomInfo.canvas = newCanvas;

    socket.to(roomId).emit("onDraw", data);
  });

  socket.on("onCanvasClear", () => {
    console.log("Clearning canvas...");
    roomInfo.canvas = "";

    socket.to(roomId).emit("onCanvasClear");
  });

  socket.on("onClientRescale", () => {
    socket.emit("onClientRescale", roomInfo.canvas);
  });

  socket.on("onChatMessage", (data) => {
    roomInfo.messages.push(data);

    socket.to(roomId).emit("onChatMessage", data);
  });

  socket.on("disconnect", () => {
    let clients = roomInfo.clients.filter((user) => {
      return user.id != socket.id;
    });
    roomInfo.clients = clients;

    socket.to(roomId).emit("onClientDisconnect", clients);
  });
});

server.listen(process.env.PORT || 8000, function () {
  console.log("listening on *:" + process.env.PORT || 8000);
});
