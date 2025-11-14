import React, { useState, useEffect } from 'react';
import './LeaderBoard.css';

const LeaderBoard = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scores/leaderboard?limit=10');
      const data = await response.json();
      
      if (data.success) {
        setScores(data.data);
      } else {
        setError('Error al cargar el leaderboard');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (position) => {
    switch(position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return position;
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="loading">Cargando leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-container">
        <div className="error">{error}</div>
        <button onClick={fetchLeaderboard} className="retry-btn">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">🏆 Top Jugadores</h2>
      
      <div className="leaderboard-table">
        <div className="table-header">
          <div className="col-position">Pos</div>
          <div className="col-player">Jugador</div>
          <div className="col-score">Puntos</div>
          <div className="col-level">Nivel</div>
        </div>

        {scores.length === 0 ? (
          <div className="no-scores">No hay puntajes registrados</div>
        ) : (
          scores.map((score, index) => (
            <div key={score._id} className={`table-row ${index < 3 ? 'top-three' : ''}`}>
              <div className="col-position">
                {getMedalIcon(index + 1)}
              </div>
              <div className="col-player">
                {score.playerName || score.userId?.username || 'Anónimo'}
              </div>
              <div className="col-score">{score.score.toLocaleString()}</div>
              <div className="col-level">{score.level || '-'}</div>
            </div>
          ))
        )}
      </div>

      <button onClick={fetchLeaderboard} className="refresh-btn">
        🔄 Actualizar
      </button>
    </div>
  );
};

export default LeaderBoard;