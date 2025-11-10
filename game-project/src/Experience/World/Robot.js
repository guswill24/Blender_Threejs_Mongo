import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import Sound from './Sound.js'

export default class Robot {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = this.experience.time
        this.physics = this.experience.physics
        this.keyboard = this.experience.keyboard
        this.debug = this.experience.debug
        this.points = 0

        this.setModel()
        this.setSounds()
        this.setPhysics()
        this.setAnimation()
    }

    setModel() {
        this.model = this.resources.items.robotModel.scene
        this.model.scale.set(1.3, 1.3, 1.3)
        this.model.position.set(0, -0.1, 0) // Centrar respecto al cuerpo físico

        this.group = new THREE.Group()
        this.group.add(this.model)
        this.scene.add(this.group)

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true
            }
        })
    }

    setPhysics() {
        const shape = new CANNON.Sphere(0.4)

        this.body = new CANNON.Body({
            mass: 2,
            shape: shape,
            position: new CANNON.Vec3(0, 1.2, 0),
            linearDamping: 0.05,
            angularDamping: 0.9
        })

        this.body.angularFactor.set(0, 1, 0)

        // Estabilización inicial
        this.body.velocity.setZero()
        this.body.angularVelocity.setZero()
        this.body.sleep()
        this.body.material = this.physics.robotMaterial

        this.physics.world.addBody(this.body)
        
        // Activar cuerpo después de que el mundo haya dado al menos un paso de simulación
        setTimeout(() => {
            this.body.wakeUp()
        }, 100)
    }

    setSounds() {
        this.walkSound = new Sound('/sounds/robot/walking.mp3', { loop: true, volume: 0.5 })
        this.jumpSound = new Sound('/sounds/robot/jump.mp3', { volume: 0.8 })
    }

    setAnimation() {
        this.animation = {}
        this.animation.mixer = new THREE.AnimationMixer(this.model)

        const animations = this.resources.items.robotModel.animations
        
        this.animation.actions = {}
        
        // 🎬 Buscar animaciones por nombre
        this.animation.actions.walk = this.findAnimation(animations, 'walk') || animations[10]
        this.animation.actions.jump_start = this.findAnimation(animations, 'jump_start') || animations[3]
        this.animation.actions.ragdoll = this.findAnimation(animations, 'ragdoll') || animations[1]
        this.animation.actions.idle = this.findAnimation(animations, 'idle') || animations[2]
        this.animation.actions.dance = this.findAnimation(animations, 'dance') || animations[0]
        
        // Configurar todas las acciones encontradas
        Object.keys(this.animation.actions).forEach(key => {
            if (this.animation.actions[key]) {
                this.animation.actions[key] = this.animation.mixer.clipAction(this.animation.actions[key])
            }
        })

        this.animation.actions.current = this.animation.actions.idle
        this.animation.actions.current.play()

        // Configurar jump_start como animación de una sola vez
        if (this.animation.actions.jump_start) {
            this.animation.actions.jump_start.setLoop(THREE.LoopOnce)
            this.animation.actions.jump_start.clampWhenFinished = true
            this.animation.actions.jump_start.onFinished = () => {
                this.animation.play('idle')
            }
        }

        // Configurar ragdoll
        if (this.animation.actions.ragdoll) {
            this.animation.actions.ragdoll.setLoop(THREE.LoopOnce)
            this.animation.actions.ragdoll.clampWhenFinished = true
        }

        this.animation.play = (name) => {
            const newAction = this.animation.actions[name]
            const oldAction = this.animation.actions.current

            if (!newAction) {
                console.warn(`⚠️ Animación "${name}" no encontrada`)
                return
            }

            newAction.reset()
            newAction.play()
            newAction.crossFadeFrom(oldAction, 0.3)
            this.animation.actions.current = newAction

            // Sonidos según animación
            if (name === 'walk') {
                this.walkSound.play()
            } else {
                this.walkSound.stop()
            }

            if (name === 'jump_start') {
                this.jumpSound.play()
            }
        }
    }

    // 🔍 Método auxiliar para encontrar animación por nombre
    findAnimation(animations, name) {
        return animations.find(clip => 
            clip.name.toLowerCase().includes(name.toLowerCase())
        )
    }

    update() {
        if (this.animation.actions.current === this.animation.actions.ragdoll) return
        
        const delta = this.time.delta * 0.001
        this.animation.mixer.update(delta)

        const keys = this.keyboard.getState()
        const moveForce = 80
        const turnSpeed = 2.5
        let isMoving = false

        // Limitar velocidad si es demasiado alta
        const maxSpeed = 15
        this.body.velocity.x = Math.max(Math.min(this.body.velocity.x, maxSpeed), -maxSpeed)
        this.body.velocity.z = Math.max(Math.min(this.body.velocity.z, maxSpeed), -maxSpeed)

        // Dirección hacia adelante
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion)

        // Salto con jump_start
        if (keys.space && this.body.position.y <= 0.51) {
            this.body.applyImpulse(new CANNON.Vec3(forward.x * 0.5, 3, forward.z * 0.5))
            this.animation.play('jump_start')
            return
        }

        // No permitir que el robot salga del escenario
        if (this.body.position.y > 10) {
            console.warn('⚠️ Robot fuera del escenario. Reubicando...')
            this.body.position.set(0, 1.2, 0)
            this.body.velocity.set(0, 0, 0)
        }

        // Movimiento hacia adelante
        if (keys.up) {
            const forward = new THREE.Vector3(0, 0, 1)
            forward.applyQuaternion(this.group.quaternion)
            this.body.applyForce(
                new CANNON.Vec3(forward.x * moveForce, 0, forward.z * moveForce),
                this.body.position
            )
            isMoving = true
        }

        // Movimiento hacia atrás
        if (keys.down) {
            const backward = new THREE.Vector3(0, 0, -1)
            backward.applyQuaternion(this.group.quaternion)
            this.body.applyForce(
                new CANNON.Vec3(backward.x * moveForce, 0, backward.z * moveForce),
                this.body.position
            )
            isMoving = true
        }

        // Rotación
        if (keys.left) {
            this.group.rotation.y += turnSpeed * delta
            this.body.quaternion.setFromEuler(0, this.group.rotation.y, 0)
        }
        if (keys.right) {
            this.group.rotation.y -= turnSpeed * delta
            this.body.quaternion.setFromEuler(0, this.group.rotation.y, 0)
        }

        // Animaciones según movimiento (usando walk)
        if (isMoving) {
            if (this.animation.actions.current !== this.animation.actions.walk) {
                this.animation.play('walk')
            }
        } else {
            if (this.animation.actions.current !== this.animation.actions.idle) {
                this.animation.play('idle')
            }
        }

        // Sincronización física → visual
        this.group.position.copy(this.body.position)
    }

    // Método para mover el robot desde el exterior VR
    moveInDirection(dir, speed) {
        if (!window.userInteracted || !this.experience.renderer.instance.xr.isPresenting) {
            return
        }

        // Si hay controles móviles activos
        const mobile = window.experience?.mobileControls
        if (mobile?.intensity > 0) {
            const dir2D = mobile.directionVector
            const dir3D = new THREE.Vector3(dir2D.x, 0, dir2D.y).normalize()

            const adjustedSpeed = 250 * mobile.intensity
            const force = new CANNON.Vec3(dir3D.x * adjustedSpeed, 0, dir3D.z * adjustedSpeed)

            this.body.applyForce(force, this.body.position)

            if (this.animation.actions.current !== this.animation.actions.walk) {
                this.animation.play('walk')
            }

            // Rotar suavemente en dirección de avance
            const angle = Math.atan2(dir3D.x, dir3D.z)
            this.group.rotation.y = angle
            this.body.quaternion.setFromEuler(0, this.group.rotation.y, 0)
        }
    }

    die() {
        if (this.animation.actions.current !== this.animation.actions.ragdoll) {
            this.animation.actions.current.fadeOut(0.2)
            this.animation.actions.ragdoll.reset().fadeIn(0.2).play()
            this.animation.actions.current = this.animation.actions.ragdoll

            this.walkSound.stop()

            // 💥 Eliminar cuerpo del mundo para evitar errores
            if (this.physics.world.bodies.includes(this.body)) {
                this.physics.world.removeBody(this.body)
            }
            this.body = null

            // Ajustes visuales
            this.group.position.y -= 0.5
            this.group.rotation.x = -Math.PI / 2

            console.log('💀 Robot ha muerto (ragdoll)')
        }
    }
}