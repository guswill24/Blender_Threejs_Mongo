// FinalPrizeParticles.js - Portal ultra épico
import * as THREE from 'three'

export default class FinalPrizeParticles {
  constructor({ scene, targetPosition, experience }) {
    this.scene = scene
    this.experience = experience
    this.clock = new THREE.Clock()

    this.target = targetPosition.clone()

    // 🔥 Fuego persistente
    this.fireCount = 150
    this.firePositions = new Float32Array(this.fireCount * 3)
    this.fireColors = new Float32Array(this.fireCount * 3)
    this.fireSpeeds = new Float32Array(this.fireCount)
    this.fireAngles = new Float32Array(this.fireCount)
    this.fireRadii = new Float32Array(this.fireCount)
    this.fireYOffsets = new Float32Array(this.fireCount)

    const firePalette = [
      new THREE.Color(0xff4500), // rojo intenso
      new THREE.Color(0xffa500), // naranja
      new THREE.Color(0xffff00), // amarillo
    ]

    for (let i = 0; i < this.fireCount; i++) {
      const i3 = i * 3
      const angle = Math.random() * Math.PI * 2
      const radius = 1.5 + Math.random() * 2.5
      const yOffset = Math.random() * 1.5
      this.fireAngles[i] = angle
      this.fireRadii[i] = radius
      this.fireSpeeds[i] = 0.5 + Math.random() * 1.5
      this.fireYOffsets[i] = yOffset

      this.firePositions[i3 + 0] = this.target.x + Math.cos(angle) * radius
      this.firePositions[i3 + 1] = this.target.y + yOffset
      this.firePositions[i3 + 2] = this.target.z + Math.sin(angle) * radius

      const color = firePalette[Math.floor(Math.random() * firePalette.length)]
      this.fireColors[i3 + 0] = color.r
      this.fireColors[i3 + 1] = color.g
      this.fireColors[i3 + 2] = color.b
    }

    this.fireGeometry = new THREE.BufferGeometry()
    this.fireGeometry.setAttribute('position', new THREE.BufferAttribute(this.firePositions, 3))
    this.fireGeometry.setAttribute('color', new THREE.BufferAttribute(this.fireColors, 3))

    this.fireMaterial = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.firePoints = new THREE.Points(this.fireGeometry, this.fireMaterial)
    this.scene.add(this.firePoints)

    // ✨ Chispas persistentes con estela
    this.sparkCount = 80
    this.sparkPositions = new Float32Array(this.sparkCount * 3)
    this.sparkPrevPositions = new Float32Array(this.sparkCount * 3)
    this.sparkSpeeds = new Float32Array(this.sparkCount)
    for (let i = 0; i < this.sparkCount; i++) {
      const i3 = i * 3
      this.sparkPositions[i3 + 0] = this.target.x
      this.sparkPositions[i3 + 1] = this.target.y + Math.random() * 0.5
      this.sparkPositions[i3 + 2] = this.target.z
      this.sparkPrevPositions[i3 + 0] = this.sparkPositions[i3 + 0]
      this.sparkPrevPositions[i3 + 1] = this.sparkPositions[i3 + 1]
      this.sparkPrevPositions[i3 + 2] = this.sparkPositions[i3 + 2]
      this.sparkSpeeds[i] = 0.02 + Math.random() * 0.06
    }

    this.sparkGeometry = new THREE.BufferGeometry()
    this.sparkGeometry.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3))
    this.sparkMaterial = new THREE.PointsMaterial({
      color: 0xffffaa,
      size: 0.2,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    this.sparkPoints = new THREE.Points(this.sparkGeometry, this.sparkMaterial)
    this.scene.add(this.sparkPoints)

    // 🌈 Halo intenso
    const haloTexture = new THREE.TextureLoader().load('/textures/halo.png')
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTexture,
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.5,
    }))
    this.halo.position.copy(this.target)
    this.halo.scale.set(10, 10, 10)
    this.scene.add(this.halo)

    // ⚡ Relámpagos y truenos
    this.lightningGroup = new THREE.Group()
    this.scene.add(this.lightningGroup)
    this.lightningTimer = 0

    this.experience.time.on('tick', this.update)
  }

  update = () => {
    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()

    // 🔥 Fuego persistente
    for (let i = 0; i < this.fireCount; i++) {
      const i3 = i * 3
      this.fireAngles[i] += this.fireSpeeds[i] * delta
      this.fireRadii[i] *= 0.995
      this.firePositions[i3 + 0] = this.target.x + Math.cos(this.fireAngles[i]) * this.fireRadii[i]
      this.firePositions[i3 + 2] = this.target.z + Math.sin(this.fireAngles[i]) * this.fireRadii[i]
      this.firePositions[i3 + 1] = this.target.y + this.fireYOffsets[i] + Math.sin(elapsed * 2 + i) * 0.2
    }
    this.fireGeometry.attributes.position.needsUpdate = true

    // ✨ Chispas con estela
    for (let i = 0; i < this.sparkCount; i++) {
      const i3 = i * 3
      this.sparkPrevPositions[i3 + 0] = this.sparkPositions[i3 + 0]
      this.sparkPrevPositions[i3 + 1] = this.sparkPositions[i3 + 1]
      this.sparkPrevPositions[i3 + 2] = this.sparkPositions[i3 + 2]

      this.sparkPositions[i3 + 0] += (Math.random() - 0.5) * this.sparkSpeeds[i]
      this.sparkPositions[i3 + 1] += this.sparkSpeeds[i] * 1.0
      this.sparkPositions[i3 + 2] += (Math.random() - 0.5) * this.sparkSpeeds[i]

      if (this.sparkPositions[i3 + 1] > this.target.y + 5) this.sparkPositions[i3 + 1] = this.target.y
    }
    this.sparkGeometry.attributes.position.needsUpdate = true

    // 🌈 Halo pulsante
    this.halo.material.opacity = 0.5 + Math.sin(elapsed * 2) * 0.4
    this.halo.material.rotation = elapsed * 0.5

    // ⚡ Truenos y relámpagos
    this.lightningTimer -= delta
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 1 + Math.random() * 2 // intervalo variable
      this.spawnLightning()
    }
    this.lightningGroup.children.forEach((light) => {
      light.material.opacity -= delta * 0.5
      if (light.material.opacity <= 0) this.lightningGroup.remove(light)
    })
  }

  spawnLightning() {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([
      this.target.x + (Math.random() - 0.5) * 5, this.target.y + 5, this.target.z + (Math.random() - 0.5) * 5,
      this.target.x, this.target.y, this.target.z
    ])
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 })
    const line = new THREE.Line(geometry, material)
    this.lightningGroup.add(line)

    // sonido trueno opcional
    if (window.userInteracted && this.experience.soundManager?.thunder) {
      this.experience.soundManager.thunder.play()
    }
  }

  dispose() {
    this.experience.time.off('tick', this.update)
    this.scene.remove(this.firePoints)
    this.fireGeometry.dispose()
    this.fireMaterial.dispose()

    this.scene.remove(this.sparkPoints)
    this.sparkGeometry.dispose()
    this.sparkMaterial.dispose()

    this.scene.remove(this.halo)
    this.halo.material.dispose()

    this.lightningGroup.children.forEach(l => {
      l.geometry.dispose()
      l.material.dispose()
    })
    this.scene.remove(this.lightningGroup)
  }
}
