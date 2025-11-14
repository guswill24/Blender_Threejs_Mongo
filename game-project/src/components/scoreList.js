import React, { useState, useEffect } from 'react';
import './ScoreList.css';

const ScoreList = ({ userId }) => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'user'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'score', 'level'

  useEffect(() => {
    fetchScores();
  }, [filter, userId]);

  const fetchScores = async () => {
    try {
      setLoading(true);
      let url = '/api/scores';
      
      if (filter === 'user' && userId) {
        url = `/api/scores/user/${userId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setScores(data.data);
      } else {
        setError('Error al cargar los puntajes');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scoreId) => {
    if (!window.confirm('¿Estás seguro de eliminar este puntaje?')) {
      return;
    }

    try {
      const response = await fetch(`/api/scores/${scoreId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setScores(scores.filter(score => score._id !== scoreId));
        alert('Puntaje eliminado exitosamente');
      } else {
        alert('Error al eliminar el puntaje');
      }
    } catch (err) {
      alert('Error de conexión');
      console.error(err);
    }
  };

  const sortScores = (scoresToSort) => {
    const sorted = [...scoresToSort];
    
    switch(sortBy) {
      case 'score':
        return sorted.sort((a, b) => b.score - a.score);
      case 'level':
        return sorted.sort((a, b) => b.level - a.level);
      case 'date':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="score-list-container">
        <div className="loading">Cargando puntajes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="score-list-container">
        <div className="error">{error}</div>
        <button onClick={fetchScores} className="retry-btn">
          Reintentar
        </button>
      </div>
    );
  }

  const sortedScores = sortScores(scores);

  return (
    <div className="score-list-container">
      <div className="list-header">
        <h2 className="list-title">Lista de Puntajes</h2>
        
        <div className="controls">
          {userId && (
            <div className="filter-group">
              <label>Filtrar:</label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todos</option>
                <option value="user">Mis puntajes</option>
              </select>
            </div>
          )}
          
          <div className="sort-group">
            <label>Ordenar por:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">Fecha</option>
              <option value="score">Puntaje</option>
              <option value="level">Nivel</option>
            </select>
          </div>
        </div>
      </div>

      {sortedScores.length === 0 ? (
        <div className="no-scores">
          No hay puntajes para mostrar
        </div>
      ) : (
        <div className="scores-grid">
          {sortedScores.map((score) => (
            <div key={score._id} className="score-card">
              <div className="card-header">
                <h3 className="player-name">
                  {score.playerName || score.userId?.username || 'Anónimo'}
                </h3>
                <div className="score-value">{score.score.toLocaleString()}</div>
              </div>
              
              <div className="card-body">
                <div className="score-detail">
                  <span className="label">Nivel:</span>
                  <span className="value">{score.level || 'N/A'}</span>
                </div>
                
                {score.timeCompleted && (
                  <div className="score-detail">
                    <span className="label">Tiempo:</span>
                    <span className="value">{score.timeCompleted}</span>
                  </div>
                )}
                
                <div className="score-detail">
                  <span className="label">Fecha:</span>
                  <span className="value">{formatDate(score.createdAt)}</span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  onClick={() => handleDelete(score._id)}
                  className="delete-btn"
                  title="Eliminar puntaje"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="list-footer">
        <button onClick={fetchScores} className="refresh-btn">
          🔄 Actualizar lista
        </button>
        <div className="total-count">
          Total: {sortedScores.length} puntaje{sortedScores.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default ScoreList;