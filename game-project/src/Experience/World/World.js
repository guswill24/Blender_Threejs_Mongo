import * as THREE from "three";
import Environment from "./Environment.js";
import Fox from "./Fox.js";
import Robot from "./Robot.js";
import ToyCarLoader from "../../loaders/ToyCarLoader.js";
import Floor from "./Floor.js";
import ThirdPersonCamera from "./ThirdPersonCamera.js";
import Sound from "./Sound.js";
import AmbientSound from "./AmbientSound.js";
import MobileControls from "../../controls/MobileControls.js";
import LevelManager from "./LevelManager.js";
import BlockPrefab from "./BlockPrefab.js";
import FinalPrizeParticles from "../Utils/FinalPrizeParticles.js";
import Enemy from "./Enemy.js";
import Prize from "./Prize.js";

export default class World {
  constructor(experience) {
    this.experience = experience;
    this.scene = this.experience.scene;
    this.blockPrefab = new BlockPrefab(this.experience);
    this.resources = this.experience.resources;
    this.levelManager = new LevelManager(this.experience);
    this.finalPrizeActivated = false;
    this.gameStarted = false;
    this.enemies = [];
    this.points = 0;
    this.portalLevelType = null;
    this.debug = true; // activa logs de depuración

    // Sonidos
    this.coinSound = new Sound("/sounds/coin.ogg");
    this.ambientSound = new AmbientSound("/sounds/ambiente.mp3");
    this.winner = new Sound("/sounds/winner.mp3");
    this.portalSound = new Sound("/sounds/portal.mp3");
    this.loseSound = new Sound("/sounds/lose.ogg");

    this.allowPrizePickup = false;
    setTimeout(() => {
      this.allowPrizePickup = true;
    }, 2000);

    this.resources.on("ready", async () => {
      this.floor = new Floor(this.experience);
      this.environment = new Environment(this.experience);
      this.loader = new ToyCarLoader(this.experience);
      await this.loader.loadFromAPI();
      this.fox = new Fox(this.experience);
      this.robot = new Robot(this.experience);

      // Ajustar monedas del nivel 2
      this._adjustLevel2CoinsPosition();

      // Enemigos: plantilla GLB (solo como recurso, no se agrega directamente a la escena)
      const enemiesModelResource = this.resources.items["enemiesModel"];
      if (!enemiesModelResource) {
        console.error('⚠️ No se encontró el modelo de enemigos "enemiesModel"');
        return;
      }

      // Spawneamos enemigos
      const enemiesCount = parseInt(
        import.meta.env.VITE_ENEMIES_COUNT || "3",
        10
      );
      this.spawnEnemies(enemiesCount);

      // Cámara y controles
      this.experience.vr.bindCharacter(this.robot);
      this.thirdPersonCamera = new ThirdPersonCamera(
        this.experience,
        this.robot.group
      );
      this.mobileControls = new MobileControls({
        onUp: (p) => (this.experience.keyboard.keys.up = p),
        onDown: (p) => (this.experience.keyboard.keys.down = p),
        onLeft: (p) => (this.experience.keyboard.keys.left = p),
        onRight: (p) => (this.experience.keyboard.keys.right = p),
      });
      this._checkVRMode();
      this.experience.renderer.instance.xr.addEventListener(
        "sessionstart",
        () => this._checkVRMode()
      );
    });
  }

  _adjustLevel2CoinsPosition() {
    if (!this.loader?.prizes) return;
    this.loader.prizes.forEach((prize) => {
      if (prize?.role === "default" && prize?.level === 2 && prize?.pivot) {
        prize.pivot.position.y = 0.3;
        if (this.debug)
          console.log(`📉 Moneda del nivel 2 bajada: ${prize.name}`);
      }
    });
  }

  spawnEnemies(count = 0) {
    if (!this.robot?.body) {
      if (this.debug) console.warn("spawnEnemies: robot no listo");
      return;
    }

    const enemyResource = this.resources?.items?.enemiesModel;
    if (!enemyResource) {
      console.error("spawnEnemies: enemiesModel no encontrado");
      return;
    }

    // Limpia enemigos anteriores
    this.enemies?.forEach((e) => e?.destroy?.());
    this.enemies = [];

    const playerPos = this.robot.body.position;
    const minRadius = 25;
    const maxRadius = 40;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      const x = playerPos.x + Math.cos(angle) * radius;
      const z = playerPos.z + Math.sin(angle) * radius;
      const y = playerPos.y ?? 1.5;
      const spawnPos = new THREE.Vector3(x, y, z);

      // Pasamos el recurso GLTF original al Enemy: él hará la clonación correcta
      const enemy = new Enemy({
        scene: this.scene,
        physicsWorld: this.experience.physics?.world,
        playerRef: this.robot,
        model: enemyResource,
        position: spawnPos,
        experience: this.experience,
        debug: this.debug,
      });

      enemy.delayActivation = 1.0 + i * 0.5;
      enemy.isGhost = false;
      this.enemies.push(enemy);
    }

    if (this.debug)
      console.log(`spawnEnemies: se crearon ${this.enemies.length} enemigos`);
  }

  update(delta) {
    this.fox?.update();
    this.robot?.update();
    this.blockPrefab?.update();
    if (this.gameStarted) this.enemies?.forEach((e) => e.update(delta));
    if (
      this.thirdPersonCamera &&
      this.experience.isThirdPerson &&
      !this.experience.renderer.instance.xr.isPresenting
    )
      this.thirdPersonCamera.update();
    this.loader?.prizes?.forEach((p) => p.update(delta));

    if (!this.allowPrizePickup || !this.loader || !this.robot?.body) return;

    const playerPos = this.robot.body.position;

    this.loader.prizes.forEach((prize) => {
      if (!prize.pivot || prize.collected) return;
      const collectionRadius =
        typeof prize.hitRadius === "number" ? prize.hitRadius : 1.5;
      const dist = prize.pivot.position.distanceTo(playerPos);

      if (dist < collectionRadius && !prize.collected) {
        if (prize.role === "default") {
          prize.collect();
          prize.collected = true;
          this.points++;
          if (window.userInteracted && this.coinSound) this.coinSound.play();
          this.experience.menu.setStatus?.(`🎖️ Puntos: ${this.points}`);

          if (
            this.levelManager.currentLevel === 1 &&
            this.points === 4 &&
            !this.finalPrizeActivated
          )
            this.spawnFinalPrizeNearPlayer(1);
          if (
            this.levelManager.currentLevel === 2 &&
            this.points === 3 &&
            !this.finalPrizeActivated
          )
            this.spawnFinalPrizeNearPlayer(2);
          if (
            this.levelManager.currentLevel === 3 &&
            this.points === 3 &&
            !this.finalPrizeActivated
          )
            this.spawnFinalPrizeNearPlayer(3);
        }

        if (prize.role === "finalPrize") this.handleFinalPrizeCollection();
      }
    });

    if (this.discoRaysGroup) this.discoRaysGroup.rotation.y += delta * 0.5;
  }

  spawnFinalPrizeNearPlayer(levelType = 1) {
    this.finalPrizeActivated = true;
    const portalModelResource = this.resources?.items?.portalModel;
    if (!portalModelResource) return;

    const playerPos =
      this.robot?.body?.position?.clone() || new THREE.Vector3();
    const spawnPos = new THREE.Vector3(playerPos.x, 0, playerPos.z - 8);

    const portalPrize = new Prize({
      model: portalModelResource,
      position: spawnPos,
      scene: this.scene,
      role: "finalPrize",
      sound: this.portalSound,
    });

    if (portalPrize.pivot) {
      portalPrize.pivot.rotation.set(0, 0, 0);
      portalPrize.pivot.position.y = 0.3;
      portalPrize.pivot.scale.set(2.0, 2.0, 2.0);
    }

    portalPrize.update = () => {};
    portalPrize.hitRadius = 7.0;
    this.loader.prizes.push(portalPrize);

    new FinalPrizeParticles({
      scene: this.scene,
      targetPosition: spawnPos.clone().add(new THREE.Vector3(0, 1, 0)),
      sourcePosition: playerPos,
      experience: this.experience,
    });

    if (window.userInteracted && this.portalSound) this.portalSound.play();

    const statusMsg =
      levelType === 3
        ? "🏆 ¡Portal FINAL activado! Atraviésalo para completar el juego"
        : "🌀 ¡Portal activado! Atraviésalo para avanzar";

    if (this.experience.menu?.setStatus) {
      this.experience.menu.setStatus(statusMsg);
    }

    this.portalLevelType = levelType;
  }

  handleFinalPrizeCollection() {
    if (this.portalLevelType === 3 && this.levelManager.currentLevel === 3) {
      const elapsed = this.experience.tracker.stop();
      this.experience.tracker.saveTime(elapsed);
      this.experience.tracker.showEndGameModal(elapsed);
      if (window.userInteracted && this.winner) this.winner.play();
      return;
    }

    if (this.portalLevelType === 2 && this.levelManager.currentLevel === 2) {
      this.levelManager.goToLevel(3);
      this.points = 0;
      this.finalPrizeActivated = false;
      this.portalLevelType = null;
      return;
    }

    if (this.portalLevelType === 1 && this.levelManager.currentLevel === 1) {
      this.levelManager.nextLevel();
      this.points = 0;
      this.finalPrizeActivated = false;
      this.portalLevelType = null;
      return;
    }
  }

  _checkVRMode() {
    const isVR = this.experience.renderer.instance.xr.isPresenting;
    if (isVR) {
      if (this.robot?.group) this.robot.group.visible = false;
      this.experience.camera.instance.position.set(5, 1.6, 5);
      this.experience.camera.instance.lookAt(new THREE.Vector3(5, 1.6, 4));
    } else {
      if (this.robot?.group) this.robot.group.visible = true;
    }
  }
}
