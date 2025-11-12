const express = require("express");
const router = express.Router();
const scoreController = require("../controllers/scoreController");

// Middleware de autenticación (opcional, descomenta si lo necesitas)
// const { protect } = require('../middleware/auth');

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

// Obtener el leaderboard/top puntajes
router.get("/leaderboard", scoreController.getLeaderboard);

// Guardar puntaje final (usar desde el cliente cuando la partida termine)
router.post("/final", scoreController.createFinalScore);

// ==========================================
// RUTAS PARA TODOS LOS PUNTAJES
// ==========================================

// GET: Obtener todos los puntajes
// POST: Crear un nuevo puntaje
router
  .route("/")
  .get(scoreController.getAllScores)
  .post(scoreController.createScore); // Agrega protect si necesitas autenticación

// ==========================================
// RUTAS PARA PUNTAJES POR USUARIO
// ==========================================

// Obtener todos los puntajes de un usuario específico
router.get("/user/:userId", scoreController.getUserScores);

// Obtener el mejor puntaje de un usuario
router.get("/user/:userId/best", scoreController.getUserBestScore);

// ==========================================
// RUTAS PARA PUNTAJES INDIVIDUALES
// ==========================================

// GET: Obtener un puntaje por ID
// PUT: Actualizar un puntaje
// DELETE: Eliminar un puntaje
router
  .route("/:id")
  .get(scoreController.getScoreById)
  .put(scoreController.updateScore) // Agrega protect si necesitas autenticación
  .delete(scoreController.deleteScore); // Agrega protect si necesitas autenticación

module.exports = router;
