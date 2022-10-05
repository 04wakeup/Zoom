import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
  console.log(socket);
});

// wss.on("connection", (socket) => {
// const wss = new WebSocket.Server({ server });
//   sockets.push(socket);
//   socket["nickname"] = "Annoymous";
//   console.log("Connected to Browser");
//   socket.on("close", () => console.log("Disconnected from Browser !"));
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg);
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`));
//       case "nickname":
//         socket["nickname"] = message.payload;
//     }
//   });
//   // socket.send("Hello!");
// });
httpServer.listen(3000, handleListen);
