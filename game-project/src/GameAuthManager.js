const API_URL = 'http://localhost:3001/api/auth' // Ajusta según tu backend

const GameAuthManager = {
  // Registro de usuario
  async register(username, email, password) {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.msg || 'Error en el registro')
    return data
  },

  // Login de usuario
  async login(email, password) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.msg || 'Error en el login')

    // Guardar token en localStorage para usarlo en el juego
    localStorage.setItem('gameToken', data.token)
    return data
  },

  // Obtener token
  getToken() {
    return localStorage.getItem('gameToken')
  },

  // Logout
  logout() {
    localStorage.removeItem('gameToken')
  }
}

export default GameAuthManager
