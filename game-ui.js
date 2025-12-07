// ========================================
// GAME UI MANAGEMENT
// ========================================

// Screen Management
let currentScreen = 'lobby';
let selectedPetSlot = null;

function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenId;

        // Update bottom menu active state
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        // Update screen content
        switch (screenId) {
            case 'lobby':
            case 'lobby-3d':
                updateLobby();
                updateTopBar();
                break;
            case 'planets':
                updatePlanetsScreen();
                break;
            case 'collection':
                updateCollectionScreen();
                break;
            case 'stats':
                updateStatsScreen();
                break;
        }
    }
}

// Lobby Screen
function updateLobby() {
    // These elements only exist in old lobby, not lobby-3d
    const levelEl = document.getElementById('lobby-level');
    const goldEl = document.getElementById('lobby-gold');
    const petsEl = document.getElementById('lobby-pets-count');
    
    if (levelEl) levelEl.textContent = gameState.player.level;
    if (goldEl) goldEl.textContent = `${gameState.player.gold} 💰`;
    if (petsEl) petsEl.textContent = gameState.pets.length;
}

// Planets Screen
function updatePlanetsScreen() {
    const container = document.getElementById('planets-list');
    container.innerHTML = '';

    PLANETS.forEach(planet => {
        const isUnlocked = gameState.unlockedPlanets.includes(planet.id);
        const planetCard = document.createElement('div');
        planetCard.className = `planet-card ${isUnlocked ? '' : 'locked'}`;
        planetCard.style.borderColor = planet.color;

        const planetStages = STAGES[planet.id] || [];
        const completedCount = planetStages.filter(s => 
            gameState.completedStages.includes(s.id)
        ).length;

        planetCard.innerHTML = `
            <div class="planet-emoji">${planet.emoji}</div>
            <div class="planet-name">${planet.name}</div>
            <div class="planet-desc">${planet.description}</div>
            <div class="planet-progress">
                ${isUnlocked ? 
                    `<div class="progress-text">${completedCount}/${planetStages.length} hoàn thành</div>
                     <div class="progress-bar">
                         <div class="progress-fill" style="width: ${(completedCount/planetStages.length)*100}%; background: ${planet.color}"></div>
                     </div>` :
                    `<div class="unlock-requirement">🔒 Cần ${planet.unlockRequirement} mốc</div>`
                }
            </div>
        `;

        if (isUnlocked) {
            planetCard.onclick = () => showPlanetStages(planet.id);
        }

        container.appendChild(planetCard);
    });
}

// Planet Stages Screen
function showPlanetStages(planetId) {
    gameState.currentPlanet = planetId;
    const planet = PLANETS.find(p => p.id === planetId);
    const stages = STAGES[planetId] || [];

    document.getElementById('planet-title').textContent = `${planet.emoji} ${planet.name}`;

    const container = document.getElementById('stages-list');
    container.innerHTML = '';

    stages.forEach((stage, index) => {
        const isUnlocked = isStageUnlocked(stage.id, planetId);
        const isCompleted = gameState.completedStages.includes(stage.id);
        const progress = gameState.stageProgress[stage.id];

        const stageCard = document.createElement('div');
        stageCard.className = `stage-card ${isUnlocked ? '' : 'locked'} ${isCompleted ? 'completed' : ''}`;

        stageCard.innerHTML = `
            <div class="stage-number">Mốc ${index + 1}</div>
            <div class="stage-emoji">${stage.emoji}</div>
            <div class="stage-name">${stage.name}</div>
            <div class="stage-stats">
                <span class="stage-stat">❤️ ${stage.hp}</span>
                <span class="stage-stat">⚔️ ${stage.atk}</span>
            </div>
            <div class="stage-rewards">
                <span class="reward-item">💰 ${stage.reward}</span>
                <span class="reward-item">⭐ ${stage.exp}</span>
            </div>
            ${isCompleted ? `<div class="stage-stars">${'⭐'.repeat(progress?.stars || 1)}</div>` : ''}
            ${!isUnlocked ? '<div class="stage-locked">🔒</div>' : ''}
        `;

        if (isUnlocked) {
            stageCard.onclick = () => prepareBattle(stage.id);
        }

        container.appendChild(stageCard);
    });

    showScreen('stages');
}

// Collection Screen
function updateCollectionScreen() {
    const container = document.getElementById('collection-list');
    container.innerHTML = '';

    if (gameState.pets.length === 0) {
        container.innerHTML = '<div class="empty-message">🎮 Chưa có pet nào!<br>Hãy chinh phục các mốc để thu phục pet!</div>';
        return;
    }

    gameState.pets.forEach(pet => {
        const petData = PETS_DATABASE[pet.id];
        if (!petData) return;

        // Calculate stats safely
        const level = pet.level || 1;
        const hp = Math.floor(petData.baseHp * (1 + (level - 1) * 0.1));
        const atk = Math.floor(petData.baseAtk * (1 + (level - 1) * 0.1));
        const def = Math.floor(petData.baseDef * (1 + (level - 1) * 0.1));
        const exp = pet.exp || 0;
        const expToNext = pet.expToNext || 100;
        const expPercent = Math.min(100, (exp / expToNext) * 100);

        const petCard = document.createElement('div');
        petCard.className = `pet-card rarity-${petData.rarity}`;
        petCard.setAttribute('data-type', petData.type);
        petCard.style.borderColor = RARITY_COLORS[petData.rarity];

        petCard.innerHTML = `
            <div class="pet-card-header">
                ${petData.image 
                    ? `<img class="pet-image-large" src="${petData.image}" alt="${petData.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                       <div class="pet-emoji-large" style="display:none;">${petData.emoji}</div>` 
                    : `<div class="pet-emoji-large">${petData.emoji}</div>`}
                <div class="pet-level">Lv.${level}</div>
            </div>
            <div class="pet-name">${petData.name}</div>
            <div class="pet-type" style="background: ${getTypeColor(petData.type)}">${getTypeName(petData.type)}</div>
            <div class="pet-stats-grid">
                <div class="stat-item">
                    <div class="stat-label">❤️ HP</div>
                    <div class="stat-value">${hp}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">⚔️ ATK</div>
                    <div class="stat-value">${atk}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">🛡️ DEF</div>
                    <div class="stat-value">${def}</div>
                </div>
            </div>
            <div class="pet-skill">
                <div class="skill-name">${petData.skill.emoji} ${petData.skill.name}</div>
                <div class="skill-desc">${petData.skill.description}</div>
            </div>
            <div class="pet-exp-bar">
                <div class="exp-text">${exp}/${expToNext} EXP</div>
                <div class="exp-bar">
                    <div class="exp-fill" style="width: ${expPercent}%"></div>
                </div>
            </div>
        `;

        container.appendChild(petCard);
    });
}

// Stats Screen
function updateStatsScreen() {
    const container = document.getElementById('stats-content');
    const stats = gameState.stats;

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">⚔️</div>
                <div class="stat-number">${stats.totalBattles}</div>
                <div class="stat-label">Tổng Trận</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-number">${stats.wins}</div>
                <div class="stat-label">Thắng</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💀</div>
                <div class="stat-number">${stats.losses}</div>
                <div class="stat-label">Thua</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💥</div>
                <div class="stat-number">${stats.totalDamage.toLocaleString()}</div>
                <div class="stat-label">Tổng Sát Thương</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💚</div>
                <div class="stat-number">${stats.totalHealing.toLocaleString()}</div>
                <div class="stat-label">Tổng Hồi Máu</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-number">${stats.perfectWins}</div>
                <div class="stat-label">Hoàn Hảo</div>
            </div>
        </div>

        <div class="achievements-section">
            <h3>🏅 Thành Tựu</h3>
            <div class="achievements-list">
                ${generateAchievements()}
            </div>
        </div>

        <div class="danger-zone">
            <button class="danger-btn" onclick="resetGame()">🗑️ Reset Game</button>
        </div>
    `;
}

function generateAchievements() {
    const achievements = [
        { id: 'first_win', name: 'Chiến Thắng Đầu Tiên', desc: 'Thắng trận đầu tiên', check: () => gameState.stats.wins >= 1, reward: '🏆' },
        { id: 'collector', name: 'Nhà Sưu Tập', desc: 'Thu thập 10 pet', check: () => gameState.pets.length >= 10, reward: '👾' },
        { id: 'warrior', name: 'Chiến Binh', desc: 'Thắng 50 trận', check: () => gameState.stats.wins >= 50, reward: '⚔️' },
        { id: 'master', name: 'Bậc Thầy', desc: 'Đạt Level 20', check: () => gameState.player.level >= 20, reward: '🌟' },
        { id: 'rich', name: 'Đại Gia', desc: 'Sở hữu 10000 gold', check: () => gameState.player.gold >= 10000, reward: '💰' },
        { id: 'explorer', name: 'Nhà Thám Hiểm', desc: 'Mở khóa tất cả hành tinh', check: () => gameState.unlockedPlanets.length >= PLANETS.length, reward: '🌍' },
    ];

    return achievements.map(ach => {
        const completed = ach.check();
        return `
            <div class="achievement-item ${completed ? 'completed' : 'locked'}">
                <div class="achievement-icon">${completed ? ach.reward : '🔒'}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.desc}</div>
                </div>
                ${completed ? '<div class="achievement-check">✓</div>' : ''}
            </div>
        `;
    }).join('');
}

// Prepare Battle Screen
function prepareBattle(stageId) {
    const stage = findStageById(stageId);
    if (!stage) return;

    gameState.currentStage = stage;

    // Update enemy info
    document.getElementById('prepare-enemy-portrait').textContent = stage.emoji;
    document.getElementById('prepare-enemy-name').textContent = stage.name;
    document.getElementById('prepare-enemy-hp').textContent = stage.hp;
    document.getElementById('prepare-enemy-atk').textContent = stage.atk;
    document.getElementById('prepare-reward-gold').textContent = stage.reward;
    document.getElementById('prepare-reward-exp').textContent = stage.exp;
    document.getElementById('prepare-title').textContent = `⚔️ ${stage.name}`;

    // Update available pets
    updateAvailablePets();
    updateSelectedTeam();

    showScreen('prepare');
}

function updateAvailablePets() {
    const container = document.getElementById('available-pets-list');
    container.innerHTML = '';

    if (gameState.pets.length === 0) {
        container.innerHTML = '<div class="empty-message-small">Chưa có pet</div>';
        return;
    }

    gameState.pets.forEach(pet => {
        const petData = PETS_DATABASE[pet.id];
        if (!petData) return;

        const petItem = document.createElement('div');
        petItem.className = 'pet-item-small';
        petItem.innerHTML = `
            <div class="pet-emoji-small">${petData.emoji}</div>
            <div class="pet-info-small">
                <div class="pet-name-small">${petData.name}</div>
                <div class="pet-level-small">Lv.${pet.level}</div>
            </div>
        `;

        petItem.onclick = () => {
            if (selectedPetSlot !== null) {
                gameState.selectedTeam[selectedPetSlot] = pet;
                updateSelectedTeam();
                closePetSelectModal();
            }
        };

        container.appendChild(petItem);
    });
}

function updateSelectedTeam() {
    const container = document.getElementById('selected-pets-list');
    container.innerHTML = '';

    for (let i = 0; i < 3; i++) {
        const pet = gameState.selectedTeam[i];
        const slot = document.createElement('div');
        
        if (pet) {
            const petData = PETS_DATABASE[pet.id];
            slot.className = 'pet-slot filled';
            slot.innerHTML = `
                <div class="slot-pet-emoji">${petData.emoji}</div>
                <div class="slot-pet-name">${petData.name}</div>
                <div class="slot-pet-level">Lv.${pet.level}</div>
                <button class="slot-remove" onclick="removePetFromTeam(${i}); event.stopPropagation();">✕</button>
            `;
        } else {
            slot.className = 'pet-slot empty';
            slot.innerHTML = `
                <div class="slot-number">${i + 1}</div>
                <div class="slot-hint">Click để chọn</div>
            `;
        }

        slot.onclick = () => selectPetForBattle(i);
        container.appendChild(slot);
    }
}

function selectPetForBattle(slotIndex) {
    selectedPetSlot = slotIndex;
    showPetSelectModal();
}

function showPetSelectModal() {
    const modal = document.getElementById('pet-select-modal');
    const grid = document.getElementById('pet-select-grid');
    grid.innerHTML = '';

    gameState.pets.forEach(pet => {
        const petData = PETS_DATABASE[pet.id];
        if (!petData) return;

        const isSelected = gameState.selectedTeam.some(p => p && p.id === pet.id);

        const petCard = document.createElement('div');
        petCard.className = `pet-select-card ${isSelected ? 'selected' : ''}`;
        petCard.innerHTML = `
            <div class="pet-emoji-medium">${petData.emoji}</div>
            <div class="pet-name-medium">${petData.name}</div>
            <div class="pet-level-medium">Lv.${pet.level}</div>
            ${isSelected ? '<div class="selected-badge">✓</div>' : ''}
        `;

        if (!isSelected) {
            petCard.onclick = () => {
                gameState.selectedTeam[selectedPetSlot] = pet;
                updateSelectedTeam();
                closePetSelectModal();
            };
        }

        grid.appendChild(petCard);
    });

    modal.classList.remove('hidden');
}

function closePetSelectModal() {
    document.getElementById('pet-select-modal').classList.add('hidden');
    selectedPetSlot = null;
}

function removePetFromTeam(slotIndex) {
    gameState.selectedTeam[slotIndex] = null;
    updateSelectedTeam();
}

// Helper Functions
function findStageById(stageId) {
    for (const planetId in STAGES) {
        const stage = STAGES[planetId].find(s => s.id === stageId);
        if (stage) return stage;
    }
    return null;
}

function getTypeColor(type) {
    const colors = {
        fire: '#f44336',
        water: '#2196F3',
        earth: '#4CAF50',
        air: '#FF9800',
        light: '#9C27B0',
        dark: '#424242',
    };
    return colors[type] || '#9E9E9E';
}

function getTypeName(type) {
    const names = {
        fire: '🔥 Lửa',
        water: '💧 Nước',
        earth: '🌍 Đất',
        air: '💨 Gió',
        light: '✨ Ánh Sáng',
        dark: '🌑 Bóng Tối',
    };
    return names[type] || type;
}

// Filter pets in collection
document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // TODO: Implement filtering
            updateCollectionScreen();
        });
    });
});
