import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export default class Floor {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene
        this.physics = this.experience.physics

        console.log('🟩 Inicializando Floor...')

        this.setGeometry()
        this.setTexture()
            .then(() => {
                this.setMaterial()
                this.setMesh()
                this.setPhysics()
            })
            .catch(err => {
                console.error('❌ Error al cargar la textura, usando color de fallback:', err)
                this.useFallbackMaterial()
                this.setMesh()
                this.setPhysics()
            })
    }

    setGeometry() {
        this.size = { width: 300, height: 3, depth: 500 }
        this.geometry = new THREE.BoxGeometry(
            this.size.width,
            this.size.height,
            this.size.depth
        )
        console.log('📦 Geometría creada:', this.size)
    }

    async setTexture() {
        console.log('🖼️ Intentando cargar textura desde: /textures/piso.jpg')

        const loader = new THREE.TextureLoader()
        try {
            this.texture = await loader.loadAsync('/textures/piso.jpg')
            console.log('✅ Textura cargada correctamente:', this.texture)

            this.texture.colorSpace = THREE.SRGBColorSpace
            this.texture.wrapS = THREE.RepeatWrapping
            this.texture.wrapT = THREE.RepeatWrapping
            this.texture.repeat.set(20, 20)

            console.log('🔁 Configuración de textura completada.')
        } catch (error) {
            console.error('🚨 No se pudo cargar la textura:', error)
            throw error
        }
    }

    setMaterial() {
        this.material = new THREE.MeshStandardMaterial({
            map: this.texture,
            roughness: 0.8,
            metalness: 0.0
        })
        console.log('🎨 Material con textura aplicado.')
    }

    useFallbackMaterial() {
        this.material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.8,
            metalness: 0.0
        })
        console.log('🎨 Usando material de fallback (color gris).')
    }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.set(0, -this.size.height / 2, 0)
        this.mesh.receiveShadow = true
        this.scene.add(this.mesh)
        console.log('🧱 Mesh del piso añadido a la escena.')
    }

    setPhysics() {
        const shape = new CANNON.Box(
            new CANNON.Vec3(
                this.size.width / 2,
                this.size.height / 2,
                this.size.depth / 2
            )
        )

        this.body = new CANNON.Body({
            mass: 0, // estático
            shape: shape,
            position: new CANNON.Vec3(0, -this.size.height / 2, 0),
            material: this.physics.defaultMaterial
        })

        this.physics.world.addBody(this.body)
        console.log('⚙️ Física del piso configurada.')
    }
}
