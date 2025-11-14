require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const blockRoutes = require("./routes/blockRoutes");
const authRoutes = require("./routes/authRoutes"); // NUEVO
const scoreRoutes = require("./routes/scoreRoutes"); // Importar rutas de scores

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
        <h1>API de bloques</h1>
        <p>Usa la ruta /blocks para interactuar con los bloques.</p>
        <p>Usa la ruta /auth para registrar o loguear usuarios.</p>
        <p>Ejemplo de uso en el puerto ${port}:</p>
    `);
});

// Rutas
app.use("/api/blocks", blockRoutes);
app.use("/api/auth", authRoutes); // NUEVO
app.use("/api/scores", scoreRoutes); // Rutas de scores

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

/**
 * Implementación experiencia multijugador
 */
const http = require("http");
const socketio = require("socket.io");

const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: "*" },
});

let players = {};

io.on("connection", (socket) => {
  console.log(`🟢 Usuario conectado: ${socket.id}`);

  socket.on("new-player", (data) => {
    console.log(`👤 Jugador inicializado: ${socket.id}`, data);

    players[socket.id] = {
      id: socket.id,
      position: data.position || { x: 0, y: 0, z: 0 },
      rotation: data.rotation || 0,
      color: data.color || "#ffffff",
    };

    socket.broadcast.emit("spawn-player", players[socket.id]);
    socket.emit("players-update", players);

    const others = Object.entries(players)
      .filter(([id]) => id !== socket.id)
      .map(([id, info]) => ({
        id,
        position: info.position,
        rotation: info.rotation,
        color: info.color,
      }));
    socket.emit("existing-players", others);
  });

  socket.on("update-position", ({ position, rotation }) => {
    if (players[socket.id]) {
      players[socket.id].position = position;
      players[socket.id].rotation = rotation;
      socket.broadcast.emit("update-player", {
        id: socket.id,
        position,
        rotation,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Usuario desconectado: ${socket.id}`);
    delete players[socket.id];
    io.emit("remove-player", socket.id);
    io.emit("players-update", players);
  });
});

server.listen(port, () => {
  console.log(`✅ Servidor corriendo en puerto ${port}`);
});
