import * as CANNON from 'cannon-es'

export default class Physics {
    constructor(experience) {
        this.experience = experience
        this.world = new CANNON.World()
        this.world.gravity.set(0, -9.82, 0)
        this.world.broadphase = new CANNON.SAPBroadphase(this.world)
        this.world.allowSleep = true

        // 🧱 Material base
        this.defaultMaterial = new CANNON.Material('default')
        const defaultContact = new CANNON.ContactMaterial(
            this.defaultMaterial,
            this.defaultMaterial,
            {
                friction: 0.6,
                restitution: 0.0
            }
        )
        this.world.defaultContactMaterial = defaultContact
        this.world.addContactMaterial(defaultContact)

        // 🤖 Materiales personalizados
        this.robotMaterial = new CANNON.Material('robot')
        this.obstacleMaterial = new CANNON.Material('obstacle')
        this.wallMaterial = new CANNON.Material('wall')

        // ⚙️ Contacto entre robot y obstáculos (sin empuje, sin rebote)
        const robotObstacleContact = new CANNON.ContactMaterial(
            this.robotMaterial,
            this.obstacleMaterial,
            {
                friction: 0.0,                // Sin fricción
                restitution: 0.0,             // Sin rebote
                contactEquationStiffness: 1e9, // Muy rígido (sin penetración)
                contactEquationRelaxation: 4,
                frictionEquationStiffness: 1e9,
                frictionEquationRelaxation: 4
            }
        )
        this.world.addContactMaterial(robotObstacleContact)

        // ⚙️ Contacto entre robot y paredes (igual)
        const robotWallContact = new CANNON.ContactMaterial(
            this.robotMaterial,
            this.wallMaterial,
            {
                friction: 0.0,
                restitution: 0.0,
                contactEquationStiffness: 1e9,
                contactEquationRelaxation: 4,
                frictionEquationStiffness: 1e9,
                frictionEquationRelaxation: 4
            }
        )
        this.world.addContactMaterial(robotWallContact)

        // 🧩 Detección de colisiones
        this._setupCollisionDetection()
    }

    _setupCollisionDetection() {
        this.world.addEventListener('beginContact', (event) => {
            const bodyA = event.body
            const bodyB = event.target

            if (!bodyA || !bodyB) return

            const modelA = bodyA.userData?.linkedModel
            const modelB = bodyB.userData?.linkedModel

            if (!modelA && !modelB) return

            const models = [modelA, modelB].filter(Boolean)

            // 🌀 Detección de contacto con portal
            models.forEach(model => {
                if (model?.userData?.isActive && model.name === 'portalModel') {
                    console.log("🌀 Portal tocado: pasando al siguiente nivel...")

                    if (this._levelTransitioning) return
                    this._levelTransitioning = true

                    try {
                        this.experience?.levelManager?.nextLevel()
                    } catch (err) {
                        console.error('❌ Error al intentar cambiar de nivel:', err)
                    }

                    setTimeout(() => {
                        this._levelTransitioning = false
                    }, 1500)
                }
            })
        })
    }

    update(delta) {
        // 💣 Limpiar cuerpos corruptos
        this.world.bodies = this.world.bodies.filter(body => {
            if (!body || !Array.isArray(body.shapes) || body.shapes.length === 0) return false
            for (const shape of body.shapes) {
                if (!shape || !shape.body || shape.body !== body) return false
            }
            return true
        })

        // ✅ Simulación estable
        try {
            this.world.step(1 / 60, delta, 3)
        } catch (err) {
            if (err?.message?.includes('wakeUpAfterNarrowphase')) {
                console.warn('⚠️ Cannon encontró un shape corrupto residual. Ignorado.')
            } else {
                console.error('🚫 Cannon step error:', err)
            }
        }
    }
}
