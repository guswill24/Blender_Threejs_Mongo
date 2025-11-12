import React, { useState, useEffect } from 'react';
import './GameOverScreen.css';

const GameOverScreen = ({
  score,
  level,
  highScore,
  timeElapsed,
  reason = 'Game Over',
  onRestart,
  onMainMenu,
  onSaveScore
}) => {
  const [playerName, setPlayerName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  useEffect(() => {
    // Verificar si es un nuevo high score
    if (highScore && score > highScore) {
      setIsNewHighScore(true);
    }
  }, [score, highScore]);

  const handleSaveScore = async () => {
    if (!playerName.trim()) {
      setSaveError('Por favor ingresa tu nombre');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const response = await fetch('/api/scores/final', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: playerName.trim(),
          score: score,
          level: level,
          timeCompleted: timeElapsed
        })
      });

      const data = await response.json();

      if (data.success) {
        setSaveSuccess(true);
        if (onSaveScore) {
          onSaveScore(data.data);
        }
        setTimeout(() => {
          setShowSaveForm(false);
        }, 2000);
      } else {
        setSaveError(data.message || 'Error al guardar el puntaje');
      }
    } catch (err) {
      setSaveError('Error de conexión. Intenta nuevamente.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-over-overlay">
      <div className="game-over-container">
        {/* Header */}
        <div className="game-over-header">
          {isNewHighScore ? (
            <>
              <div className="trophy-icon">🏆</div>
              <h1 className="game-over-title new-high-score">
                ¡NUEVO RÉCORD!
              </h1>
            </>
          ) : (
            <>
              <div className="skull-icon">💀</div>
              <h1 className="game-over-title">{reason}</h1>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="game-stats">
          <div className="stat-card main-stat">
            <div className="stat-label">Puntaje Final</div>
            <div className="stat-value score-value">{score.toLocaleString()}</div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Nivel Alcanzado</div>
              <div className="stat-value">{level}</div>
            </div>

            {timeElapsed && (
              <div className="stat-card">
                <div className="stat-label">Tiempo</div>
                <div className="stat-value">{formatTime(timeElapsed)}</div>
              </div>
            )}

            {highScore && (
              <div className="stat-card">
                <div className="stat-label">Mejor Puntaje</div>
                <div className="stat-value">{highScore.toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Save Score Section */}
        {!saveSuccess && !showSaveForm && (
          <button
            className="save-score-btn"
            onClick={() => setShowSaveForm(true)}
          >
            💾 Guardar Puntaje en Leaderboard
          </button>
        )}

        {showSaveForm && !saveSuccess && (
          <div className="save-score-form">
            <h3>Guardar tu puntaje</h3>
            <input
              type="text"
              placeholder="Ingresa tu nombre"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength="50"
              className="player-name-input"
              autoFocus
            />

            {saveError && (
              <div className="error-message">⚠️ {saveError}</div>
            )}

            <div className="form-buttons">
              <button
                onClick={handleSaveScore}
                disabled={isSaving}
                className="submit-btn"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setShowSaveForm(false)}
                disabled={isSaving}
                className="cancel-btn"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <p>¡Puntaje guardado exitosamente!</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="game-over-actions">
          <button
            className="action-btn primary-btn"
            onClick={onRestart}
          >
            🔄 Jugar de Nuevo
          </button>

          {onMainMenu && (
            <button
              className="action-btn secondary-btn"
              onClick={onMainMenu}
            >
              🏠 Menú Principal
            </button>
          )}
        </div>

        {/* Motivational Message */}
        <div className="motivational-message">
          {isNewHighScore ? (
            <p>¡Increíble! Has establecido un nuevo récord 🎉</p>
          ) : score > 0 ? (
            <p>¡Buen intento! Puedes hacerlo mejor 💪</p>
          ) : (
            <p>¡No te rindas! La práctica hace al maestro 🎮</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;