const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
  res.send("Saif Ali File Share Server is running!");
});

const rooms = new Map();

wss.on("connection", (ws) => {
  let roomCode = null;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "join") {
        roomCode = data.room;

        if (!rooms.has(roomCode)) {
          rooms.set(roomCode, new Set());
        }

        const room = rooms.get(roomCode);
        room.add(ws);

        for (const client of room) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "peer-joined"
            }));
          }
        }

        return;
      }

      if (roomCode && rooms.has(roomCode)) {
        for (const client of rooms.get(roomCode)) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
          }
        }
      }
    } catch (error) {
      console.error("Message error:", error);
    }
  });

  ws.on("close", () => {
    if (!roomCode || !rooms.has(roomCode)) return;

    const room = rooms.get(roomCode);
    room.delete(ws);

    if (room.size === 0) {
      rooms.delete(roomCode);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
