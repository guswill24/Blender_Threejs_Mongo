import React, { useState } from "react";
import "./ScoreForm.css";

const ScoreForm = ({ onScoreSubmitted, currentScore, currentLevel }) => {
  const [formData, setFormData] = useState({
    playerName: "",
    score: currentScore || 0,
    level: currentLevel || 1,
    timeCompleted: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación
    if (!formData.playerName.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }

    if (formData.score <= 0) {
      setError("El puntaje debe ser mayor a 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/scores/final", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onScoreSubmitted) {
            onScoreSubmitted(data.data);
          }
          resetForm();
        }, 2000);
      } else {
        setError(data.message || "Error al guardar el puntaje");
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      playerName: "",
      score: currentScore || 0,
      level: currentLevel || 1,
      timeCompleted: "",
    });
    setSuccess(false);
    setError("");
  };

  if (success) {
    return (
      <div className="score-form-container">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h3>¡Puntaje guardado exitosamente!</h3>
          <p>Tu puntaje ha sido registrado en el leaderboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="score-form-container">
      <h2 className="form-title">Registrar Puntaje</h2>

      <form onSubmit={handleSubmit} className="score-form">
        <div className="form-group">
          <label htmlFor="playerName">Nombre del Jugador *</label>
          <input
            type="text"
            id="playerName"
            name="playerName"
            value={formData.playerName}
            onChange={handleChange}
            placeholder="Ingresa tu nombre"
            maxLength="50"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="score">Puntaje *</label>
          <input
            type="number"
            id="score"
            name="score"
            value={formData.score}
            onChange={handleChange}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="level">Nivel</label>
          <input
            type="number"
            id="level"
            name="level"
            value={formData.level}
            onChange={handleChange}
            min="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="timeCompleted">Tiempo (opcional)</label>
          <input
            type="text"
            id="timeCompleted"
            name="timeCompleted"
            value={formData.timeCompleted}
            onChange={handleChange}
            placeholder="Ej: 5:30"
          />
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Puntaje"}
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={resetForm}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScoreForm;
