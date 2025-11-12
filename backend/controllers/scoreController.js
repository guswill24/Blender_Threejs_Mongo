const Score = require("../models/Score");

// Obtener todos los puntajes (con paginación opcional)
exports.getAllScores = async (req, res) => {
  try {
    const { limit = 10, sort = -1 } = req.query;

    const scores = await Score.find()
      .sort({ score: sort })
      .limit(parseInt(limit))
      .populate("userId", "username email");

    res.status(200).json({
      success: true,
      count: scores.length,
      data: scores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los puntajes",
      error: error.message,
    });
  }
};

// Obtener un puntaje por ID
exports.getScoreById = async (req, res) => {
  try {
    const score = await Score.findById(req.params.id).populate(
      "userId",
      "username email"
    );

    if (!score) {
      return res.status(404).json({
        success: false,
        message: "Puntaje no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: score,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener el puntaje",
      error: error.message,
    });
  }
};

// Crear un nuevo puntaje
exports.createScore = async (req, res) => {
  try {
    const { userId, playerName, score, level, timeCompleted } = req.body;

    const newScore = await Score.create({
      userId,
      playerName,
      score,
      level,
      timeCompleted,
    });

    res.status(201).json({
      success: true,
      message: "Puntaje creado exitosamente",
      data: newScore,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error al crear el puntaje",
      error: error.message,
    });
  }
};

// Actualizar un puntaje
exports.updateScore = async (req, res) => {
  try {
    const score = await Score.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!score) {
      return res.status(404).json({
        success: false,
        message: "Puntaje no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Puntaje actualizado exitosamente",
      data: score,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error al actualizar el puntaje",
      error: error.message,
    });
  }
};

// Eliminar un puntaje
exports.deleteScore = async (req, res) => {
  try {
    const score = await Score.findByIdAndDelete(req.params.id);

    if (!score) {
      return res.status(404).json({
        success: false,
        message: "Puntaje no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Puntaje eliminado exitosamente",
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar el puntaje",
      error: error.message,
    });
  }
};

// Obtener el top de puntajes (leaderboard)
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await Score.find()
      .sort({ score: -1 })
      .limit(parseInt(limit))
      .populate("userId", "username");

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener el leaderboard",
      error: error.message,
    });
  }
};

// Obtener puntajes de un usuario específico
exports.getUserScores = async (req, res) => {
  try {
    const scores = await Score.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: scores.length,
      data: scores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los puntajes del usuario",
      error: error.message,
    });
  }
};

// Obtener el mejor puntaje de un usuario
exports.getUserBestScore = async (req, res) => {
  try {
    const bestScore = await Score.findOne({ userId: req.params.userId })
      .sort({ score: -1 })
      .limit(1);

    if (!bestScore) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron puntajes para este usuario",
      });
    }

    res.status(200).json({
      success: true,
      data: bestScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener el mejor puntaje",
      error: error.message,
    });
  }
};

// Crear un puntaje final — este endpoint está pensado para ser llamado
// desde el cliente cuando la partida finaliza. Valida lo básico y delega
// en la función createScore para evitar duplicar la lógica.
exports.createFinalScore = async (req, res) => {
  try {
    const { score } = req.body;

    // Validación mínima: score debe ser número y no negativo
    if (typeof score !== "number" || isNaN(score) || score < 0) {
      return res.status(400).json({
        success: false,
        message: "Puntaje inválido. Debe ser un número mayor o igual a 0.",
      });
    }

    // Marcar timestamp opcional para saber cuándo se guardó
    req.body.savedAt = new Date();

    // Reusar la lógica existente de creación
    return await exports.createScore(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al guardar el puntaje final",
      error: error.message,
    });
  }
};
