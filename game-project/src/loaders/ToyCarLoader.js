import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { createBoxShapeFromModel, createTrimeshShapeFromModel } from '../Experience/Utils/PhysicsShapeFactory.js';
import Prize from '../Experience/World/Prize.js';

export default class ToyCarLoader {
    constructor(experience) {
        this.experience = experience;
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.physics = this.experience.physics;
        this.prizes = [];
        this.loadedObjects = [];
        this.physicsBodies = [];
        this.currentLevel = 1;

        this.collectedCoins = 0;
        this.totalCoins = 4;
        this.portal = null;
        this.portalEffect = null;
    }

    async loadFromAPI() {
        try {
            console.log(`🎯 ===== INICIANDO CARGA DE NIVEL ${this.currentLevel} =====`);
            
            const listRes = await fetch('/config/precisePhysicsModels.json');
            const precisePhysicsModels = await listRes.json();

            let blocks = [];

            try {
                const apiUrl = import.meta.env.VITE_API_URL + '/api/blocks';
                console.log(`🌐 Consultando API: ${apiUrl}`);
                const res = await fetch(apiUrl);
                if (!res.ok) throw new Error('Conexión fallida');
                const allBlocks = await res.json();

                blocks = allBlocks.filter(b => b.level === this.currentLevel);
            } catch {
                console.warn('⚠️ No se pudo conectar con la API. Cargando desde archivo local...');
                const localRes = await fetch('/data/toy_car_blocks.json');
                const allBlocks = await localRes.json();
                blocks = allBlocks.filter(b => b.level === this.currentLevel);
            }

            this._processBlocks(blocks, precisePhysicsModels);
            console.log(`🎯 ===== FIN DE CARGA DE NIVEL ${this.currentLevel} =====`);
        } catch (err) {
            console.error('❌ Error al cargar bloques o lista Trimesh:', err);
        }
    }

    _processBlocks(blocks, precisePhysicsModels) {
        console.log(`🔧 Procesando ${blocks.length} bloques...`);

        let coinsCount = 0;
        let objectsCount = 0;
        let portalCount = 0;

        blocks.forEach((block, index) => {
            if (!block.name) return;

            const resourceKey = block.name;
            const glb = this.resources.items[resourceKey] || this.resources.items['portalModel'];
            if (!glb) return;

            const model = glb.scene.clone();
            model.userData.levelObject = true;

            model.traverse((child) => {
                if (child.isCamera || child.isLight) {
                    child.parent.remove(child);
                }
            });

            // 🌀 PORTAL FIJO EN EL SUELO (sin rotar)
            if (block.name === 'final_prize') {
                console.log(`🔮 Portal (final_prize) en posición (${block.x}, ${block.y}, ${block.z})`);

                const portalModel = this.resources.items['portalModel']?.scene?.clone();
                if (!portalModel) {
                    console.error('❌ No se encontró el modelo portalModel en resources.');
                    return;
                }

                portalModel.name = 'portalModel';
                portalModel.visible = false;
                portalModel.scale.set(2, 2, 2);
                portalModel.position.set(block.x, block.y, block.z);

                // Asegurar que esté apoyado en el suelo
                const bbox = new THREE.Box3().setFromObject(portalModel);
                const size = new THREE.Vector3();
                const center = new THREE.Vector3();
                bbox.getCenter(center);
                bbox.getSize(size);
                portalModel.position.y -= center.y - size.y / 2;

                this.portal = portalModel;
                this.scene.add(portalModel);
                this.loadedObjects.push(portalModel);
                portalCount++;
                return;
            }

            // 🪙 MONEDAS MÁS PEQUEÑAS
            if (block.name.startsWith('coin')) {
                console.log(`🪙 Cargando moneda: ${block.name} en (${block.x}, ${block.y}, ${block.z})`);
                
                // Escalar la moneda
                model.scale.set(0.5, 0.5, 0.5);

                const prize = new Prize({
                    model,
                    position: new THREE.Vector3(block.x, block.y, block.z),
                    scene: this.scene,
                    role: block.role || "coin"
                });

                prize.onCollect = () => {
                    this._onCoinCollected();
                };

                this.prizes.push(prize);
                coinsCount++;
                return;
            }

            // 🔸 OBJETOS NORMALES
            model.position.set(block.x, block.y, block.z);
            this.scene.add(model);
            this.loadedObjects.push(model);
            objectsCount++;

            // Físicas
            let shape;
            let position = new THREE.Vector3();

            if (precisePhysicsModels.includes(block.name)) {
                shape = createTrimeshShapeFromModel(model);
                if (!shape) return;
                position.set(0, 0, 0);
            } else {
                shape = createBoxShapeFromModel(model, 0.9);
                const bbox = new THREE.Box3().setFromObject(model);
                const center = new THREE.Vector3();
                const size = new THREE.Vector3();
                bbox.getCenter(center);
                bbox.getSize(size);
                center.y -= size.y / 2;
                position.copy(center);
            }

            const body = new CANNON.Body({
                mass: 0,
                shape,
                position: new CANNON.Vec3(position.x, position.y, position.z),
                material: this.physics.obstacleMaterial
            });

            body.userData = { levelObject: true };
            model.userData.physicsBody = body;
            body.userData.linkedModel = model;
            this.physics.world.addBody(body);
            this.physicsBodies.push(body);
        });

        console.log(`📊 Cargados: 🪙${coinsCount} monedas, 🏗️${objectsCount} objetos, 🌀${portalCount} portales`);
    }

    _onCoinCollected() {
        this.collectedCoins++;
        console.log(`🪙 Moneda recogida ${this.collectedCoins}/${this.totalCoins}`);

        if (this.collectedCoins >= this.totalCoins) {
            this._activateFinalPortal();
        }
    }

    // 🚪 PORTAL ESTÁTICO, SIN ROTAR
    _activateFinalPortal() {
        if (!this.portal) {
            console.warn("⚠️ Portal no encontrado en la escena.");
            return;
        }

        this.portal.visible = true;
        this.portal.userData.isActive = true;

        // ✨ Efecto circular en el suelo (quieto)
        const geometry = new THREE.RingGeometry(2, 2.5, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(this.portal.position);
        ring.position.y += 0.1;
        this.scene.add(ring);
        this.portalEffect = ring;
        this.loadedObjects.push(ring);

        console.log("🌀 Portal activado (estático en el suelo)");

        // 🔹 Solo el efecto brilla un poco, pero sin mover el portal
        this.experience.time.on('tick', () => {
            if (this.portal?.userData?.isActive && this.portalEffect) {
                this.portalEffect.material.opacity = 0.4 + Math.sin(Date.now() * 0.002) * 0.2;
            }
        });
    }

    clear() {
        console.log(`🧹 ===== LIMPIEZA DE NIVEL ${this.currentLevel} =====`);

        this.prizes.forEach(prize => {
            if (prize && !prize.collected) prize.destroy();
        });
        this.prizes = [];

        this.loadedObjects.forEach(obj => {
            if (obj && obj.parent) obj.parent.remove(obj);
            obj.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.loadedObjects = [];

        this.physicsBodies.forEach(body => {
            if (body && this.physics.world) this.physics.world.removeBody(body);
        });
        this.physicsBodies = [];

        this.collectedCoins = 0;
        this.portal = null;
        this.portalEffect = null;

        console.log(`✅ LIMPIEZA COMPLETA`);
    }
}
