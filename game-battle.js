// ========================================
// BATTLE SYSTEM - Match-3 Combat
// ========================================

// Battle Constants
const BOARD_SIZE = 8;
const GEM_TYPES = 4; // 0: dmg, 1: mp, 2: hp, 3: atk

const BATTLE_CONFIG = {
    BASE_DAMAGE: 10,
    BASE_HEAL: 5,
    BASE_MANA: 4,
    BASE_ATK_BUFF: 6,
    COMBO_MULTIPLIER: 0.15,
    PET_SKILL_COST: 30,
};

// Battle State
const battleState = {
    board: [],
    selected: null,
    locking: false,
    combo: 0,
    turn: 'player',
    playerHp: 100,
    playerHpMax: 100,
    playerMp: 50,
    playerMpMax: 50,
    playerAtkBonus: 0,
    enemyHp: 100,
    enemyHpMax: 100,
    enemyAtk: 10,
    currentEnemy: null,
    battleTeam: [],
};

// Utility Functions
const idx = (r, c) => r * BOARD_SIZE + c;
const inRange = (r, c) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function gemIcon(type) {
    switch (type) {
        case 0: return '🗡️'; // damage
        case 1: return '💧'; // mana
        case 2: return '❤️'; // heal
        case 3: return '🔥'; // atk buff
        default: return '❓';
    }
}

function randomGem() {
    return Math.floor(Math.random() * GEM_TYPES);
}

// Start Battle
function startBattle() {
    if (!gameState.currentStage) return;

    // Check if at least one pet is selected
    const selectedPets = gameState.selectedTeam.filter(p => p !== null);
    if (selectedPets.length === 0) {
        showNotification('⚠️ Hãy chọn ít nhất 1 pet!', 'warning');
        return;
    }

    // Initialize battle state
    battleState.currentEnemy = gameState.currentStage;
    battleState.battleTeam = [...gameState.selectedTeam];
    
    // Calculate team stats
    const teamStats = calculateTeamStats(selectedPets);
    battleState.playerHp = teamStats.hp;
    battleState.playerHpMax = teamStats.hp;
    battleState.playerMp = teamStats.mp;
    battleState.playerMpMax = teamStats.mp;
    battleState.playerAtkBonus = 0;
    
    battleState.enemyHp = gameState.currentStage.hp;
    battleState.enemyHpMax = gameState.currentStage.hp;
    battleState.enemyAtk = gameState.currentStage.atk;
    
    battleState.turn = 'player';
    battleState.combo = 0;
    battleState.locking = false;

    // Generate board
    generateBoard();
    
    // Update UI
    updateBattleUI();
    showScreen('battle');
}

function calculateTeamStats(pets) {
    let totalHp = 100;
    let totalMp = 50;
    
    pets.forEach(pet => {
        if (pet) {
            const petData = PETS_DATABASE[pet.id];
            if (petData) {
                // Use base stats directly if getPetStats is not available
                const hp = petData.baseHp || 50;
                const level = pet.level || 1;
                totalHp += Math.floor(hp * (1 + (level - 1) * 0.1));
                totalMp += 20;
            }
        }
    });
    
    return { hp: Math.floor(totalHp), mp: Math.floor(totalMp) };
}

// Board Generation
function generateBoard() {
    battleState.board = new Array(BOARD_SIZE * BOARD_SIZE).fill(0);
    fillBoardNoMatches(battleState.board);
    drawBattleBoard();
}

function fillBoardNoMatches(boardArr) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            let g;
            let attempts = 0;
            do {
                g = randomGem();
                attempts++;
                if (attempts > 20) break;
            } while (createsImmediateMatch(boardArr, r, c, g));
            boardArr[idx(r, c)] = g;
        }
    }
}

function createsImmediateMatch(boardArr, r, c, g) {
    if (c >= 2 && boardArr[idx(r, c - 1)] === g && boardArr[idx(r, c - 2)] === g) return true;
    if (r >= 2 && boardArr[idx(r - 1, c)] === g && boardArr[idx(r - 2, c)] === g) return true;
    return false;
}

function wouldCreateMatch(boardArr, r, c, g) {
    const original = boardArr[idx(r, c)];
    boardArr[idx(r, c)] = g;
    const res = (
        (c >= 2 && boardArr[idx(r, c - 1)] === g && boardArr[idx(r, c - 2)] === g) ||
        (c <= BOARD_SIZE - 3 && boardArr[idx(r, c + 1)] === g && boardArr[idx(r, c + 2)] === g) ||
        (c >= 1 && c <= BOARD_SIZE - 2 && boardArr[idx(r, c - 1)] === g && boardArr[idx(r, c + 1)] === g) ||
        (r >= 2 && boardArr[idx(r - 1, c)] === g && boardArr[idx(r - 2, c)] === g) ||
        (r <= BOARD_SIZE - 3 && boardArr[idx(r + 1, c)] === g && boardArr[idx(r + 2, c)] === g) ||
        (r >= 1 && r <= BOARD_SIZE - 2 && boardArr[idx(r - 1, c)] === g && boardArr[idx(r + 1, c)] === g)
    );
    boardArr[idx(r, c)] = original;
    return res;
}

// Board Rendering
function drawBattleBoard() {
    const container = document.getElementById('battle-board');
    container.innerHTML = '';
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            const gem = document.createElement('div');
            const type = battleState.board[idx(r, c)];
            gem.className = `gem type-${type}`;
            gem.textContent = gemIcon(type);
            
            cell.appendChild(gem);
            cell.addEventListener('click', onCellClick);
            container.appendChild(cell);
        }
    }
}

// Board Interaction
function onCellClick(e) {
    if (battleState.locking || battleState.turn !== 'player') return;
    
    const cell = e.currentTarget;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    
    if (!battleState.selected) {
        battleState.selected = { r, c };
        cell.classList.add('selected');
        return;
    }
    
    const { r: r0, c: c0 } = battleState.selected;
    if (r === r0 && c === c0) {
        cell.classList.remove('selected');
        battleState.selected = null;
        return;
    }
    
    const isNeighbor = Math.abs(r - r0) + Math.abs(c - c0) === 1;
    const prevCell = document.querySelector(`#battle-board .cell[data-r="${r0}"][data-c="${c0}"]`);
    prevCell?.classList.remove('selected');
    battleState.selected = null;
    
    if (!isNeighbor) return;
    trySwap(r0, c0, r, c);
}

function trySwap(r0, c0, r1, c1) {
    if (battleState.locking) return;
    battleState.locking = true;
    
    swap(battleState.board, r0, c0, r1, c1);
    
    if (hasAnyMatch(battleState.board)) {
        battleState.combo = 0;
        drawBattleBoard();
        resolveBoard('player').then(() => {
            playerTurnEnd();
        });
    } else {
        setTimeout(() => {
            swap(battleState.board, r0, c0, r1, c1);
            drawBattleBoard();
            battleState.locking = false;
        }, 120);
    }
}

function swap(boardArr, r0, c0, r1, c1) {
    const i0 = idx(r0, c0);
    const i1 = idx(r1, c1);
    const t = boardArr[i0];
    boardArr[i0] = boardArr[i1];
    boardArr[i1] = t;
}

// Match Detection
function hasAnyMatch(boardArr) {
    return findMatches(boardArr).length > 0;
}

function findMatches(boardArr) {
    const matches = [];
    
    // Horizontal
    for (let r = 0; r < BOARD_SIZE; r++) {
        let runStart = 0;
        for (let c = 1; c <= BOARD_SIZE; c++) {
            const same = c < BOARD_SIZE && boardArr[idx(r, c)] === boardArr[idx(r, c - 1)];
            if (!same) {
                const len = c - runStart;
                if (len >= 3) matches.push({ dir: 'h', r, c0: runStart, c1: c - 1 });
                runStart = c;
            }
        }
    }
    
    // Vertical
    for (let c = 0; c < BOARD_SIZE; c++) {
        let runStart = 0;
        for (let r = 1; r <= BOARD_SIZE; r++) {
            const same = r < BOARD_SIZE && boardArr[idx(r, c)] === boardArr[idx(r - 1, c)];
            if (!same) {
                const len = r - runStart;
                if (len >= 3) matches.push({ dir: 'v', c, r0: runStart, r1: r - 1 });
                runStart = r;
            }
        }
    }
    
    return matches;
}

// Board Resolution
function resolveBoard(owner) {
    return new Promise(async (resolve) => {
        let totalEffect = { dmg: 0, heal: 0, mp: 0, atkPct: 0 };
        let loopGuard = 0;
        
        while (true) {
            loopGuard++;
            if (loopGuard > 20) break;
            
            const matches = findMatches(battleState.board);
            if (!matches.length) break;
            
            battleState.combo++;
            
            const toClear = new Set();
            for (const m of matches) {
                if (m.dir === 'h') {
                    for (let c = m.c0; c <= m.c1; c++) toClear.add(idx(m.r, c));
                } else {
                    for (let r = m.r0; r <= m.r1; r++) toClear.add(idx(r, m.c));
                }
            }
            
            // Calculate effects
            const counts = [0, 0, 0, 0];
            for (const i of toClear) counts[battleState.board[i]]++;
            
            const comboMult = 1 + (battleState.combo - 1) * BATTLE_CONFIG.COMBO_MULTIPLIER;
            const atkBonus = owner === 'player' ? battleState.playerAtkBonus : 0;
            
            totalEffect.dmg += Math.round(counts[0] * BATTLE_CONFIG.BASE_DAMAGE * (1 + atkBonus * 0.01) * comboMult);
            totalEffect.mp += Math.round(counts[1] * BATTLE_CONFIG.BASE_MANA * comboMult);
            totalEffect.heal += Math.round(counts[2] * BATTLE_CONFIG.BASE_HEAL * comboMult);
            totalEffect.atkPct += Math.round(counts[3] * BATTLE_CONFIG.BASE_ATK_BUFF * comboMult);
            
            // Visual effects
            for (const i of toClear) {
                const r = Math.floor(i / BOARD_SIZE);
                const c = i % BOARD_SIZE;
                const el = document.querySelector(`#battle-board .cell[data-r="${r}"][data-c="${c}"] .gem`);
                if (el) {
                    el.classList.add('match-pop');
                    el.classList.add('clearing');
                }
            }
            
            if (battleState.combo > 1) {
                showFloatingText(`COMBO x${battleState.combo}!`, 'combo');
            }
            
            await sleep(200);
            
            // Clear and refill
            for (const i of toClear) battleState.board[i] = -1;
            
            // Drop gems
            for (let c = 0; c < BOARD_SIZE; c++) {
                let write = BOARD_SIZE - 1;
                for (let r = BOARD_SIZE - 1; r >= 0; r--) {
                    const i = idx(r, c);
                    if (battleState.board[i] !== -1) {
                        const v = battleState.board[i];
                        battleState.board[i] = -1;
                        battleState.board[idx(write, c)] = v;
                        write--;
                    }
                }
                
                for (let r = write; r >= 0; r--) {
                    let g;
                    let attempts = 0;
                    do {
                        g = randomGem();
                        attempts++;
                        if (attempts > 10) break;
                    } while (wouldCreateMatch(battleState.board, r, c, g));
                    battleState.board[idx(r, c)] = g;
                }
            }
            
            drawBattleBoard();
            await sleep(300);
        }
        
        applyEffects(owner, totalEffect);
        resolve();
    });
}

// Apply Effects
function applyEffects(owner, eff) {
    if (owner === 'player') {
        if (eff.atkPct) {
            battleState.playerAtkBonus = Math.min(100, battleState.playerAtkBonus + eff.atkPct);
            showFloatingText(`+${eff.atkPct}% ATK`, 'buff');
        }
        if (eff.mp) {
            battleState.playerMp = Math.min(battleState.playerMpMax, battleState.playerMp + eff.mp);
            showFloatingText(`+${eff.mp} MP`, 'mana');
        }
        if (eff.heal) {
            battleState.playerHp = Math.min(battleState.playerHpMax, battleState.playerHp + eff.heal);
            showFloatingText(`+${eff.heal} HP`, 'heal');
            gameState.stats.totalHealing += eff.heal;
        }
        if (eff.dmg) {
            battleState.enemyHp = Math.max(0, battleState.enemyHp - eff.dmg);
            showFloatingText(`-${eff.dmg} DMG`, 'damage');
            gameState.stats.totalDamage += eff.dmg;
            
            // Show attack projectile effect
            const petType = getPetTypeForEffects();
            const playerPetsEl = document.querySelector('.battle-player-3d');
            const enemyPortraitEl = document.querySelector('.battle-enemy-3d');
            
            if (playerPetsEl && enemyPortraitEl) {
                showAttackProjectile(playerPetsEl, enemyPortraitEl, petType);
                
                // Show damage number on enemy
                const rect = enemyPortraitEl.getBoundingClientRect();
                setTimeout(() => {
                    showDamageNumber(
                        rect.left + rect.width / 2 - 20,
                        rect.top + 20,
                        eff.dmg,
                        'damage'
                    );
                }, 450);
            }
        }
    } else {
        if (eff.dmg) {
            const damage = Math.round(eff.dmg * (0.7 + Math.random() * 0.3));
            battleState.playerHp = Math.max(0, battleState.playerHp - damage);
            showFloatingText(`-${damage} HP`, 'damage');
            
            // Show enemy attack projectile
            const enemyPortraitEl = document.querySelector('.battle-enemy-3d');
            const playerPetsEl = document.querySelector('.battle-player-3d');
            
            if (enemyPortraitEl && playerPetsEl) {
                showAttackProjectile(enemyPortraitEl, playerPetsEl, 'dark');
                
                // Show damage number on player
                const rect = playerPetsEl.getBoundingClientRect();
                setTimeout(() => {
                    showDamageNumber(
                        rect.left + rect.width / 2,
                        rect.top + 20,
                        damage,
                        'damage'
                    );
                }, 450);
            }
        }
    }
    
    updateBattleUI();
}

// Pet Skills
function usePetSkill(slotIndex) {
    const pet = battleState.battleTeam[slotIndex];
    if (!pet || battleState.playerMp < BATTLE_CONFIG.PET_SKILL_COST || battleState.turn !== 'player' || battleState.locking) {
        return;
    }
    
    battleState.locking = true;
    battleState.playerMp -= BATTLE_CONFIG.PET_SKILL_COST;
    
    const petData = PETS_DATABASE[pet.id];
    const skill = petData.skill;
    const effect = {};
    
    switch (skill.effect) {
        case 'dmg':
            effect.dmg = skill.power;
            break;
        case 'heal':
            effect.heal = skill.power;
            break;
        case 'atkBuff':
            effect.atkPct = skill.power;
            break;
        case 'healMana':
            effect.heal = skill.power;
            effect.mp = skill.power;
            break;
    }
    
    showFloatingText(`${petData.emoji} ${skill.name}!`, 'skill');
    
    // Show skill magic circle effect
    const petSlot = document.querySelectorAll('.battle-pet-wrapper')[slotIndex];
    if (petSlot) {
        showSkillEffect(petSlot, petData.type);
    }
    
    setTimeout(() => {
        applyEffects('player', effect);
        setTimeout(() => {
            playerTurnEnd();
        }, 300);
    }, 500);
}

// Turn Management
async function playerTurnEnd() {
    updateBattleUI();
    
    if (battleState.enemyHp <= 0) {
        await onBattleWin();
        return;
    }
    
    battleState.turn = 'enemy';
    updateBattleUI();
    await sleep(500);
    await enemyTurn();
    
    if (battleState.playerHp <= 0) {
        await onBattleLose();
        return;
    }
    
    battleState.turn = 'player';
    battleState.playerAtkBonus = Math.max(0, battleState.playerAtkBonus - 15);
    updateBattleUI();
    battleState.locking = false;
}

async function enemyTurn() {
    // Show enemy is thinking
    showFloatingText('🤔 Enemy đang suy nghĩ...', 'info');
    await sleep(800);
    
    const move = findValidSwap(battleState.board);
    if (!move) {
        showFloatingText('😕 Enemy không tìm được nước đi', 'info');
        await sleep(250);
        return;
    }
    
    // Highlight enemy's move
    const cell1 = document.querySelector(`#battle-board .cell[data-r="${move.r0}"][data-c="${move.c0}"]`);
    const cell2 = document.querySelector(`#battle-board .cell[data-r="${move.r1}"][data-c="${move.c1}"]`);
    
    if (cell1) cell1.classList.add('enemy-selected');
    if (cell2) cell2.classList.add('enemy-selected');
    
    await sleep(500);
    
    // Make the swap
    swap(battleState.board, move.r0, move.c0, move.r1, move.c1);
    drawBattleBoard();
    
    showFloatingText('👹 Enemy tấn công!', 'damage');
    await sleep(150);
    
    battleState.combo = 0;
    await resolveBoard('enemy');
}

function findValidSwap(boardArr) {
    const neighbors = (r, c) => [[r-1,c], [r+1,c], [r,c-1], [r,c+1]].filter(([rr,cc]) => inRange(rr,cc));
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            for (const [rr, cc] of neighbors(r, c)) {
                if (r > rr || (r === rr && c > cc)) continue;
                swap(boardArr, r, c, rr, cc);
                const ok = hasAnyMatch(boardArr);
                swap(boardArr, r, c, rr, cc);
                if (ok) return { r0: r, c0: c, r1: rr, c1: cc };
            }
        }
    }
    return null;
}

// Battle End
async function onBattleWin() {
    battleState.locking = true;
    const stage = battleState.currentEnemy;
    
    // Add pet if not owned
    if (!gameState.pets.find(p => p.id === stage.petId)) {
        addPet(stage.petId);
        showNotification(`🎉 Đã thu phục ${stage.emoji} ${stage.name}!`);
    }
    
    // Rewards
    addGold(stage.reward);
    addExp(stage.exp);
    
    // Add materials
    if (stage.materials) {
        stage.materials.forEach(mat => addMaterial(mat, 1));
    }
    
    // Complete stage
    completeStage(stage.id);
    
    // Stats
    gameState.stats.totalBattles++;
    gameState.stats.wins++;
    if (battleState.playerHp === battleState.playerHpMax) {
        gameState.stats.perfectWins++;
    }
    saveGame();
    
    // Show result
    showBattleResult(true);
}

async function onBattleLose() {
    battleState.locking = true;
    gameState.stats.totalBattles++;
    gameState.stats.losses++;
    saveGame();
    
    showBattleResult(false);
}

function showBattleResult(won) {
    const overlay = document.getElementById('overlay');
    const title = document.getElementById('overlay-title');
    const desc = document.getElementById('overlay-desc');
    const content = document.getElementById('overlay-content');
    
    if (won) {
        const stage = battleState.currentEnemy;
        title.textContent = '🎉 Chiến Thắng!';
        desc.textContent = `Bạn đã đánh bại ${stage.name}!`;
        content.innerHTML = `
            <div class="battle-rewards">
                <div class="reward-item">💰 +${stage.reward} Gold</div>
                <div class="reward-item">⭐ +${stage.exp} EXP</div>
                ${!gameState.pets.find(p => p.id === stage.petId) ? 
                    `<div class="reward-item special">🎁 Thu phục ${stage.emoji} ${stage.name}!</div>` : ''}
            </div>
        `;
    } else {
        title.textContent = '💀 Thất Bại';
        desc.textContent = 'Đừng bỏ cuộc! Hãy thử lại!';
        content.innerHTML = '';
    }
    
    overlay.classList.remove('hidden');
    
    // Override close button
    const closeBtn = document.getElementById('overlay-close');
    closeBtn.onclick = () => {
        overlay.classList.add('hidden');
        showScreen('stages');
    };
}

function retreatBattle() {
    if (confirm('Bạn có chắc muốn rút lui?')) {
        showScreen('stages');
    }
}

// Update Battle UI
function updateBattleUI() {
    // Player HP/MP
    document.getElementById('battle-player-hp-text').textContent = 
        `${battleState.playerHp}/${battleState.playerHpMax}`;
    document.getElementById('battle-player-hp-fill').style.width = 
        `${(battleState.playerHp / battleState.playerHpMax) * 100}%`;
    
    document.getElementById('battle-player-mp-text').textContent = 
        `${battleState.playerMp}/${battleState.playerMpMax}`;
    document.getElementById('battle-player-mp-fill').style.width = 
        `${(battleState.playerMp / battleState.playerMpMax) * 100}%`;
    
    // Enemy HP
    document.getElementById('battle-enemy-hp-text').textContent = 
        `${battleState.enemyHp}/${battleState.enemyHpMax}`;
    document.getElementById('battle-enemy-hp-fill').style.width = 
        `${(battleState.enemyHp / battleState.enemyHpMax) * 100}%`;
    
    // Enemy info
    if (battleState.currentEnemy) {
        const enemyPortrait = document.getElementById('battle-enemy-portrait');
        const petData = PETS_DATABASE[battleState.currentEnemy.petId];
        
        if (petData && petData.image) {
            enemyPortrait.innerHTML = `<img src="${petData.image}" alt="${battleState.currentEnemy.name}" class="enemy-portrait-img">`;
        } else {
            enemyPortrait.textContent = battleState.currentEnemy.emoji;
        }
        
        document.getElementById('battle-enemy-name').textContent = battleState.currentEnemy.name;
        document.getElementById('battle-stage-name').textContent = battleState.currentEnemy.name;
    }
    
    // Turn indicator
    document.getElementById('battle-turn').textContent = 
        battleState.turn === 'player' ? 'Lượt của bạn' : 'Lượt của quái';
    
    // Pet skills
    updatePetSkillButtons();
    
    // Player pets display
    updateBattlePetsDisplay();
}

function updatePetSkillButtons() {
    for (let i = 0; i < 3; i++) {
        const btn = document.getElementById(`skill-btn-${i + 1}`);
        const pet = battleState.battleTeam[i];
        
        if (pet) {
            const petData = PETS_DATABASE[pet.id];
            const skill = petData.skill;
            const canUse = battleState.playerMp >= BATTLE_CONFIG.PET_SKILL_COST && 
                          battleState.turn === 'player' && 
                          !battleState.locking;
            
            btn.disabled = !canUse;
            btn.querySelector('.skill-icon').textContent = skill.emoji;
            btn.querySelector('.skill-name').textContent = skill.name;
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    }
}

function updateBattlePetsDisplay() {
    const container = document.getElementById('battle-player-pets');
    container.innerHTML = '';
    
    battleState.battleTeam.forEach((pet, index) => {
        if (pet) {
            const petData = PETS_DATABASE[pet.id];
            const stats = getPetStats(pet);
            
            const petWrapper = document.createElement('div');
            petWrapper.className = 'battle-pet-wrapper';
            
            const petDiv = document.createElement('div');
            petDiv.className = 'battle-pet-icon';
            petDiv.setAttribute('data-type', petData.type);
            petDiv.title = `${petData.name} Lv.${pet.level}`;
            
            // Use image if available, otherwise use emoji
            if (petData.image) {
                const img = document.createElement('img');
                img.src = petData.image;
                img.alt = petData.name;
                img.className = 'pet-image';
                img.onerror = () => { petDiv.textContent = petData.emoji; };
                petDiv.appendChild(img);
            } else {
                petDiv.textContent = petData.emoji;
            }
            
            // Add HP bar for each pet
            const hpBar = document.createElement('div');
            hpBar.className = 'pet-hp-bar';
            hpBar.innerHTML = `
                <div class="pet-hp-text">${stats.hp}/${stats.hpMax}</div>
                <div class="pet-hp-fill" style="width: 100%; background: linear-gradient(90deg, #51cf66, #2b8a3e);"></div>
            `;
            
            petWrapper.appendChild(petDiv);
            petWrapper.appendChild(hpBar);
            container.appendChild(petWrapper);
        }
    });
}

// Floating Text
function showFloatingText(text, type = 'info') {
    const floater = document.createElement('div');
    floater.textContent = text;
    floater.style.cssText = `
        position: fixed;
        left: 50%;
        top: 40%;
        transform: translate(-50%, -50%);
        font-size: ${type === 'combo' ? '32px' : '24px'};
        font-weight: bold;
        pointer-events: none;
        z-index: 9999;
        text-shadow: 0 2px 10px rgba(0,0,0,0.8);
        animation: floatUp 1.5s ease-out forwards;
    `;
    
    const colors = {
        damage: '#ff4d6d',
        heal: '#51cf66',
        mana: '#4dabf7',
        buff: '#ffd43b',
        combo: '#ffd700',
        skill: '#e64980',
        info: '#ffffff',
    };
    
    floater.style.color = colors[type] || colors.info;
    document.body.appendChild(floater);
    setTimeout(() => floater.remove(), 1500);
}

// ===========================================
// ATTACK VISUAL EFFECTS
// ===========================================

// Show attack projectile flying from source to target
function showAttackProjectile(sourceEl, targetEl, type = 'fire') {
    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    
    const projectile = document.createElement('div');
    projectile.className = `attack-projectile ${type}`;
    
    // Start position
    const startX = sourceRect.left + sourceRect.width / 2 - 20;
    const startY = sourceRect.top + sourceRect.height / 2 - 20;
    
    // End position  
    const endX = targetRect.left + targetRect.width / 2 - 20;
    const endY = targetRect.top + targetRect.height / 2 - 20;
    
    projectile.style.left = startX + 'px';
    projectile.style.top = startY + 'px';
    
    // Create custom animation for this projectile
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    
    projectile.animate([
        { transform: 'translate(0, 0) scale(0.5)', opacity: 0 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.1 },
        { transform: `translate(${deltaX}px, ${deltaY}px) scale(1.2)`, opacity: 1 }
    ], {
        duration: 500,
        easing: 'ease-out',
        fill: 'forwards'
    });
    
    document.body.appendChild(projectile);
    
    // Show impact at target
    setTimeout(() => {
        showImpact(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2);
        projectile.remove();
    }, 450);
}

// Show impact explosion at position
function showImpact(x, y) {
    const impact = document.createElement('div');
    impact.className = 'impact-effect';
    impact.style.left = (x - 50) + 'px';
    impact.style.top = (y - 50) + 'px';
    
    document.body.appendChild(impact);
    setTimeout(() => impact.remove(), 500);
}

// Show skill magic circle effect
function showSkillEffect(targetEl, type = 'fire') {
    const rect = targetEl.getBoundingClientRect();
    
    const effect = document.createElement('div');
    effect.className = `skill-effect ${type}`;
    effect.style.left = (rect.left + rect.width / 2 - 60) + 'px';
    effect.style.top = (rect.top + rect.height / 2 - 60) + 'px';
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
}

// Show damage number at position
function showDamageNumber(x, y, amount, type = 'damage') {
    const dmgNum = document.createElement('div');
    dmgNum.className = `damage-number ${type}`;
    dmgNum.textContent = type === 'heal' ? `+${amount}` : `-${amount}`;
    dmgNum.style.left = x + 'px';
    dmgNum.style.top = y + 'px';
    
    document.body.appendChild(dmgNum);
    setTimeout(() => dmgNum.remove(), 1000);
}

// Show combo text
function showComboEffect(comboCount) {
    const combo = document.createElement('div');
    combo.className = 'combo-effect';
    combo.textContent = `${comboCount}x COMBO!`;
    combo.style.left = '50%';
    combo.style.top = '30%';
    combo.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(combo);
    setTimeout(() => combo.remove(), 1500);
}

// Helper to get pet type for effects
function getPetTypeForEffects() {
    const firstPet = battleState.battleTeam[0];
    if (firstPet) {
        const petData = PETS_DATABASE[firstPet.id];
        return petData?.type || 'fire';
    }
    return 'fire';
}

