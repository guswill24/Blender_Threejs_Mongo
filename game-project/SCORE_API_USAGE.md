# Guía de uso: GameAuthManager - Score Management

El archivo `GameAuthManager.js` ahora contiene métodos completos para gestionar puntajes del usuario. Aquí están todos los métodos disponibles:

## 1. **Autenticación de Usuario**

### `getCurrentUser()`
Obtiene la información del usuario autenticado.

```javascript
import GameAuthManager from './GameAuthManager'

const user = await GameAuthManager.getCurrentUser()
if (user) {
  console.log('Usuario:', user.username)
} else {
  console.log('No autenticado')
}
```

---

## 2. **Guardar Puntajes**

### `saveScore(score, level, timeCompleted, playerName)`
Guarda un nuevo puntaje en la base de datos.

**Parámetros:**
- `score` (número, requerido): Puntos obtenidos
- `level` (número, opcional): Nivel completado (default: 1)
- `timeCompleted` (número, opcional): Tiempo en segundos (default: 0)
- `playerName` (string, opcional): Nombre del jugador (default: null, usa usuario autenticado)

**Ejemplo:**
```javascript
try {
  const result = await GameAuthManager.saveScore(
    1500,           // score
    2,              // level
    180,            // timeCompleted (3 minutos)
    'ArthurPlayer'  // playerName (opcional)
  )
  console.log('Puntaje guardado:', result)
} catch (err) {
  console.error('Error:', err.message)
}
```

**Uso desde `gameOverScreen.jsx`:**
```javascript
const handleSaveScore = async () => {
  try {
    const savedScore = await GameAuthManager.saveScore(
      score,      // del prop
      level,      // del prop
      timeElapsed,// del prop
      playerName  // input del usuario
    )
    onSaveScore && onSaveScore(savedScore)
  } catch (err) {
    setSaveError(err.message)
  }
}
```

---

## 3. **Obtener Puntajes del Usuario**

### `getUserScores()`
Obtiene todos los puntajes del usuario autenticado.

```javascript
const userScores = await GameAuthManager.getUserScores()
console.log('Mis puntajes:', userScores)
// Output: [
//   { score: 2000, level: 3, timeCompleted: 240 },
//   { score: 1500, level: 2, timeCompleted: 180 },
//   ...
// ]
```

### `getUserHighScore()`
Obtiene el mejor puntaje del usuario autenticado.

```javascript
const highScore = await GameAuthManager.getUserHighScore()
console.log('Mi mejor puntaje:', highScore)
```

---

## 4. **Leaderboard Global**

### `getLeaderboard(limit)`
Obtiene el leaderboard global (top jugadores).

**Parámetros:**
- `limit` (número, opcional): Cantidad de jugadores a obtener (default: 10)

```javascript
const leaderboard = await GameAuthManager.getLeaderboard(10)
console.log('Top 10 jugadores:', leaderboard)
// Output: [
//   { playerName: 'Player1', score: 5000, level: 3, position: 1 },
//   { playerName: 'Player2', score: 4500, level: 3, position: 2 },
//   ...
// ]
```

**Uso desde `leaderBoard.js`:**
```javascript
useEffect(() => {
  const fetchLeaderboard = async () => {
    const data = await GameAuthManager.getLeaderboard(10)
    setScores(data)
  }
  fetchLeaderboard()
}, [])
```

### `getUserLeaderboardPosition()`
Obtiene la posición del usuario autenticado en el leaderboard.

```javascript
const position = await GameAuthManager.getUserLeaderboardPosition()
if (position) {
  console.log(`Tu posición: #${position.rank} con ${position.score} puntos`)
}
```

---

## 5. **Estadísticas del Usuario**

### `getUserStats()`
Obtiene estadísticas agregadas del usuario.

```javascript
const stats = await GameAuthManager.getUserStats()
if (stats) {
  console.log('Estadísticas:', {
    totalScores: stats.totalScores,
    bestScore: stats.bestScore,
    averageScore: stats.averageScore,
    totalLevels: stats.totalLevels,
    averageTime: stats.averageTime
  })
}
```

---

## Ejemplos de Integración

### En `gameOverScreen.jsx`:
```javascript
import GameAuthManager from './GameAuthManager'

const handleSaveScore = async () => {
  if (!playerName.trim()) {
    setSaveError('Por favor ingresa tu nombre')
    return
  }

  setIsSaving(true)
  setSaveError('')

  try {
    const savedScore = await GameAuthManager.saveScore(
      score,
      level,
      timeElapsed,
      playerName
    )
    setSaveSuccess(true)
    onSaveScore && onSaveScore(savedScore)
    setTimeout(() => setShowSaveForm(false), 2000)
  } catch (err) {
    setSaveError(err.message || 'Error al guardar puntaje')
  } finally {
    setIsSaving(false)
  }
}

// También puedes obtener el high score del usuario
useEffect(() => {
  const getHighScore = async () => {
    const high = await GameAuthManager.getUserHighScore()
    setHighScore(high)
  }
  getHighScore()
}, [])
```

### En `leaderBoard.js`:
```javascript
import GameAuthManager from '../GameAuthManager'

const fetchLeaderboard = async () => {
  try {
    setLoading(true)
    const data = await GameAuthManager.getLeaderboard(10)
    setScores(data)
  } catch (err) {
    setError('Error al cargar leaderboard')
  } finally {
    setLoading(false)
  }
}
```

### En un componente de perfil:
```javascript
import GameAuthManager from './GameAuthManager'

useEffect(() => {
  const loadUserData = async () => {
    const [user, stats, position] = await Promise.all([
      GameAuthManager.getCurrentUser(),
      GameAuthManager.getUserStats(),
      GameAuthManager.getUserLeaderboardPosition()
    ])
    
    setUser(user)
    setStats(stats)
    setPosition(position)
  }
  loadUserData()
}, [])
```

---

## Notas Importantes

1. **Autenticación requerida para métodos de usuario:**
   - `getUserScores()`, `getUserHighScore()`, `getUserLeaderboardPosition()`, `getUserStats()` requieren token válido
   - Si no hay token, retornan valores por defecto/null

2. **Endpoints esperados en backend:**
   - `POST /api/scores` - Guardar puntaje
   - `GET /api/scores/user` - Obtener puntajes del usuario
   - `GET /api/scores/leaderboard` - Obtener leaderboard
   - `GET /api/scores/user/position` - Obtener posición del usuario
   - `GET /api/scores/user/stats` - Obtener estadísticas

3. **Manejo de errores:**
   - Todos los métodos tienen try/catch
   - Los métodos de GET retornan arrays/objetos vacíos si hay error
   - `saveScore()` lanza excepciones para que el componente maneje el error

4. **Token de autenticación:**
   - Se envía automáticamente en el header `Authorization: Bearer {token}`
   - Se obtiene de `localStorage.getItem('gameToken')`
