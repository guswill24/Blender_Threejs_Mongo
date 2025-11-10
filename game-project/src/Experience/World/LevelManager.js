export default class LevelManager {
    constructor(experience) {
        this.experience = experience;
        this.currentLevel = 1;
        this.totalLevels = 3;
    }

    nextLevel() {
        if (this.currentLevel < this.totalLevels) {
            this.currentLevel++;
            console.log(`🚀 Avanzando al nivel ${this.currentLevel}...`);

            this.resetWorld();
            
            setTimeout(() => {
                this.spawnPlayerAtStart();
            }, 500);
        } else {
            console.log("🏁 Has completado todos los niveles!");
        }
    }

    // 🆕 MÉTODO FALTANTE: goToLevel
    goToLevel(levelNumber) {
        if (levelNumber < 1 || levelNumber > this.totalLevels) {
            console.warn(`⚠️ Nivel ${levelNumber} no válido. Debe estar entre 1 y ${this.totalLevels}`);
            return;
        }

        this.currentLevel = levelNumber;
        console.log(`🎯 Saltando al nivel ${this.currentLevel}...`);

        this.resetWorld();
        
        setTimeout(() => {
            this.spawnPlayerAtStart();
        }, 500);
    }

    resetWorld() {
        const world = this.experience.world;
        
        console.log(`🔄 Reseteando mundo para nivel ${this.currentLevel}...`);
        
        // 1. IMPORTANTE: Actualizar el nivel en el loader ANTES de limpiar
        if (world.loader) {
            world.loader.currentLevel = this.currentLevel;
            console.log(`✅ Nivel actualizado en loader: ${world.loader.currentLevel}`);
        }
        
        // 2. Limpiar premios anteriores
        if (world.loader?.prizes) {
            world.loader.prizes.forEach(prize => {
                if (prize && !prize.collected) {
                    prize.destroy();
                }
            });
            world.loader.prizes = [];
        }

        // 3. Limpiar objetos del nivel anterior usando el método clear()
        if (world.loader) {
            world.loader.clear();
        }

        // 4. Recargar premios y objetos del nuevo nivel desde la API
        if (world.loader) {
            console.log(`🔄 Cargando datos del nivel ${this.currentLevel}...`);
            world.loader.loadFromAPI().then(() => {
                console.log(`✅ Nivel ${this.currentLevel} cargado con sus objetos`);
            });
        }

        // 5. Resetear enemigos
        if (world.enemies) {
            world.enemies.forEach(enemy => {
                if (enemy?.destroy) enemy.destroy();
            });
            const enemiesCount = parseInt(import.meta.env.VITE_ENEMIES_COUNT || '3', 10);
            setTimeout(() => {
                world.spawnEnemies(enemiesCount);
            }, 1000);
        }

        // 6. Resetear puntos y flags
        world.points = 0;
        world.finalPrizeActivated = false;
        
        // 7. Actualizar UI
        if (this.experience.menu?.setStatus) {
            this.experience.menu.setStatus(`🎮 Nivel ${this.currentLevel} - Puntos: 0`);
        }
    }

    spawnPlayerAtStart() {
        const world = this.experience.world;
        
        if (!world.robot?.body) return;

        // Posiciones de inicio por nivel
        const spawnPositions = {
            1: { x: 5, y: 1.5, z: 5 },
            2: { x: -17, y: 1.5, z: -67 },
            3: { x: 10, y: 1.5, z: -50 }
        };

        const spawn = spawnPositions[this.currentLevel] || spawnPositions[1];
        
        // Resetear posición y velocidad del robot
        world.robot.body.position.set(spawn.x, spawn.y, spawn.z);
        world.robot.body.quaternion.set(0, 0, 0, 1);
        world.robot.body.velocity.set(0, 0, 0);
        world.robot.body.angularVelocity.set(0, 0, 0);

        console.log(`📍 Jugador reposicionado en nivel ${this.currentLevel}`);
    }

    resetLevel() {
        this.currentLevel = 1;
        this.resetWorld();
        this.spawnPlayerAtStart();
    }

    getCurrentLevelTargetPoints() {
        // Puntos necesarios por nivel
        const pointsPerLevel = {
            1: 4,
            2: 4,
            3: 4
        };
        return pointsPerLevel[this.currentLevel] || 4;
    }
}