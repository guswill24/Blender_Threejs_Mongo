import * as THREE from 'three'

export default class Prize {
    constructor({ model, position, scene, role = 'default', sound = null }) {
        this.scene = scene
        this.collected = false
        this.role = role
        this.sound = sound

        this.pivot = new THREE.Group()
        this.pivot.position.copy(position)
        this.pivot.userData.interactivo = true
        this.pivot.userData.collected = false
        this.pivot.userData.isPrize = true

        if (model.scene) {
            this.model = model.scene.clone()
        } else if (model.clone && typeof model.clone === 'function') {
            this.model = model.clone()
        } else {
            console.warn('⚠️ Modelo no clonable, usando referencia directa')
            this.model = model
        }

        const visual = this.model.children.find(child => child.isMesh) || this.model
        visual.userData.interactivo = true
        visual.userData.isPrize = true

        const bbox = new THREE.Box3().setFromObject(visual)
        const center = new THREE.Vector3()
        bbox.getCenter(center)
        visual.position.sub(center)
        this.pivot.add(visual)

        const collisionRadius = 1.2
        const collisionGeometry = new THREE.SphereGeometry(collisionRadius, 8, 8)
        const collisionMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            visible: false
        })
        
        this.collisionSphere = new THREE.Mesh(collisionGeometry, collisionMaterial)
        this.collisionSphere.userData.isPrize = true
        this.collisionSphere.userData.prizeRef = this
        this.pivot.add(this.collisionSphere)
        this.scene.add(this.pivot)

        this.pivot.visible = true

        // 🔹 MONEDAS más pequeñas
        if (role === 'default') {
            this.pivot.scale.set(0.6, 0.6, 0.6)
        }

        // 🌀 PORTAL GIGANTE
        if (role === 'finalPrize') {
            this.pivot.scale.set(3, 3, 3)
            const glowGeometry = new THREE.SphereGeometry(2, 32, 32)
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            })
            this.glowSphere = new THREE.Mesh(glowGeometry, glowMaterial)
            this.pivot.add(this.glowSphere)
            console.log('🌀 Portal gigante creado y visible')
        }

        this.floatOffset = Math.random() * Math.PI * 2
        this.initialY = position.y

        console.log(`🪙 Premio creado en: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}) [role: ${this.role}]`)
    }

    update(delta) {
        if (this.collected) return

        this.pivot.rotation.y += delta * 2

        const floatSpeed = 2
        const floatAmount = 0.15
        this.floatOffset += delta * floatSpeed
        this.pivot.position.y = this.initialY + Math.sin(this.floatOffset) * floatAmount
        
        if (this.role === 'finalPrize' && this.glowSphere) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.3
            this.glowSphere.material.opacity = pulse
            this.glowSphere.rotation.y -= delta * 1.5
        }
    }

    checkPlayerDistance(playerPosition) {
        if (this.collected) return false
        const distance = this.pivot.position.distanceTo(playerPosition)
        return distance < 1.2
    }

    collect() {
        if (this.collected) return
        this.collected = true
        if (this.sound && typeof this.sound.play === 'function') {
            this.sound.play()
        }
        this.animateCollection()
        this.pivot.traverse(child => { child.userData.collected = true })
    }

    animateCollection() {
        const duration = 0.3
        const startScale = this.pivot.scale.clone()
        const endScale = new THREE.Vector3(0, 0, 0)
        const startTime = Date.now()

        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            this.pivot.scale.lerpVectors(startScale, endScale, eased)
            this.pivot.position.y += 0.05
            if (progress < 1) requestAnimationFrame(animate)
            else this.scene.remove(this.pivot)
        }

        animate()
    }

    destroy() {
        this.scene.remove(this.pivot)
        this.pivot.traverse((child) => {
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose())
                } else {
                    child.material.dispose()
                }
            }
        })
    }
}
