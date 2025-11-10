import * as THREE from 'three'
import isMobileDevice from '../Utils/Device.js' // Asegúrate de que exista esta función

export default class ThirdPersonCamera {
    constructor(experience, target) {
        this.experience = experience
        this.camera = experience.camera.instance
        this.target = target

        const isMobile = isMobileDevice()

        // Distancia y altura adaptada (MUCHO MÁS ALEJADA)
        this.offset = isMobile
            ? new THREE.Vector3(0, 6, -18)  // móvil: mucho más alto y atrás
            : new THREE.Vector3(0, 5, -15)  // escritorio: también muy alejado

        // Fijar altura para evitar sacudidas
        this.fixedY = isMobile ? 6 : 5
    }

    update() {
        if (!this.target) return

        const basePosition = this.target.position.clone()

        // Dirección del robot (usando quaternion si está disponible)
        const direction = new THREE.Vector3(0, 0, 1)
        if (this.target.quaternion) {
            direction.applyQuaternion(this.target.quaternion).normalize()
        } else {
            direction.applyEuler(this.target.rotation).normalize()
        }

        // Fijar cámara a una altura constante (no sigue saltos ni choques verticales)
        const cameraPosition = new THREE.Vector3(
            basePosition.x + direction.x * this.offset.z,
            this.fixedY,
            basePosition.z + direction.z * this.offset.z
        )

        this.camera.position.lerp(cameraPosition, 0.1)

        // Siempre mirar al centro del robot (con altura fija)
        const lookAt = basePosition.clone().add(new THREE.Vector3(0, 2, 0))
        this.camera.lookAt(lookAt)
    }
}