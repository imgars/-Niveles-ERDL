function checkAuthentication() {
    const token = localStorage.getItem('adminToken');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry || Date.now() >= parseInt(expiry)) {
        window.location.href = '/admin/login.html';
        return false;
    }
    return true;
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('adminUsername');
    window.location.href = '/admin/login.html';
});

const adminNameEl = document.getElementById('adminName');
if (adminNameEl) {
    const username = localStorage.getItem('adminUsername');
    adminNameEl.textContent = username ? `👤 ${username}` : '';
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}-page`)?.classList.add('active');
        
        const titles = {
            dashboard: 'Dashboard Principal',
            xp: 'Sistema de XP',
            niveles: 'Sistema de Niveles',
            roles: 'Roles por Nivel',
            misiones: 'Misiones',
            powerups: 'Power-ups',
            estadisticas: 'Estadisticas',
            logs: 'Logs en Tiempo Real',
            usuarios: 'Gestion de Usuarios',
            configuracion: 'Configuracion'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Panel Admin';
        
        loadPageData(page);
    });
});

const dataHistory = {
    timestamps: [],
    xpData: [],
    levelsData: [],
    maxPoints: 12
};

async function fetchAPI(endpoint) {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
        if (response.status === 401) {
            window.location.href = '/admin/login.html';
        }
        throw new Error('API Error');
    }
    
    return response.json();
}

async function loadDashboardData() {
    try {
        const data = await fetchAPI('/api/admin/dashboard');
        
        document.getElementById('botStatus').textContent = data.botStatus || 'Online';
        document.getElementById('uptime').textContent = formatUptime(data.uptime || 0);
        document.getElementById('guildCount').textContent = data.guildCount || 0;
        document.getElementById('userCount').textContent = data.userCount || 0;
        
        document.getElementById('xpToday').textContent = (data.xpToday || 0).toLocaleString();
        document.getElementById('levelsToday').textContent = data.levelsToday || 0;
        document.getElementById('missionsToday').textContent = data.missionsToday || 0;
        document.getElementById('errorsToday').textContent = data.errorsToday || 0;
        
        document.getElementById('botVersion').textContent = data.botVersion || '1.0.0';
        document.getElementById('lastSync').textContent = formatDate(data.lastSync);
        document.getElementById('mongoStatus').textContent = data.mongoStatus || 'Desconectado';
        document.getElementById('nodeVersion').textContent = data.nodeVersion || 'v20.0.0';
        
        const now = new Date();
        const timeLabel = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        dataHistory.timestamps.push(timeLabel);
        dataHistory.xpData.push(data.xpToday || 0);
        dataHistory.levelsData.push(data.levelsToday || 0);
        
        if (dataHistory.timestamps.length > dataHistory.maxPoints) {
            dataHistory.timestamps.shift();
            dataHistory.xpData.shift();
            dataHistory.levelsData.shift();
        }
        
        updateActivityChart();
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        document.getElementById('botStatus').textContent = 'Error';
    }
}

async function loadXPData() {
    try {
        const data = await fetchAPI('/api/admin/xp');
        
        document.getElementById('totalXp').textContent = (data.totalXp || 0).toLocaleString();
        document.getElementById('avgXp').textContent = (data.avgXp || 0).toLocaleString();
        document.getElementById('maxXp').textContent = (data.maxXp || 0).toLocaleString();
        document.getElementById('activeUsersXp').textContent = data.activeUsers || 0;
        
        if (data.config) {
            document.getElementById('xpCooldown').textContent = `${data.config.cooldown / 1000}s`;
            document.getElementById('xpBase').textContent = `${data.config.baseMin}-${data.config.baseMax}`;
            document.getElementById('boosterMult').textContent = `${data.config.boosterMultiplier}x`;
            document.getElementById('nightMult').textContent = `+${data.config.nightMultiplier}x`;
        }
        
        const topContainer = document.getElementById('topXpUsers');
        if (data.topUsers && data.topUsers.length > 0) {
            topContainer.innerHTML = data.topUsers.map((user, i) => `
                <div class="top-item">
                    <span class="top-rank">#${i + 1}</span>
                    <span class="top-id">${user.id}</span>
                    <span class="top-value">${user.xp.toLocaleString()} XP</span>
                    <span class="top-level">Nv. ${user.level}</span>
                </div>
            `).join('');
        } else {
            topContainer.innerHTML = '<p class="empty-text">No hay datos</p>';
        }
    } catch (error) {
        console.error('Error cargando XP:', error);
        document.getElementById('topXpUsers').innerHTML = '<p class="error-text">Error al cargar datos</p>';
    }
}

async function loadLevelsData() {
    try {
        const data = await fetchAPI('/api/admin/levels');
        
        document.getElementById('maxLevel').textContent = data.maxLevel || 0;
        document.getElementById('avgLevel').textContent = data.avgLevel || 0;
        document.getElementById('level100Count').textContent = data.usersWithLevel100 || 0;
        
        const distContainer = document.getElementById('levelDistribution');
        if (data.levelDistribution) {
            const entries = Object.entries(data.levelDistribution).sort((a, b) => {
                const aNum = parseInt(a[0].split('-')[0]);
                const bNum = parseInt(b[0].split('-')[0]);
                return aNum - bNum;
            });
            
            const maxCount = Math.max(...entries.map(e => e[1]));
            
            distContainer.innerHTML = `
                <div class="bar-chart">
                    ${entries.map(([range, count]) => `
                        <div class="chart-bar-item">
                            <div class="bar-container">
                                <div class="bar-fill-h" style="width: ${(count / maxCount) * 100}%;"></div>
                            </div>
                            <span class="bar-label">${range}</span>
                            <span class="bar-count">${count}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        const topContainer = document.getElementById('topLevelUsers');
        if (data.topLevels && data.topLevels.length > 0) {
            topContainer.innerHTML = data.topLevels.map((user, i) => `
                <div class="top-item">
                    <span class="top-rank">#${i + 1}</span>
                    <span class="top-id">${user.id}</span>
                    <span class="top-value">Nivel ${user.level}</span>
                    <span class="top-xp">${user.xp.toLocaleString()} XP</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando niveles:', error);
        document.getElementById('levelDistribution').innerHTML = '<p class="error-text">Error al cargar datos</p>';
        document.getElementById('topLevelUsers').innerHTML = '<p class="error-text">Error al cargar datos</p>';
    }
}

async function loadRolesData() {
    try {
        const data = await fetchAPI('/api/admin/roles');
        
        const rolesGrid = document.getElementById('levelRolesGrid');
        if (data.levelRoles && data.levelRoles.length > 0) {
            rolesGrid.innerHTML = data.levelRoles.map(role => `
                <div class="role-card">
                    <div class="role-level">Nivel ${role.level}</div>
                    <div class="role-name">${role.roleName}</div>
                    <div class="role-members">${role.memberCount} miembros</div>
                </div>
            `).join('');
        }
        
        const specialGrid = document.getElementById('specialRolesGrid');
        if (data.specialRoles) {
            const roles = Object.entries(data.specialRoles);
            specialGrid.innerHTML = roles.map(([key, role]) => `
                <div class="special-role-card">
                    <div class="special-role-name">${role.name}</div>
                    <div class="special-role-id">ID: ${role.id}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando roles:', error);
        document.getElementById('levelRolesGrid').innerHTML = '<p class="error-text">Error al cargar datos</p>';
    }
}

async function loadMissionsData() {
    try {
        const data = await fetchAPI('/api/admin/missions');
        
        document.getElementById('weekNumber').textContent = data.weekNumber || 0;
        document.getElementById('missionYear').textContent = data.year || new Date().getFullYear();
        document.getElementById('totalMissions').textContent = data.totalMissions || 0;
        document.getElementById('completedMissions').textContent = data.completedMissions || 0;
        document.getElementById('completionRate').textContent = `${data.completionRate || 0}%`;
        document.getElementById('missionChannel').textContent = data.missionChannel || '-';
    } catch (error) {
        console.error('Error cargando misiones:', error);
        document.getElementById('totalMissions').textContent = 'Error';
    }
}

async function loadPowerupsData() {
    try {
        const data = await fetchAPI('/api/admin/powerups');
        
        document.getElementById('globalBoostsCount').textContent = data.globalBoosts?.length || 0;
        document.getElementById('userBoostsCount').textContent = data.userBoostCount || 0;
        document.getElementById('channelBoostsCount').textContent = data.channelBoostCount || 0;
        document.getElementById('totalBoostsActive').textContent = data.totalActive || 0;
        
        document.getElementById('boosterVipMult').textContent = `${data.boosterVipMultiplier || 2.0}x`;
        document.getElementById('nightBoostMult').textContent = `+${data.nightBoostMultiplier || 0.25}x`;
        
        const boostsList = document.getElementById('globalBoostsList');
        if (data.globalBoosts && data.globalBoosts.length > 0) {
            boostsList.innerHTML = data.globalBoosts.map(boost => `
                <div class="boost-item">
                    <span class="boost-mult">${boost.multiplier}x</span>
                    <span class="boost-time">${formatTimeLeft(boost.timeLeft)}</span>
                    <span class="boost-by">por ${boost.addedBy}</span>
                </div>
            `).join('');
        } else {
            boostsList.innerHTML = '<p class="empty-text">No hay boosts globales activos</p>';
        }
    } catch (error) {
        console.error('Error cargando powerups:', error);
        document.getElementById('globalBoostsList').innerHTML = '<p class="error-text">Error al cargar datos</p>';
    }
}

async function loadStatisticsData() {
    try {
        const data = await fetchAPI('/api/admin/statistics');
        
        document.getElementById('statsTotalUsers').textContent = data.totalUsers || 0;
        document.getElementById('statsActiveUsers').textContent = data.activeUsers || 0;
        document.getElementById('statsActiveToday').textContent = data.activeToday || 0;
        document.getElementById('statsActiveWeek').textContent = data.activeThisWeek || 0;
        document.getElementById('statsTotalXp').textContent = (data.totalXp || 0).toLocaleString();
        document.getElementById('statsAvgXp').textContent = (data.avgXpPerUser || 0).toLocaleString();
        document.getElementById('statsAvgLevel').textContent = data.avgLevelPerUser || 0;
        
        document.getElementById('statsMongoStatus').textContent = data.mongoConnected ? 'Conectado' : 'Desconectado';
        document.getElementById('statsMemory').textContent = `${data.memoryUsage?.heapUsed || 0}MB / ${data.memoryUsage?.heapTotal || 0}MB`;
        document.getElementById('statsUptime').textContent = formatUptime(data.uptime * 1000);
        
        const bracketsContainer = document.getElementById('statsLevelBrackets');
        if (data.levelBrackets) {
            const entries = Object.entries(data.levelBrackets);
            const maxCount = Math.max(...entries.map(e => e[1]), 1);
            
            bracketsContainer.innerHTML = `
                <div class="bar-chart">
                    ${entries.map(([range, count]) => `
                        <div class="chart-bar-item">
                            <div class="bar-container">
                                <div class="bar-fill-h" style="width: ${(count / maxCount) * 100}%;"></div>
                            </div>
                            <span class="bar-label">${range}</span>
                            <span class="bar-count">${count}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando estadisticas:', error);
        document.getElementById('statsLevelBrackets').innerHTML = '<p class="error-text">Error al cargar datos</p>';
    }
}

async function loadConfigData() {
    try {
        const data = await fetchAPI('/api/admin/config');
        
        if (data.xpSystem) {
            document.getElementById('cfgCooldown').textContent = `${data.xpSystem.cooldown / 1000}s`;
            document.getElementById('cfgXpMin').textContent = data.xpSystem.baseMin;
            document.getElementById('cfgXpMax').textContent = data.xpSystem.baseMax;
            document.getElementById('cfgBoosterMult').textContent = `${data.xpSystem.boosterMultiplier}x`;
            document.getElementById('cfgNightMult').textContent = `+${data.xpSystem.nightMultiplier}x`;
        }
        
        if (data.channels) {
            document.getElementById('cfgLevelUpChannel').textContent = data.channels.levelUp;
            document.getElementById('cfgMissionChannel').textContent = data.channels.missionComplete;
            
            const noXpContainer = document.getElementById('cfgNoXpChannels');
            if (data.channels.noXp && data.channels.noXp.length > 0) {
                noXpContainer.innerHTML = data.channels.noXp.map(ch => `
                    <span class="channel-tag">${ch}</span>
                `).join('');
            } else {
                noXpContainer.innerHTML = '<p class="empty-text">Ninguno</p>';
            }
        }
        
        if (data.roles) {
            document.getElementById('cfgStaffRole').textContent = data.roles.staff;
            document.getElementById('cfgBoosterRole').textContent = data.roles.booster;
            document.getElementById('cfgVipRole').textContent = data.roles.vip;
            document.getElementById('cfgLevel100Role').textContent = data.roles.level100;
        }
        
        const maintenanceToggle = document.getElementById('maintenanceToggle');
        const maintenanceStatus = document.getElementById('maintenanceStatus');
        maintenanceToggle.checked = data.maintenanceMode || false;
        maintenanceStatus.textContent = data.maintenanceMode ? 'Activado' : 'Desactivado';
        
        maintenanceToggle.addEventListener('change', async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await fetch('/api/admin/maintenance', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ enabled: maintenanceToggle.checked })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    maintenanceStatus.textContent = result.maintenanceMode ? 'Activado' : 'Desactivado';
                }
            } catch (error) {
                console.error('Error toggling maintenance:', error);
            }
        });
    } catch (error) {
        console.error('Error cargando configuracion:', error);
    }
}

function loadPageData(page) {
    switch(page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'xp':
            loadXPData();
            break;
        case 'niveles':
            loadLevelsData();
            break;
        case 'roles':
            loadRolesData();
            break;
        case 'misiones':
            loadMissionsData();
            break;
        case 'powerups':
            loadPowerupsData();
            break;
        case 'estadisticas':
            loadStatisticsData();
            break;
        case 'logs':
            loadLogsData();
            break;
        case 'usuarios':
            initUserManagement();
            break;
        case 'configuracion':
            loadConfigData();
            break;
    }
}

function updateActivityChart() {
    const chartContainer = document.getElementById('activityChartContainer');
    if (!chartContainer) return;
    
    if (dataHistory.timestamps.length === 0) {
        chartContainer.innerHTML = '<p style="color: #999;">Cargando datos...</p>';
        return;
    }
    
    const maxValue = Math.max(...dataHistory.xpData, 100);
    
    const bars = dataHistory.timestamps.map((time, i) => {
        const xpValue = dataHistory.xpData[i];
        const percentage = (xpValue / maxValue) * 100;
        
        return `
            <div class="bar">
                <div class="bar-fill" style="height: ${Math.max(percentage, 10)}%;" title="XP: ${xpValue}"></div>
                <div class="bar-value">${xpValue}</div>
                <div class="bar-label">${time}</div>
            </div>
        `;
    }).join('');
    
    chartContainer.innerHTML = bars;
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Hace poco';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `Hace ${days} dia${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Hace poco';
}

function formatTimeLeft(ms) {
    if (!ms) return 'Permanente';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
}

function updateSessionTime() {
    const expiry = parseInt(localStorage.getItem('tokenExpiry') || 0);
    const remaining = expiry - Date.now();
    
    if (remaining <= 0) {
        window.location.href = '/admin/login.html';
        return;
    }
    
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    
    document.getElementById('sessionTime').textContent = `Sesion: ${hours}h ${minutes}m`;
}

let logsRefreshInterval = null;
let selectedUser = null;

async function loadLogsData() {
    try {
        const typeFilter = document.getElementById('logTypeFilter')?.value || '';
        const url = typeFilter ? `/api/admin/logs?type=${typeFilter}` : '/api/admin/logs';
        const data = await fetchAPI(url);
        
        document.getElementById('logsTotal').textContent = data.stats?.total || 0;
        document.getElementById('logsLastHour').textContent = data.stats?.lastHour || 0;
        document.getElementById('logsLastDay').textContent = data.stats?.lastDay || 0;
        
        const container = document.getElementById('logsContainer');
        if (!data.logs || data.logs.length === 0) {
            container.innerHTML = '<p class="no-logs">No hay logs disponibles. Los logs aparecen cuando hay actividad en el bot.</p>';
            return;
        }
        
        container.innerHTML = data.logs.map(log => `
            <div class="log-entry log-type-${log.type}">
                <div class="log-time">${formatLogTime(log.timestamp)}</div>
                <div class="log-icon">${getLogIcon(log.type)}</div>
                <div class="log-content">
                    <span class="log-user">${log.username}</span>
                    <span class="log-action">${getLogDescription(log)}</span>
                    ${log.amount ? `<span class="log-amount ${log.amount >= 0 ? 'positive' : 'negative'}">${log.amount >= 0 ? '+' : ''}${log.amount.toLocaleString()}</span>` : ''}
                </div>
                <div class="log-server">${log.guildName || 'Servidor'}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando logs:', error);
        document.getElementById('logsContainer').innerHTML = '<p class="error-text">Error al cargar los logs</p>';
    }
}

function formatLogTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getLogIcon(type) {
    const icons = {
        'xp_gain': '⭐', 'xp_loss': '📉', 'level_up': '🎉', 'level_down': '📉',
        'coins_gain': '💰', 'coins_loss': '💸', 'work': '💼', 'casino_win': '🎰',
        'casino_loss': '🎲', 'theft_success': '🦝', 'theft_fail': '🚔', 'theft_victim': '😢',
        'mission_complete': '✅', 'item_gain': '🎁', 'item_use': '🔧', 'daily_reward': '📅',
        'bank_deposit': '🏦', 'bank_withdraw': '💵', 'shop_purchase': '🛒',
        'powerup_activate': '⚡', 'admin_action': '👑', 'minigame_win': '🏆', 'minigame_loss': '❌'
    };
    return icons[type] || '📋';
}

function getLogDescription(log) {
    const descriptions = {
        'xp_gain': 'gano XP', 'xp_loss': 'perdio XP', 'level_up': 'subio de nivel',
        'level_down': 'bajo de nivel', 'coins_gain': 'gano Lagcoins', 'coins_loss': 'perdio Lagcoins',
        'work': 'trabajo', 'casino_win': 'gano en el casino', 'casino_loss': 'perdio en el casino',
        'theft_success': 'robo exitoso', 'theft_fail': 'robo fallido', 'theft_victim': 'fue robado',
        'mission_complete': 'completo mision', 'item_gain': 'obtuvo item', 'item_use': 'uso item',
        'daily_reward': 'reclamo diario', 'bank_deposit': 'deposito', 'bank_withdraw': 'retiro',
        'shop_purchase': 'compro en tienda', 'powerup_activate': 'activo power-up',
        'admin_action': 'accion admin', 'minigame_win': 'gano minijuego', 'minigame_loss': 'perdio minijuego'
    };
    return log.reason || descriptions[log.type] || log.type;
}

function initUserManagement() {
    const searchBtn = document.getElementById('userSearchBtn');
    const searchInput = document.getElementById('userSearchInput');
    
    if (searchBtn) {
        searchBtn.onclick = searchUsers;
    }
    if (searchInput) {
        searchInput.onkeypress = (e) => { if (e.key === 'Enter') searchUsers(); };
    }
}

async function searchUsers() {
    const query = document.getElementById('userSearchInput').value.trim();
    if (!query) return;
    
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<p class="loading-text">Buscando...</p>';
    
    try {
        const data = await fetchAPI(`/api/admin/user/search?query=${encodeURIComponent(query)}`);
        
        if (!data.users || data.users.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">No se encontraron usuarios</p>';
            return;
        }
        
        resultsDiv.innerHTML = data.users.map(user => `
            <div class="search-result-item" onclick="selectUser('${user.guildId}', '${user.userId}')">
                <img src="${user.avatar || '/img/default-avatar.png'}" alt="Avatar" class="result-avatar">
                <div class="result-info">
                    <span class="result-name">${user.displayName || user.username}</span>
                    <span class="result-details">@${user.username} | Nivel ${user.level || 0} | ${user.guildName}</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error buscando usuarios:', error);
        resultsDiv.innerHTML = '<p class="error-text">Error al buscar usuarios</p>';
    }
}

async function selectUser(guildId, oderId) {
    selectedUser = { guildId, oderId };
    
    try {
        const data = await fetchAPI(`/api/admin/user/${guildId}/${oderId}`);
        
        document.getElementById('userDetailsSection').style.display = 'block';
        document.getElementById('userAvatar').src = data.avatar || '/img/default-avatar.png';
        document.getElementById('userDisplayName').textContent = data.displayName || 'Usuario';
        document.getElementById('userUsername').textContent = `@${data.username}`;
        document.getElementById('userGuild').textContent = data.guildName || 'Servidor';
        
        document.getElementById('userTotalXp').textContent = (data.user?.totalXp || 0).toLocaleString();
        document.getElementById('userLevel').textContent = data.user?.level || 0;
        document.getElementById('userLagcoins').textContent = (data.economy?.lagcoins || 0).toLocaleString();
        document.getElementById('userBank').textContent = (data.economy?.bank || 0).toLocaleString();
        
        const rolesDiv = document.getElementById('userRoles');
        if (data.roles && data.roles.length > 0) {
            rolesDiv.innerHTML = data.roles.slice(0, 10).map(r => 
                `<span class="role-badge" style="background: ${r.color}">${r.name}</span>`
            ).join('');
        } else {
            rolesDiv.innerHTML = '<p>Sin roles</p>';
        }
        
        const logsDiv = document.getElementById('userActivityLogs');
        if (data.logs && data.logs.length > 0) {
            logsDiv.innerHTML = data.logs.slice(0, 20).map(log => `
                <div class="user-log-entry">
                    <span class="log-icon">${getLogIcon(log.type)}</span>
                    <span class="log-desc">${getLogDescription(log)}</span>
                    <span class="log-time">${formatLogTime(log.timestamp)}</span>
                </div>
            `).join('');
        } else {
            logsDiv.innerHTML = '<p>Sin actividad registrada</p>';
        }
        
    } catch (error) {
        console.error('Error cargando usuario:', error);
    }
}

async function modifyUser(field, action) {
    if (!selectedUser) return;
    
    let value = 0;
    if (action !== 'reset') {
        const input = prompt(`Ingresa el valor para ${action} ${field}:`);
        if (input === null) return;
        value = parseInt(input);
        if (isNaN(value) || value < 0) {
            alert('Valor invalido');
            return;
        }
    }
    
    const reason = prompt('Motivo del cambio (opcional):') || '';
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/user/${selectedUser.guildId}/${selectedUser.oderId}/modify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, field, value, reason })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`${field} modificado: ${result.oldValue} -> ${result.newValue}`);
            selectUser(selectedUser.guildId, selectedUser.oderId);
        } else {
            alert('Error: ' + (result.message || 'No se pudo modificar'));
        }
        
    } catch (error) {
        console.error('Error modificando usuario:', error);
        alert('Error al modificar usuario');
    }
}

document.getElementById('logTypeFilter')?.addEventListener('change', loadLogsData);
document.getElementById('refreshLogs')?.addEventListener('click', loadLogsData);

document.getElementById('autoRefreshLogs')?.addEventListener('change', (e) => {
    if (e.target.checked) {
        logsRefreshInterval = setInterval(loadLogsData, 5000);
    } else {
        clearInterval(logsRefreshInterval);
    }
});

window.addEventListener('load', () => {
    if (!checkAuthentication()) return;
    
    loadDashboardData();
    setInterval(loadDashboardData, 30000);
    
    updateSessionTime();
    setInterval(updateSessionTime, 60000);
    
    logsRefreshInterval = setInterval(() => {
        if (document.getElementById('logs-page')?.classList.contains('active') && 
            document.getElementById('autoRefreshLogs')?.checked) {
            loadLogsData();
        }
    }, 5000);
});
