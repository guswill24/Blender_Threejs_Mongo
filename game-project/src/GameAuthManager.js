const API_URL = "http://localhost:3001/api/auth"; // Ajusta según tu backend

const GameAuthManager = {
  // Registro de usuario
  async register(username, email, password) {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Error en el registro");
    return data;
  },

  // Login de usuario
  async login(email, password) {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Error en el login");

    // Guardar token en localStorage para usarlo en el juego
    localStorage.setItem("gameToken", data.token);
    return data;
  },

  // Obtener token
  getToken() {
    return localStorage.getItem("gameToken");
  },

  // Obtener el usuario autenticado
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) return null;
      return data.user || data;
    } catch {
      return null;
    }
  },

  // ========== SCORE MANAGEMENT ==========

  // Guardar un nuevo puntaje
  async saveScore(score, level = 1, timeCompleted = 0, playerName = null) {
    const token = this.getToken();
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const body = {
      score,
      level,
      timeCompleted,
    };
    if (playerName) {
      body.playerName = playerName;
    }

    try {
      // Usar endpoint de puntaje final
      const res = await fetch(`${API_URL.replace("/auth", "")}/scores/final`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.msg || data.message || "Error al guardar puntaje");
      return data.data || data;
    } catch (err) {
      console.error("Error en saveScore:", err);
      throw err;
    }
  },

  // Obtener los puntajes del usuario autenticado
  async getUserScores() {
    const token = this.getToken();
    if (!token) return [];

    try {
      const res = await fetch(`${API_URL.replace("/auth", "")}/scores/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) return [];
      return data.data || [];
    } catch (err) {
      console.error("Error en getUserScores:", err);
      return [];
    }
  },

  // Obtener el mejor puntaje del usuario
  async getUserHighScore() {
    try {
      const scores = await this.getUserScores();
      if (!scores || scores.length === 0) return 0;
      return Math.max(...scores.map((s) => s.score || 0));
    } catch {
      return 0;
    }
  },

  // Obtener el leaderboard global
  async getLeaderboard(limit = 10) {
    try {
      const res = await fetch(
        `${API_URL.replace("/auth", "")}/scores/leaderboard?limit=${limit}`
      );
      const data = await res.json();
      if (!res.ok) return [];
      return data.data || [];
    } catch (err) {
      console.error("Error en getLeaderboard:", err);
      return [];
    }
  },

  // Obtener posición del usuario en el leaderboard
  async getUserLeaderboardPosition() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(
        `${API_URL.replace("/auth", "")}/scores/user/position`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();
      if (!res.ok) return null;
      return data.data || null;
    } catch (err) {
      console.error("Error en getUserLeaderboardPosition:", err);
      return null;
    }
  },

  // Obtener estadísticas del usuario
  async getUserStats() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(
        `${API_URL.replace("/auth", "")}/scores/user/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();
      if (!res.ok) return null;
      return data.data || null;
    } catch (err) {
      console.error("Error en getUserStats:", err);
      return null;
    }
  },

  // Logout
  logout() {
    localStorage.removeItem("gameToken");
  },
};

export default GameAuthManager;
