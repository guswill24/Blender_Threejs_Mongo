import React, { useState } from 'react'
import GameAuthManager from './GameAuthManager'

const AuthScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      if (isLogin) {
        const res = await GameAuthManager.login(email, password)
        setMessage(`¡Bienvenido ${res.user.username}!`)
        onLoginSuccess()
      } else {
        await GameAuthManager.register(username, email, password)
        setMessage('Registro exitoso. Inicia sesión ahora.')
        setIsLogin(true)
      }
    } catch (err) {
      setMessage(err.message || 'Error en la autenticación')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isLogin ? 'Login' : 'Registro'}</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            {isLogin ? 'Login' : 'Registrarse'}
          </button>
        </form>

        {/* Botón toggle login/registro */}
        <button
          style={styles.toggle}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Login'}
        </button>

        {/* NUEVO: Botón para iniciar sin conexión */}
        <button
          style={{ ...styles.toggle, marginTop: '10px', color: '#34C759' }}
          onClick={onLoginSuccess}
        >
          Iniciar sin conexión
        </button>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f7',
    fontFamily: '"San Francisco", Helvetica, Arial, sans-serif'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  },
  title: {
    marginBottom: '30px',
    fontWeight: '600',
    fontSize: '28px',
    color: '#111111'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '12px 15px',
    borderRadius: '12px',
    border: '1px solid #d1d1d6',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  button: {
    marginTop: '10px',
    padding: '12px 15px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#007aff',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  toggle: {
    marginTop: '20px',
    background: 'none',
    border: 'none',
    color: '#007aff',
    fontSize: '14px',
    cursor: 'pointer',
  },
  message: {
    marginTop: '15px',
    fontSize: '14px',
    color: '#ff3b30'
  }
}

export default AuthScreen
