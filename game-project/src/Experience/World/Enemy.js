import * as THREE from "three";
import * as SkeletonUtilsModule from "three/examples/jsm/utils/SkeletonUtils.js";
// Compatibilidad: algunos empaquetados exponen SkeletonUtils como named export,
// otros como default, y otros exponen directamente las funciones.
const SkeletonUtils =
  SkeletonUtilsModule?.SkeletonUtils ??
  SkeletonUtilsModule?.default ??
  SkeletonUtilsModule;
import * as CANNON from "cannon-es";
import FinalPrizeParticles from "../Utils/FinalPrizeParticles.js";
import Sound from "./Sound.js";

export default class Enemy {
  constructor({ scene, physicsWorld, playerRef, model, position, experience }) {
    this.experience = experience;
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.playerRef = playerRef;
    this.baseSpeed = 1.0;
    this.speed = this.baseSpeed;
    this.delayActivation = 0;

    // Sonido de proximidad
    this.proximitySound = new Sound("/sounds/alert.ogg", {
      loop: true,
      volume: 0,
    });
    this._soundCooldown = 0;
    this.proximitySound.play();

    // Modelo visual: clonar correctamente la plantilla GLTF (soporta skinning)
    let srcScene = model?.scene ? model.scene : model;
    let animations = model?.animations ?? [];

    // Usar SkeletonUtils.clone para clonar skinned meshes correctamente
    this.model = SkeletonUtils.clone(srcScene);
    this.model.position.copy(position);
    this.model.scale.set(0.3, 0.3, 0.3); // Escala reducida
    this.model.rotation.y = Math.PI;

    // Ajustes por mesh
    this.model.traverse((n) => {
      if (n.isMesh) {
        n.castShadow = true;
        n.receiveShadow = true;
        // Evitar que desaparezcan por problemas de frustum si la geometría quedó desconectada
        n.frustumCulled = false;
      }
    });

    this.scene.add(this.model);

    // Animaciones (si existen)
    if (animations && animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.model);
      this._actions = animations.map((clip) => this.mixer.clipAction(clip));
      this._actions.forEach((a) => {
        try {
          a.play();
        } catch {
          /* ignore */
        }
      });
    }

    // Material físico
    const enemyMaterial = new CANNON.Material("enemyMaterial");
    enemyMaterial.friction = 0.0;

    // Cuerpo físico
    const shape = new CANNON.Sphere(0.5);
    this.body = new CANNON.Body({
      mass: 5,
      shape,
      material: enemyMaterial,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      linearDamping: 0.01,
    });

    // Alinear altura con el jugador
    if (this.playerRef?.body) {
      this.body.position.y = this.playerRef.body.position.y;
      this.model.position.y = this.body.position.y;
    }

    this.body.sleepSpeedLimit = 0.0;
    this.body.wakeUp();
    this.physicsWorld.addBody(this.body);

    // Asociar cuerpo al modelo
    this.model.userData.physicsBody = this.body;

    // Colisión con el jugador
    this._onCollide = (event) => {
      if (event.body === this.playerRef.body) {
        if (typeof this.playerRef.die === "function") this.playerRef.die();
        if (this.proximitySound) this.proximitySound.stop();

        if (this.model.parent) {
          new FinalPrizeParticles({
            scene: this.scene,
            targetPosition: this.body.position,
            sourcePosition: this.body.position,
            experience: this.experience,
          });
          this.destroy();
        }
      }
    };
    this.body.addEventListener("collide", this._onCollide);
  }

  update(delta) {
    if (this.delayActivation > 0) {
      this.delayActivation -= delta;
      return;
    }

    if (!this.body || !this.playerRef?.body) return;

    const targetPos = new CANNON.Vec3(
      this.playerRef.body.position.x,
      this.playerRef.body.position.y,
      this.playerRef.body.position.z
    );

    const enemyPos = this.body.position;

    // Ajuste de velocidad y volumen según distancia
    const distance = enemyPos.distanceTo(targetPos);
    this.speed = distance < 4 ? 2.5 : this.baseSpeed;
    const proximityVolume = 1 - Math.min(distance, 10) / 10;
    if (this.proximitySound)
      this.proximitySound.setVolume(proximityVolume * 0.8);

    // Movimiento hacia el jugador
    const direction = new CANNON.Vec3(
      targetPos.x - enemyPos.x,
      targetPos.y - enemyPos.y,
      targetPos.z - enemyPos.z
    );
    if (direction.length() > 0.5) {
      direction.normalize();
      direction.scale(this.speed, direction);
      this.body.velocity.x = direction.x;
      this.body.velocity.y = direction.y;
      this.body.velocity.z = direction.z;
    }

    // Sincronizar modelo
    this.model.position.copy(this.body.position);

    // Actualizar animaciones
    if (this.mixer) this.mixer.update(delta);
  }

  destroy() {
    if (this.model) this.scene.remove(this.model);
    if (this.proximitySound) this.proximitySound.stop();
    if (this._actions && this._actions.length) {
      this._actions.forEach((a) => {
        if (a && typeof a.stop === "function") a.stop();
      });
    }
    if (this.mixer) {
      if (typeof this.mixer.stopAllAction === "function")
        this.mixer.stopAllAction();
      this.mixer = null;
    }
    if (this.body) {
      this.body.removeEventListener("collide", this._onCollide);
      if (this.physicsWorld.bodies.includes(this.body))
        this.physicsWorld.removeBody(this.body);
      this.body = null;
    }
  }
}
