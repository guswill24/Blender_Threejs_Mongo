import * as THREE from 'three'

export default class FirstPersonCamera {
    constructor(experience, targetObject) {
        this.experience = experience
        this.scene = experience.scene
        this.camera = experience.camera.instance
        this.target = targetObject // robot.group
        this.offset = new THREE.Vector3(0, 5, 0) // altura de los ojos (muy alto)
        
        // Configuración de zoom
        this.distance = 30 // Distancia inicial (MUCHO más alejado)
        this.minDistance = 10 // Distancia mínima
        this.maxDistance = 60 // Distancia máxima
        this.zoomSpeed = 1.5 // Velocidad del zoom
        
        // Event listener para el scroll
        this.boundScrollHandler = this.handleScroll.bind(this)
        this.setupScrollZoom()
    }

    setupScrollZoom() {
        window.addEventListener('wheel', this.boundScrollHandler, { passive: false })
    }

    handleScroll(event) {
        event.preventDefault()
        
        // Ajustar distancia basado en el scroll
        this.distance += event.deltaY * 0.01 * this.zoomSpeed
        
        // Limitar la distancia entre min y max
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance))
    }

    update() {
        if (!this.target) return

        // Posición del robot (actualizada desde robot.body en Robot.update())
        const basePosition = this.target.position.clone()

        // Dirección hacia donde mira el robot
        const direction = new THREE.Vector3(0, 0, 1)
        direction.applyQuaternion(this.target.quaternion).normalize()

        // Posición de la cámara detrás del robot
        const cameraPosition = basePosition
            .clone()
            .add(this.offset) // Elevar a altura de los ojos
            .add(direction.clone().multiplyScalar(-this.distance)) // Alejar detrás del robot

        // Posicionar la cámara con suavizado
        this.camera.position.lerp(cameraPosition, 0.06)

        // Punto al que mira la cámara (adelante del robot)
        const lookAt = basePosition
            .clone()
            .add(new THREE.Vector3(0, 2, 0)) // A la altura media del robot
            .add(direction.multiplyScalar(10)) // Mirar mucho más hacia adelante

        this.camera.lookAt(lookAt)
    }
    
    // Método para limpiar el event listener
    dispose() {
        window.removeEventListener('wheel', this.boundScrollHandler)
    }
}