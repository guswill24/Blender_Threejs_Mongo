const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Registro de usuario
exports.register = async (req, res) => {
    const { username, email, password } = req.body
    try {
        const existingUser = await User.findOne({ email })
        if (existingUser) return res.status(400).json({ msg: 'Usuario ya existe' })

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({ username, email, password: hashedPassword })
        await newUser.save()

        res.status(201).json({ msg: 'Usuario creado correctamente' })
    } catch (err) {
        res.status(500).json({ msg: 'Error del servidor', error: err.message })
    }
}

// Login de usuario
exports.login = async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.findOne({ email })
        if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' })

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ msg: 'Contraseña incorrecta' })

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' })

        res.status(200).json({
            msg: 'Login exitoso',
            token,
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        res.status(500).json({ msg: 'Error del servidor', error: err.message })
    }
}
