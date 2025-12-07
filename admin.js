// ========================================
// ADMIN PANEL - POKIWAR
// ========================================

// Storage keys for custom data
const ADMIN_STORAGE = {
    PLANETS: 'pokiwar_custom_planets',
    STAGES: 'pokiwar_custom_stages',
    PETS: 'pokiwar_custom_pets'
};

// Current data (loaded from default + custom)
let adminPlanets = [];
let adminStages = {};
let adminPets = {};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    setupTabNavigation();
    renderPlanets();
    renderPets();
    populateSelects();
});

// ========================================
// DATA LOADING
// ========================================

function loadAllData() {
    // Start with default data from game-data.js
    adminPlanets = [...PLANETS];
    adminStages = JSON.parse(JSON.stringify(STAGES));
    adminPets = JSON.parse(JSON.stringify(PETS_DATABASE));
    
    // Load custom data from localStorage and merge
    try {
        const customPlanets = localStorage.getItem(ADMIN_STORAGE.PLANETS);
        if (customPlanets) {
            const parsed = JSON.parse(customPlanets);
            parsed.forEach(planet => {
                const existing = adminPlanets.findIndex(p => p.id === planet.id);
                if (existing >= 0) {
                    adminPlanets[existing] = planet;
                } else {
                    adminPlanets.push(planet);
                }
            });
        }
        
        const customStages = localStorage.getItem(ADMIN_STORAGE.STAGES);
        if (customStages) {
            const parsed = JSON.parse(customStages);
            Object.keys(parsed).forEach(planetId => {
                if (!adminStages[planetId]) {
                    adminStages[planetId] = [];
                }
                parsed[planetId].forEach(stage => {
                    const existing = adminStages[planetId].findIndex(s => s.id === stage.id);
                    if (existing >= 0) {
                        adminStages[planetId][existing] = stage;
                    } else {
                        adminStages[planetId].push(stage);
                    }
                });
            });
        }
        
        const customPets = localStorage.getItem(ADMIN_STORAGE.PETS);
        if (customPets) {
            const parsed = JSON.parse(customPets);
            Object.keys(parsed).forEach(petId => {
                adminPets[petId] = parsed[petId];
            });
        }
    } catch (e) {
        console.error('Error loading custom data:', e);
    }
}

function saveAllData() {
    localStorage.setItem(ADMIN_STORAGE.PLANETS, JSON.stringify(adminPlanets));
    localStorage.setItem(ADMIN_STORAGE.STAGES, JSON.stringify(adminStages));
    localStorage.setItem(ADMIN_STORAGE.PETS, JSON.stringify(adminPets));
}

// ========================================
// TAB NAVIGATION
// ========================================

function setupTabNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.dataset.tab;
            
            // Update nav active state
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding tab
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            // Refresh content
            if (tabId === 'planets') renderPlanets();
            if (tabId === 'stages') loadStagesForPlanet();
            if (tabId === 'pets') renderPets();
        });
    });
}

// ========================================
// PLANETS MANAGEMENT
// ========================================

function renderPlanets() {
    const grid = document.getElementById('planets-grid');
    grid.innerHTML = '';
    
    adminPlanets.forEach(planet => {
        const stageCount = adminStages[planet.id]?.length || 0;
        
        const card = document.createElement('div');
        card.className = 'data-card';
        card.style.setProperty('--card-color', planet.color);
        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">${planet.emoji}</span>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editPlanet('${planet.id}')">✏️ Sửa</button>
                    <button class="btn-delete" onclick="deletePlanet('${planet.id}')">🗑️</button>
                </div>
            </div>
            <div class="card-title">${planet.name}</div>
            <div class="card-subtitle">${planet.description || 'Không có mô tả'}</div>
            <div class="card-stats">
                <span class="stat-badge">ID: ${planet.id}</span>
                <span class="stat-badge">${stageCount} mốc</span>
                ${planet.unlockRequirement ? `<span class="stat-badge">🔒 ${planet.unlockRequirement} mốc</span>` : '<span class="stat-badge">✅ Mở khóa</span>'}
            </div>
        `;
        grid.appendChild(card);
    });
    
    if (adminPlanets.length === 0) {
        grid.innerHTML = '<div class="empty-message">Chưa có hành tinh nào. Nhấn "Thêm Hành Tinh" để bắt đầu!</div>';
    }
}

function showAddPlanetModal() {
    document.getElementById('planet-modal-title').textContent = 'Thêm Hành Tinh';
    document.getElementById('planet-form').reset();
    document.getElementById('planet-edit-id').value = '';
    document.getElementById('planet-id').disabled = false;
    document.getElementById('modal-planet').classList.remove('hidden');
}

function editPlanet(planetId) {
    const planet = adminPlanets.find(p => p.id === planetId);
    if (!planet) return;
    
    document.getElementById('planet-modal-title').textContent = 'Sửa Hành Tinh';
    document.getElementById('planet-edit-id').value = planet.id;
    document.getElementById('planet-id').value = planet.id;
    document.getElementById('planet-id').disabled = true;
    document.getElementById('planet-name').value = planet.name;
    document.getElementById('planet-emoji').value = planet.emoji;
    document.getElementById('planet-description').value = planet.description || '';
    document.getElementById('planet-color').value = planet.color || '#4CAF50';
    document.getElementById('planet-unlock').value = planet.unlockRequirement || 0;
    
    document.getElementById('modal-planet').classList.remove('hidden');
}

function savePlanet(e) {
    e.preventDefault();
    
    const editId = document.getElementById('planet-edit-id').value;
    const planetData = {
        id: document.getElementById('planet-id').value.toLowerCase(),
        name: document.getElementById('planet-name').value,
        emoji: document.getElementById('planet-emoji').value,
        description: document.getElementById('planet-description').value,
        color: document.getElementById('planet-color').value,
        unlocked: parseInt(document.getElementById('planet-unlock').value) === 0,
        unlockRequirement: parseInt(document.getElementById('planet-unlock').value) || 0
    };
    
    if (editId) {
        // Update existing
        const index = adminPlanets.findIndex(p => p.id === editId);
        if (index >= 0) {
            adminPlanets[index] = planetData;
        }
    } else {
        // Check duplicate
        if (adminPlanets.some(p => p.id === planetData.id)) {
            alert('ID hành tinh đã tồn tại!');
            return;
        }
        adminPlanets.push(planetData);
        // Initialize stages array
        if (!adminStages[planetData.id]) {
            adminStages[planetData.id] = [];
        }
    }
    
    saveAllData();
    closeModal('modal-planet');
    renderPlanets();
    populateSelects();
}

function deletePlanet(planetId) {
    if (!confirm(`Bạn có chắc muốn xóa hành tinh "${planetId}"? Tất cả các mốc trong hành tinh này cũng sẽ bị xóa!`)) {
        return;
    }
    
    adminPlanets = adminPlanets.filter(p => p.id !== planetId);
    delete adminStages[planetId];
    
    saveAllData();
    renderPlanets();
    populateSelects();
}

// ========================================
// STAGES MANAGEMENT
// ========================================

function loadStagesForPlanet() {
    const planetId = document.getElementById('stage-planet-select').value;
    const grid = document.getElementById('stages-grid');
    
    if (!planetId) {
        grid.innerHTML = '<div class="empty-message">Vui lòng chọn hành tinh để xem các mốc</div>';
        return;
    }
    
    const stages = adminStages[planetId] || [];
    grid.innerHTML = '';
    
    stages.forEach((stage, index) => {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">${stage.emoji}</span>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editStage('${planetId}', '${stage.id}')">✏️ Sửa</button>
                    <button class="btn-delete" onclick="deleteStage('${planetId}', '${stage.id}')">🗑️</button>
                </div>
            </div>
            <div class="card-title">Mốc ${index + 1}: ${stage.name}</div>
            <div class="card-subtitle">Pet: ${stage.petId || 'N/A'}</div>
            <div class="card-stats">
                <span class="stat-badge hp">❤️ ${stage.hp}</span>
                <span class="stat-badge atk">⚔️ ${stage.atk}</span>
                <span class="stat-badge reward">💰 ${stage.reward}</span>
                <span class="stat-badge">⭐ ${stage.exp} EXP</span>
            </div>
        `;
        grid.appendChild(card);
    });
    
    if (stages.length === 0) {
        grid.innerHTML = '<div class="empty-message">Chưa có mốc nào trong hành tinh này. Nhấn "Thêm Mốc" để tạo!</div>';
    }
}

function showAddStageModal() {
    document.getElementById('stage-modal-title').textContent = 'Thêm Mốc';
    document.getElementById('stage-form').reset();
    document.getElementById('stage-edit-id').value = '';
    document.getElementById('stage-id').disabled = false;
    
    // Pre-select current planet
    const currentPlanet = document.getElementById('stage-planet-select').value;
    if (currentPlanet) {
        document.getElementById('stage-planet').value = currentPlanet;
    }
    
    document.getElementById('modal-stage').classList.remove('hidden');
}

function editStage(planetId, stageId) {
    const stages = adminStages[planetId] || [];
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;
    
    document.getElementById('stage-modal-title').textContent = 'Sửa Mốc';
    document.getElementById('stage-edit-id').value = stageId;
    document.getElementById('stage-planet').value = planetId;
    document.getElementById('stage-id').value = stage.id;
    document.getElementById('stage-id').disabled = true;
    document.getElementById('stage-name').value = stage.name;
    document.getElementById('stage-emoji').value = stage.emoji;
    document.getElementById('stage-hp').value = stage.hp;
    document.getElementById('stage-atk').value = stage.atk;
    document.getElementById('stage-pet').value = stage.petId || '';
    document.getElementById('stage-type').value = stage.type || 'earth';
    document.getElementById('stage-reward').value = stage.reward;
    document.getElementById('stage-exp').value = stage.exp;
    
    document.getElementById('modal-stage').classList.remove('hidden');
}

function saveStage(e) {
    e.preventDefault();
    
    const editId = document.getElementById('stage-edit-id').value;
    const planetId = document.getElementById('stage-planet').value;
    
    const stageData = {
        id: document.getElementById('stage-id').value.toLowerCase(),
        name: document.getElementById('stage-name').value,
        emoji: document.getElementById('stage-emoji').value,
        hp: parseInt(document.getElementById('stage-hp').value),
        atk: parseInt(document.getElementById('stage-atk').value),
        petId: document.getElementById('stage-pet').value,
        type: document.getElementById('stage-type').value,
        reward: parseInt(document.getElementById('stage-reward').value),
        exp: parseInt(document.getElementById('stage-exp').value),
        materials: []
    };
    
    if (!adminStages[planetId]) {
        adminStages[planetId] = [];
    }
    
    if (editId) {
        // Update existing
        const index = adminStages[planetId].findIndex(s => s.id === editId);
        if (index >= 0) {
            adminStages[planetId][index] = stageData;
        }
    } else {
        // Check duplicate
        if (adminStages[planetId].some(s => s.id === stageData.id)) {
            alert('ID mốc đã tồn tại!');
            return;
        }
        adminStages[planetId].push(stageData);
    }
    
    saveAllData();
    closeModal('modal-stage');
    
    document.getElementById('stage-planet-select').value = planetId;
    loadStagesForPlanet();
}

function deleteStage(planetId, stageId) {
    if (!confirm(`Bạn có chắc muốn xóa mốc "${stageId}"?`)) {
        return;
    }
    
    adminStages[planetId] = adminStages[planetId].filter(s => s.id !== stageId);
    saveAllData();
    loadStagesForPlanet();
}

// ========================================
// PETS MANAGEMENT
// ========================================

function renderPets() {
    const grid = document.getElementById('pets-grid');
    grid.innerHTML = '';
    
    const petIds = Object.keys(adminPets);
    
    petIds.forEach(petId => {
        const pet = adminPets[petId];
        
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">${pet.emoji}</span>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editPet('${petId}')">✏️ Sửa</button>
                    <button class="btn-delete" onclick="deletePet('${petId}')">🗑️</button>
                </div>
            </div>
            <div class="card-title">${pet.name}</div>
            <div class="card-subtitle">${pet.type} • ${pet.rarity}</div>
            <div class="card-stats">
                <span class="stat-badge hp">❤️ ${pet.baseHp}</span>
                <span class="stat-badge atk">⚔️ ${pet.baseAtk}</span>
                <span class="stat-badge">🛡️ ${pet.baseDef}</span>
            </div>
        `;
        grid.appendChild(card);
    });
    
    if (petIds.length === 0) {
        grid.innerHTML = '<div class="empty-message">Chưa có pet nào trong database.</div>';
    }
}

function showAddPetModal() {
    document.getElementById('pet-modal-title').textContent = 'Thêm Pet';
    document.getElementById('pet-form').reset();
    document.getElementById('pet-edit-id').value = '';
    document.getElementById('pet-id').disabled = false;
    document.getElementById('modal-pet').classList.remove('hidden');
}

function editPet(petId) {
    const pet = adminPets[petId];
    if (!pet) return;
    
    document.getElementById('pet-modal-title').textContent = 'Sửa Pet';
    document.getElementById('pet-edit-id').value = petId;
    document.getElementById('pet-id').value = pet.id;
    document.getElementById('pet-id').disabled = true;
    document.getElementById('pet-name').value = pet.name;
    document.getElementById('pet-emoji').value = pet.emoji;
    document.getElementById('pet-image').value = pet.image || '';
    document.getElementById('pet-type').value = pet.type;
    document.getElementById('pet-rarity').value = pet.rarity;
    document.getElementById('pet-hp').value = pet.baseHp;
    document.getElementById('pet-atk').value = pet.baseAtk;
    document.getElementById('pet-def').value = pet.baseDef;
    
    // Skill
    if (pet.skill) {
        document.getElementById('skill-name').value = pet.skill.name;
        document.getElementById('skill-emoji').value = pet.skill.emoji;
        document.getElementById('skill-effect').value = pet.skill.effect;
        document.getElementById('skill-power').value = pet.skill.power;
        document.getElementById('skill-cost').value = pet.skill.cost;
        document.getElementById('skill-desc').value = pet.skill.description;
    }
    
    document.getElementById('modal-pet').classList.remove('hidden');
}

function savePet(e) {
    e.preventDefault();
    
    const editId = document.getElementById('pet-edit-id').value;
    const petId = document.getElementById('pet-id').value.toLowerCase();
    
    const petData = {
        id: petId,
        name: document.getElementById('pet-name').value,
        emoji: document.getElementById('pet-emoji').value,
        image: document.getElementById('pet-image').value || undefined,
        type: document.getElementById('pet-type').value,
        rarity: document.getElementById('pet-rarity').value,
        baseHp: parseInt(document.getElementById('pet-hp').value),
        baseAtk: parseInt(document.getElementById('pet-atk').value),
        baseDef: parseInt(document.getElementById('pet-def').value),
        skill: {
            name: document.getElementById('skill-name').value,
            emoji: document.getElementById('skill-emoji').value,
            effect: document.getElementById('skill-effect').value,
            power: parseInt(document.getElementById('skill-power').value),
            cost: parseInt(document.getElementById('skill-cost').value),
            description: document.getElementById('skill-desc').value
        }
    };
    
    if (!editId && adminPets[petId]) {
        alert('ID pet đã tồn tại!');
        return;
    }
    
    adminPets[petId] = petData;
    
    saveAllData();
    closeModal('modal-pet');
    renderPets();
    populateSelects();
}

function deletePet(petId) {
    if (!confirm(`Bạn có chắc muốn xóa pet "${petId}"?`)) {
        return;
    }
    
    delete adminPets[petId];
    saveAllData();
    renderPets();
    populateSelects();
}

// ========================================
// EXPORT / IMPORT
// ========================================

function exportAllData() {
    const data = {
        planets: adminPlanets,
        stages: adminStages,
        pets: adminPets,
        exportedAt: new Date().toISOString()
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokiwar_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.planets) adminPlanets = data.planets;
            if (data.stages) adminStages = data.stages;
            if (data.pets) adminPets = data.pets;
            
            saveAllData();
            
            alert('Import thành công!');
            renderPlanets();
            renderPets();
            populateSelects();
        } catch (err) {
            alert('Lỗi khi import file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function resetToDefault() {
    if (!confirm('Bạn có chắc muốn xóa tất cả dữ liệu tùy chỉnh và khôi phục về mặc định?')) {
        return;
    }
    
    localStorage.removeItem(ADMIN_STORAGE.PLANETS);
    localStorage.removeItem(ADMIN_STORAGE.STAGES);
    localStorage.removeItem(ADMIN_STORAGE.PETS);
    
    location.reload();
}

// ========================================
// HELPERS
// ========================================

function populateSelects() {
    // Planet selects
    const planetSelects = [
        document.getElementById('stage-planet-select'),
        document.getElementById('stage-planet')
    ];
    
    planetSelects.forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- Chọn Hành Tinh --</option>';
        adminPlanets.forEach(planet => {
            select.innerHTML += `<option value="${planet.id}">${planet.emoji} ${planet.name}</option>`;
        });
        if (currentValue) select.value = currentValue;
    });
    
    // Pet select
    const petSelect = document.getElementById('stage-pet');
    if (petSelect) {
        petSelect.innerHTML = '<option value="">-- Chọn Pet --</option>';
        Object.keys(adminPets).forEach(petId => {
            const pet = adminPets[petId];
            petSelect.innerHTML += `<option value="${petId}">${pet.emoji} ${pet.name}</option>`;
        });
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});
