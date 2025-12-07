// ========================================
// GAME STATE MANAGEMENT
// ========================================

// Game State
const gameState = {
    // Player data
    player: {
        name: 'Trainer',
        level: 1,
        exp: 0,
        expToNext: 100,
        gold: 0,
        hp: 100,
        hpMax: 100,
        mp: 50,
        mpMax: 50,
        atkBonusPct: 0,
    },

    // Collection
    pets: [], // Array of owned pet objects with levels
    materials: {}, // Materials collected from battles

    // Progress
    unlockedPlanets: ['earth'],
    completedStages: [], // Array of stage IDs
    stageProgress: {}, // stage_id: { completed: bool, stars: 0-3, bestTime: ms }

    // Current battle
    currentBattle: null,
    selectedTeam: [null, null, null], // 3 pet slots
    currentPlanet: null,
    currentStage: null,

    // Statistics
    stats: {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        totalDamage: 0,
        totalHealing: 0,
        perfectWins: 0,
    },
};

// Local Storage Keys
const STORAGE_KEYS = {
    PLAYER: 'pokiwar_player',
    PETS: 'pokiwar_pets',
    MATERIALS: 'pokiwar_materials',
    PROGRESS: 'pokiwar_progress',
    STATS: 'pokiwar_stats',
};

// Save Functions
function saveGame() {
    try {
        localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(gameState.player));
        localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(gameState.pets));
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(gameState.materials));
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify({
            unlockedPlanets: gameState.unlockedPlanets,
            completedStages: gameState.completedStages,
            stageProgress: gameState.stageProgress,
        }));
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(gameState.stats));
        console.log('Game saved successfully');
    } catch (e) {
        console.error('Failed to save game:', e);
    }
}

function loadGame() {
    try {
        // Load player
        const playerData = localStorage.getItem(STORAGE_KEYS.PLAYER);
        if (playerData) {
            Object.assign(gameState.player, JSON.parse(playerData));
        }

        // Load pets
        const petsData = localStorage.getItem(STORAGE_KEYS.PETS);
        if (petsData) {
            gameState.pets = JSON.parse(petsData);
        }

        // Load materials
        const materialsData = localStorage.getItem(STORAGE_KEYS.MATERIALS);
        if (materialsData) {
            gameState.materials = JSON.parse(materialsData);
        }

        // Load progress
        const progressData = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        if (progressData) {
            const progress = JSON.parse(progressData);
            gameState.unlockedPlanets = progress.unlockedPlanets || ['earth'];
            gameState.completedStages = progress.completedStages || [];
            gameState.stageProgress = progress.stageProgress || {};
        }

        // Load stats
        const statsData = localStorage.getItem(STORAGE_KEYS.STATS);
        if (statsData) {
            Object.assign(gameState.stats, JSON.parse(statsData));
        }

        // Give starter pet if player has no pets
        if (gameState.pets.length === 0) {
            giveStarterPet();
        }

        console.log('Game loaded successfully');
    } catch (e) {
        console.error('Failed to load game:', e);
    }
}

// Give starter pet to new players
function giveStarterPet() {
    const starterPetId = 'slime';
    const petData = PETS_DATABASE[starterPetId];
    
    if (!petData) {
        console.error('Starter pet not found in database');
        return;
    }
    
    const starterPet = {
        id: starterPetId,
        level: 1,
        exp: 0,
        expToNext: 100,
        hp: petData.baseHp,
        hpMax: petData.baseHp,
        atk: petData.baseAtk,
        def: petData.baseDef,
    };
    
    gameState.pets.push(starterPet);
    
    // Auto-select starter pet for battle
    gameState.selectedTeam[0] = starterPet;
    
    // Give some starting gold
    gameState.player.gold = 100;
    
    saveGame();
    console.log('Starter pet given: Slime');
}

function resetGame() {
    if (confirm('Bạn có chắc muốn reset toàn bộ tiến độ?')) {
        localStorage.clear();
        location.reload();
    }
}

// Pet Management
function addPet(petId) {
    const petData = PETS_DATABASE[petId];
    if (!petData) return false;

    // Check if already owned
    const existing = gameState.pets.find(p => p.id === petId);
    if (existing) {
        console.log('Pet already owned');
        return false;
    }

    // Add new pet with level 1
    const newPet = {
        id: petId,
        level: 1,
        exp: 0,
        expToNext: 100,
        hp: petData.baseHp,
        hpMax: petData.baseHp,
        atk: petData.baseAtk,
        def: petData.baseDef,
    };

    gameState.pets.push(newPet);
    saveGame();
    return true;
}

function getPetStats(pet) {
    const baseData = PETS_DATABASE[pet.id];
    if (!baseData) return null;

    return {
        ...baseData,
        level: pet.level,
        hp: Math.floor(baseData.baseHp * (1 + (pet.level - 1) * 0.1)),
        hpMax: Math.floor(baseData.baseHp * (1 + (pet.level - 1) * 0.1)),
        atk: Math.floor(baseData.baseAtk * (1 + (pet.level - 1) * 0.1)),
        def: Math.floor(baseData.baseDef * (1 + (pet.level - 1) * 0.1)),
    };
}

function levelUpPet(petId) {
    const pet = gameState.pets.find(p => p.id === petId);
    if (!pet) return false;

    if (pet.exp >= pet.expToNext) {
        pet.level++;
        pet.exp -= pet.expToNext;
        pet.expToNext = Math.floor(pet.expToNext * 1.5);

        // Update stats
        const stats = getPetStats(pet);
        pet.hp = stats.hp;
        pet.hpMax = stats.hpMax;
        pet.atk = stats.atk;
        pet.def = stats.def;

        saveGame();
        return true;
    }
    return false;
}

// Progress Management
function completeStage(stageId, stars = 3) {
    if (!gameState.completedStages.includes(stageId)) {
        gameState.completedStages.push(stageId);
    }

    gameState.stageProgress[stageId] = {
        completed: true,
        stars: Math.max(gameState.stageProgress[stageId]?.stars || 0, stars),
        lastPlayed: Date.now(),
    };

    // Check planet unlock
    checkPlanetUnlocks();
    saveGame();
}

function checkPlanetUnlocks() {
    const totalCompleted = gameState.completedStages.length;

    PLANETS.forEach(planet => {
        if (!planet.unlocked && planet.unlockRequirement) {
            if (totalCompleted >= planet.unlockRequirement) {
                if (!gameState.unlockedPlanets.includes(planet.id)) {
                    gameState.unlockedPlanets.push(planet.id);
                    showNotification(`🌍 Đã mở khóa hành tinh: ${planet.name}!`);
                }
            }
        }
    });
}

function isStageUnlocked(stageId, planetId) {
    const planetStages = STAGES[planetId];
    if (!planetStages) return false;

    const stageIndex = planetStages.findIndex(s => s.id === stageId);
    if (stageIndex === 0) return true; // First stage always unlocked

    // Check if previous stage is completed
    const prevStage = planetStages[stageIndex - 1];
    return gameState.completedStages.includes(prevStage.id);
}

// Rewards
function addGold(amount) {
    gameState.player.gold += amount;
    saveGame();
}

function addExp(amount) {
    gameState.player.exp += amount;

    while (gameState.player.exp >= gameState.player.expToNext) {
        gameState.player.exp -= gameState.player.expToNext;
        gameState.player.level++;
        gameState.player.expToNext = Math.floor(gameState.player.expToNext * 1.5);
        
        // Level up bonuses
        gameState.player.hpMax += 20;
        gameState.player.mpMax += 10;
        gameState.player.hp = gameState.player.hpMax;
        gameState.player.mp = gameState.player.mpMax;

        showNotification(`🎉 Level Up! Bạn đã đạt Level ${gameState.player.level}!`);
    }

    saveGame();
}

function addMaterial(materialId, amount = 1) {
    if (!gameState.materials[materialId]) {
        gameState.materials[materialId] = 0;
    }
    gameState.materials[materialId] += amount;
    saveGame();
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for notifications
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyle);

// Initialize
loadGame();
