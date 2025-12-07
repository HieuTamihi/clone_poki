// ========================================
// MAIN - Game Initialization
// ========================================

// Initialize game on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 PokiWar - Game Starting...');
    
    // Load game data
    loadGame();
    
    // Show 3D lobby
    showScreen('lobby-3d');
    
    // Update top bar
    updateTopBar();
    
    // Setup overlay close
    document.getElementById('overlay-close').addEventListener('click', () => {
        document.getElementById('overlay').classList.add('hidden');
    });
    
    // Check for first time player
    if (gameState.pets.length === 0 && gameState.completedStages.length === 0) {
        showWelcomeMessage();
    }
    
    console.log('✅ Game Ready!');
});

function updateTopBar() {
    const goldEl = document.getElementById('top-gold');
    const gemsEl = document.getElementById('top-gems');
    
    if (goldEl) {
        const gold = gameState.player.gold;
        goldEl.textContent = gold >= 1000000 ? `${(gold / 1000000).toFixed(1)}M` : gold.toLocaleString();
    }
    
    if (gemsEl) {
        // Placeholder for gems - you can add this to gameState later
        gemsEl.textContent = '60000';
    }
}

// Welcome message for new players
function showWelcomeMessage() {
    setTimeout(() => {
        const overlay = document.getElementById('overlay');
        const title = document.getElementById('overlay-title');
        const desc = document.getElementById('overlay-desc');
        const content = document.getElementById('overlay-content');
        
        title.textContent = '🎮 Chào Mừng Đến PokiWar!';
        desc.textContent = 'Bắt đầu cuộc phiêu lưu thu phục Pet của bạn!';
        content.innerHTML = `
            <div class="welcome-content">
                <p>🌍 Khám phá các hành tinh khác nhau</p>
                <p>👾 Thu phục hơn 25 loại Pet độc đáo</p>
                <p>⚔️ Chiến đấu với hệ thống Match-3</p>
                <p>📈 Nâng cấp và phát triển đội hình</p>
                <br>
                <p><strong>Hãy bắt đầu từ Hành Tinh Trái Đất!</strong></p>
            </div>
        `;
        
        overlay.classList.remove('hidden');
    }, 500);
}

// Auto-save every 30 seconds
setInterval(() => {
    saveGame();
}, 30000);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to go back
    if (e.key === 'Escape') {
        if (currentScreen === 'battle') {
            // Don't allow ESC during battle
            return;
        }
        
        const backMap = {
            'planets': 'lobby',
            'stages': 'planets',
            'collection': 'lobby',
            'stats': 'lobby',
            'prepare': 'stages',
        };
        
        if (backMap[currentScreen]) {
            showScreen(backMap[currentScreen]);
        }
    }
});

// Prevent accidental page close during battle
window.addEventListener('beforeunload', (e) => {
    if (currentScreen === 'battle' && battleState.turn === 'player') {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});

// Add floating animation CSS
const floatAnimStyle = document.createElement('style');
floatAnimStyle.textContent = `
    @keyframes floatUp {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        20% { opacity: 1; transform: translate(-50%, -60%) scale(1.2); }
        100% { opacity: 0; transform: translate(-50%, -120%) scale(0.8); }
    }
`;
document.head.appendChild(floatAnimStyle);

console.log('🎮 PokiWar v1.0 - Ready to Play!');
