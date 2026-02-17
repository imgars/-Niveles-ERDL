function checkAuthentication() {
    const token = localStorage.getItem('adminToken');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry || Date.now() >= parseInt(expiry)) {
        window.location.href = '/admin/login.html';
        return false;
    }
    return true;
}

function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('adminUsername');
    window.location.href = '/admin/login.html';
}

document.getElementById('headerLogoutBtn')?.addEventListener('click', handleLogout);

const adminInfoBtn = document.getElementById('adminInfoBtn');
const adminDropdownWrapper = document.querySelector('.admin-dropdown-wrapper');

if (adminInfoBtn && adminDropdownWrapper) {
    adminInfoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        adminDropdownWrapper.classList.toggle('open');
        
        const customizeDropdown = document.getElementById('customizeDropdown');
        if (customizeDropdown) customizeDropdown.classList.remove('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!adminDropdownWrapper.contains(e.target)) {
            adminDropdownWrapper.classList.remove('open');
        }
    });
}

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
            configuracion: 'Configuracion',
            personalizacion: 'Personalizar Panel'
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
            localStorage.removeItem('adminToken');
            localStorage.removeItem('tokenExpiry');
            localStorage.removeItem('adminUsername');
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
                <div class="top-item-card">
                    <div class="top-rank-badge">${i + 1}</div>
                    <img class="top-avatar" src="${user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="Avatar">
                    <div class="top-user-info">
                        <span class="top-username">${user.displayName}</span>
                        <span class="top-stats">${user.xp.toLocaleString()} XP · Nivel ${user.level}</span>
                    </div>
                    <button class="top-edit-btn" onclick="editTopUser('${user.guildId}', '${user.id}', '${user.displayName.replace(/'/g, "\\'")}')">Editar</button>
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
                <div class="top-item-card">
                    <div class="top-rank-badge">${i + 1}</div>
                    <img class="top-avatar" src="${user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="Avatar">
                    <div class="top-user-info">
                        <span class="top-username">${user.displayName}</span>
                        <span class="top-stats">Nivel ${user.level} · ${user.xp.toLocaleString()} XP</span>
                    </div>
                    <button class="top-edit-btn" onclick="editTopUser('${user.guildId}', '${user.id}', '${user.displayName.replace(/'/g, "\\'")}')">Editar</button>
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

let pendingConfigChange = null;

async function loadConfigData() {
    try {
        const data = await fetchAPI('/api/admin/config');
        
        if (data.xpSystem) {
            document.getElementById('cfgCooldown').value = data.xpSystem.cooldown / 1000;
            document.getElementById('cfgXpMin').value = data.xpSystem.baseMin;
            document.getElementById('cfgXpMax').value = data.xpSystem.baseMax;
            document.getElementById('cfgBoosterMult').value = data.xpSystem.boosterMultiplier;
            document.getElementById('cfgNightMult').value = data.xpSystem.nightMultiplier;
        }
        
        if (data.channels) {
            document.getElementById('cfgLevelUpChannel').value = data.channels.levelUp || '';
            document.getElementById('cfgMissionChannel').value = data.channels.missionComplete || '';
            
            renderNoXpChannels(data.channels.noXp || []);
        }
        
        if (data.roles) {
            document.getElementById('cfgStaffRole').value = data.roles.staff || '';
            document.getElementById('cfgBoosterRole').value = data.roles.booster || '';
            document.getElementById('cfgVipRole').value = data.roles.vip || '';
            document.getElementById('cfgLevel100Role').value = data.roles.level100 || '';
        }
        
        const maintenanceToggle = document.getElementById('maintenanceToggle');
        const maintenanceStatus = document.getElementById('maintenanceStatus');
        maintenanceToggle.checked = data.maintenanceMode || false;
        maintenanceStatus.textContent = data.maintenanceMode ? 'Activado' : 'Desactivado';
        
        setupConfigListeners();
        
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

let currentLogsPage = 1;

async function loadLogsData(page) {
    try {
        if (page) currentLogsPage = page;
        const typeFilter = document.getElementById('logTypeFilter')?.value || '';
        const systemFilter = document.getElementById('logSystemFilter')?.value || '';
        const importanceFilter = document.getElementById('logImportanceFilter')?.value || '';
        const periodFilter = document.getElementById('logPeriodFilter')?.value || 'all';
        
        let url = `/api/admin/logs?page=${currentLogsPage}&limit=100&period=${periodFilter}`;
        if (typeFilter) url += `&type=${typeFilter}`;
        if (systemFilter) url += `&system=${systemFilter}`;
        if (importanceFilter) url += `&importance=${importanceFilter}`;
        
        const data = await fetchAPI(url);
        
        document.getElementById('logsTotal').textContent = data.stats?.total || 0;
        document.getElementById('logsLastHour').textContent = data.stats?.lastHour || 0;
        document.getElementById('logsLastDay').textContent = data.stats?.lastDay || 0;
        
        if (data.alerts && data.alerts.length > 0) {
            const alertsContainer = document.getElementById('alertsContainer');
            const alertsList = document.getElementById('alertsList');
            alertsContainer.style.display = 'block';
            alertsList.innerHTML = data.alerts.slice(0, 5).map(alert => `
                <div class="alert-item" style="background: #3a1515; border: 1px solid #ff4444; border-radius: 6px; padding: 8px 12px; margin-bottom: 6px; font-size: 0.85rem;">
                    <span style="color: #ff6b6b; font-weight: bold;">${alert.type === 'theft_abuse' ? '🦝 Abuso de Robos' : alert.type === 'casino_streak' ? '🎰 Racha Casino' : '👑 Uso Admin'}</span>
                    <span style="color: #ccc; margin-left: 8px;">${alert.username} - ${alert.message}</span>
                    <span style="color: #888; float: right; font-size: 0.75rem;">${formatLogTime(alert.timestamp)}</span>
                </div>
            `).join('');
        } else {
            const alertsContainer = document.getElementById('alertsContainer');
            if (alertsContainer) alertsContainer.style.display = 'none';
        }
        
        const container = document.getElementById('logsContainer');
        if (!data.logs || data.logs.length === 0) {
            container.innerHTML = '<p class="no-logs">No hay logs disponibles con estos filtros.</p>';
            document.getElementById('logsPagination').style.display = 'none';
            return;
        }
        
        container.innerHTML = data.logs.map(log => `
            <div class="log-entry log-type-${log.type} log-importance-${log.importance || 'low'}">
                <div class="log-time">${formatLogTime(log.timestamp)}</div>
                <div class="log-icon">${getLogIcon(log.type)}</div>
                <div class="log-content">
                    <span class="log-user">${log.username || 'Sistema'}</span>
                    <span class="log-action">${getLogDescription(log)}</span>
                    ${log.command ? `<span class="log-command" style="background: #40444b; padding: 1px 6px; border-radius: 3px; font-size: 0.8rem; color: #7289da;">/${log.command}</span>` : ''}
                    ${log.amount ? `<span class="log-amount ${log.amount >= 0 ? 'positive' : 'negative'}">${log.amount >= 0 ? '+' : ''}${log.amount.toLocaleString()}</span>` : ''}
                    ${log.balanceAfter !== undefined && log.balanceAfter !== null ? `<span style="color: #888; font-size: 0.8rem; margin-left: 4px;">(Saldo: ${log.balanceAfter.toLocaleString()})</span>` : ''}
                </div>
                <div class="log-meta">
                    ${log.system ? `<span class="log-system" style="background: #2d3436; padding: 1px 5px; border-radius: 3px; font-size: 0.7rem; color: #a0a0a0;">${log.system}</span>` : ''}
                    ${log.importance === 'high' || log.importance === 'critical' ? `<span style="color: ${log.importance === 'critical' ? '#ff4444' : '#ffaa00'}; font-size: 0.75rem;">●</span>` : ''}
                </div>
            </div>
        `).join('');
        
        const pagination = data.pagination;
        const paginationDiv = document.getElementById('logsPagination');
        if (pagination && pagination.totalPages > 1) {
            paginationDiv.style.display = 'flex';
            document.getElementById('logsPageInfo').textContent = `Pagina ${pagination.page} de ${pagination.totalPages} (${pagination.total} logs)`;
            document.getElementById('logsPrevPage').disabled = pagination.page <= 1;
            document.getElementById('logsNextPage').disabled = pagination.page >= pagination.totalPages;
        } else {
            paginationDiv.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error cargando logs:', error);
        document.getElementById('logsContainer').innerHTML = '<p class="error-text">Error al cargar los logs</p>';
    }
}

async function exportLogsCSV() {
    try {
        const typeFilter = document.getElementById('logTypeFilter')?.value || '';
        const systemFilter = document.getElementById('logSystemFilter')?.value || '';
        const periodFilter = document.getElementById('logPeriodFilter')?.value || 'all';
        
        let url = `/api/admin/logs/export?format=csv&period=${periodFilter}`;
        if (typeFilter) url += `&type=${typeFilter}`;
        if (systemFilter) url += `&system=${systemFilter}`;
        
        const token = localStorage.getItem('adminToken');
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (!response.ok) throw new Error('Error exportando');
        
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `logs_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Error exportando CSV:', error);
        alert('Error al exportar logs');
    }
}

function formatLogTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getLogIcon(type) {
    const icons = {
        'command_use': '⌨️', 'xp_gain': '⭐', 'xp_loss': '📉', 'level_up': '🎉', 'level_down': '📉',
        'coins_gain': '💰', 'coins_loss': '💸', 'work': '💼', 'casino_win': '🎰',
        'casino_loss': '🎲', 'theft_success': '🦝', 'theft_fail': '🚔', 'theft_victim': '😢',
        'mission_complete': '✅', 'item_gain': '🎁', 'item_use': '🔧', 'daily_reward': '📅',
        'bank_deposit': '🏦', 'bank_withdraw': '💵', 'shop_purchase': '🛒',
        'powerup_activate': '⚡', 'admin_action': '👑', 'minigame_win': '🏆', 'minigame_loss': '❌',
        'gift_sent': '🎁', 'gift_received': '📨', 'insurance_buy': '🛡️', 'insurance_expire': '⏰',
        'marriage': '💍', 'divorce': '💔', 'nationality_change': '🌍', 'travel': '✈️',
        'bank_heist': '🏴‍☠️', 'trade': '🤝', 'auction_create': '📢', 'auction_bid': '💎',
        'streak_gain': '🔥', 'tax_paid': '📊', 'gamecard_generate': '🃏', 'rankcard_unlock': '🎨'
    };
    return icons[type] || '📋';
}

function getLogDescription(log) {
    const descriptions = {
        'command_use': `uso /${log.command || '?'}`,
        'xp_gain': 'gano XP', 'xp_loss': 'perdio XP', 'level_up': 'subio de nivel',
        'level_down': 'bajo de nivel', 'coins_gain': 'gano Lagcoins', 'coins_loss': 'perdio Lagcoins',
        'work': 'trabajo', 'casino_win': 'gano en casino', 'casino_loss': 'perdio en casino',
        'theft_success': 'robo exitoso', 'theft_fail': 'robo fallido', 'theft_victim': 'fue robado',
        'mission_complete': 'completo mision', 'item_gain': 'obtuvo item', 'item_use': 'uso item',
        'daily_reward': 'reclamo diario', 'bank_deposit': 'deposito al banco', 'bank_withdraw': 'retiro del banco',
        'shop_purchase': 'compro en tienda', 'powerup_activate': 'activo power-up',
        'admin_action': 'accion admin', 'minigame_win': 'gano minijuego', 'minigame_loss': 'perdio minijuego',
        'gift_sent': 'envio regalo', 'gift_received': 'recibio regalo',
        'insurance_buy': 'compro seguro', 'insurance_expire': 'seguro expirado',
        'marriage': 'matrimonio', 'divorce': 'divorcio',
        'nationality_change': 'cambio nacionalidad', 'travel': 'viajo',
        'bank_heist': 'atraco al banco', 'trade': 'intercambio',
        'auction_create': 'creo subasta', 'auction_bid': 'oferto en subasta',
        'streak_gain': 'racha', 'tax_paid': 'pago impuestos',
        'gamecard_generate': 'genero carta', 'rankcard_unlock': 'desbloqueo tema'
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

function editTopUser(guildId, userId, displayName) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector('.nav-link[data-page="usuarios"]')?.classList.add('active');
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('usuarios-page')?.classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'Gestion Usuarios';
    
    selectUser(guildId, userId);
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

document.getElementById('logTypeFilter')?.addEventListener('change', () => loadLogsData(1));
document.getElementById('logSystemFilter')?.addEventListener('change', () => loadLogsData(1));
document.getElementById('logImportanceFilter')?.addEventListener('change', () => loadLogsData(1));
document.getElementById('logPeriodFilter')?.addEventListener('change', () => loadLogsData(1));
document.getElementById('refreshLogs')?.addEventListener('click', () => loadLogsData());
document.getElementById('logsPrevPage')?.addEventListener('click', () => { if (currentLogsPage > 1) loadLogsData(currentLogsPage - 1); });
document.getElementById('logsNextPage')?.addEventListener('click', () => loadLogsData(currentLogsPage + 1));
document.getElementById('exportLogsCSV')?.addEventListener('click', exportLogsCSV);

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
    
    initCustomization();
});

// ===== CUSTOMIZATION SYSTEM =====
const themeGradients = {
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ocean: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    dark: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    fire: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)'
};

function initCustomization() {
    const savedTheme = localStorage.getItem('adminTheme') || 'default';
    const savedFont = localStorage.getItem('adminFont') || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    const savedBg = localStorage.getItem('adminBackground') || 'light';
    
    applyTheme(savedTheme);
    applyFont(savedFont);
    applyBackground(savedBg);
    
    setupQuickCustomize();
    
    document.querySelectorAll('.theme-option').forEach(option => {
        const theme = option.dataset.theme;
        if (theme === savedTheme) {
            option.classList.add('active');
        }
        
        option.addEventListener('click', () => {
            document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            applyTheme(theme);
            localStorage.setItem('adminTheme', theme);
            updateMiniThemes(theme);
            updatePreview();
        });
    });
    
    document.querySelectorAll('.bg-option').forEach(option => {
        const bg = option.dataset.bg;
        if (bg === savedBg) {
            option.classList.add('active');
        }
        
        option.addEventListener('click', () => {
            document.querySelectorAll('.bg-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            applyBackground(bg);
            localStorage.setItem('adminBackground', bg);
            updateMiniBgs(bg);
            updatePreview();
        });
    });
    
    document.querySelectorAll('.font-option').forEach(option => {
        const font = option.dataset.font;
        if (font === savedFont) {
            option.classList.add('active');
        }
        
        option.addEventListener('click', () => {
            document.querySelectorAll('.font-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            applyFont(font);
            localStorage.setItem('adminFont', font);
            updatePreview();
        });
    });
    
    document.getElementById('resetCustomization')?.addEventListener('click', () => {
        localStorage.removeItem('adminTheme');
        localStorage.removeItem('adminFont');
        localStorage.removeItem('adminBackground');
        applyTheme('default');
        applyFont("'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");
        applyBackground('light');
        
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
        document.querySelectorAll('.font-option').forEach(o => o.classList.remove('active'));
        document.querySelectorAll('.bg-option').forEach(o => o.classList.remove('active'));
        document.querySelector('.theme-option[data-theme="default"]')?.classList.add('active');
        document.querySelector('.font-option[data-font="\'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif"]')?.classList.add('active');
        document.querySelector('.bg-option[data-bg="light"]')?.classList.add('active');
        updateMiniThemes('default');
        updateMiniBgs('light');
        updatePreview();
    });
    
    updateMiniThemes(savedTheme);
    updateMiniBgs(savedBg);
    updatePreview();
}

function setupQuickCustomize() {
    const btn = document.getElementById('quickCustomizeBtn');
    const dropdown = document.getElementById('customizeDropdown');
    
    btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.quick-customize')) {
            dropdown?.classList.remove('active');
        }
    });
    
    dropdown?.querySelectorAll('.mini-theme').forEach(theme => {
        theme.addEventListener('click', () => {
            const themeName = theme.dataset.theme;
            applyTheme(themeName);
            localStorage.setItem('adminTheme', themeName);
            updateMiniThemes(themeName);
            
            document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
            document.querySelector(`.theme-option[data-theme="${themeName}"]`)?.classList.add('active');
            updatePreview();
        });
    });
    
    dropdown?.querySelectorAll('.mini-bg').forEach(bg => {
        bg.addEventListener('click', () => {
            const bgName = bg.dataset.bg;
            applyBackground(bgName);
            localStorage.setItem('adminBackground', bgName);
            updateMiniBgs(bgName);
            
            document.querySelectorAll('.bg-option').forEach(o => o.classList.remove('active'));
            document.querySelector(`.bg-option[data-bg="${bgName}"]`)?.classList.add('active');
            updatePreview();
        });
    });
}

function updateMiniThemes(activeTheme) {
    document.querySelectorAll('.mini-theme').forEach(t => {
        t.classList.toggle('active', t.dataset.theme === activeTheme);
    });
}

function updateMiniBgs(activeBg) {
    document.querySelectorAll('.mini-bg').forEach(b => {
        b.classList.toggle('active', b.dataset.bg === activeBg);
    });
}

function applyTheme(theme) {
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }
}

function applyBackground(bg) {
    document.body.className = document.body.className.replace(/bg-\w+/g, '');
    document.body.classList.add(`bg-${bg}`);
}

function applyFont(font) {
    document.body.style.fontFamily = font;
}

function updatePreview() {
    const previewSidebar = document.querySelector('.preview-sidebar');
    const previewContent = document.querySelector('.preview-content');
    const currentTheme = localStorage.getItem('adminTheme') || 'default';
    
    if (previewSidebar) {
        previewSidebar.style.background = themeGradients[currentTheme] || themeGradients.default;
    }
    
    if (previewContent && currentTheme === 'dark') {
        previewContent.style.background = '#1a1a1a';
        previewContent.querySelector('p').style.color = '#ccc';
    } else if (previewContent) {
        previewContent.style.background = '#f5f7fa';
        previewContent.querySelector('p').style.color = '#666';
    }
}

// ===== CONFIG EDITING SYSTEM =====
const fieldLabels = {
    cooldown: 'Cooldown (segundos)',
    baseMin: 'XP Minimo',
    baseMax: 'XP Maximo',
    boosterMultiplier: 'Multiplicador Booster',
    nightMultiplier: 'Multiplicador Nocturno',
    levelUp: 'Canal Level Up',
    missionComplete: 'Canal Misiones',
    staff: 'Rol Staff',
    booster: 'Rol Booster',
    vip: 'Rol VIP',
    level100: 'Rol Nivel 100'
};

function setupConfigListeners() {
    document.querySelectorAll('.config-save-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const configItem = e.target.closest('.config-item');
            const field = configItem.dataset.field;
            const category = configItem.dataset.category;
            const input = configItem.querySelector('.config-input');
            const newValue = input.value;
            
            showConfigConfirmation(category, field, newValue);
        });
    });
    
    document.getElementById('addNoXpChannel')?.addEventListener('click', () => {
        const input = document.getElementById('newNoXpChannel');
        const channelId = input.value.trim();
        if (channelId) {
            showConfigConfirmation('channels', 'addNoXp', channelId);
        }
    });
    
    document.getElementById('confirmCancel')?.addEventListener('click', hideConfirmModal);
    document.getElementById('confirmAccept')?.addEventListener('click', executeConfigChange);
}

function showConfigConfirmation(category, field, value) {
    pendingConfigChange = { category, field, value };
    
    const modal = document.getElementById('confirmModal');
    const details = document.getElementById('confirmDetails');
    const message = document.getElementById('confirmMessage');
    
    const label = fieldLabels[field] || field;
    
    if (field === 'addNoXp') {
        message.textContent = '¿Deseas agregar este canal a la lista de canales sin XP?';
        details.innerHTML = `<strong>Canal ID:</strong> ${value}`;
    } else if (field === 'removeNoXp') {
        message.textContent = '¿Deseas eliminar este canal de la lista de canales sin XP?';
        details.innerHTML = `<strong>Canal ID:</strong> ${value}`;
    } else {
        message.textContent = '¿Estas seguro de que deseas cambiar esta configuracion?';
        details.innerHTML = `<strong>${label}:</strong> ${value}`;
    }
    
    modal.style.display = 'flex';
}

function hideConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'none';
    pendingConfigChange = null;
}

async function executeConfigChange() {
    if (!pendingConfigChange) return;
    
    const { category, field, value } = pendingConfigChange;
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/config', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ category, field, value })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            hideConfirmModal();
            
            if (field === 'addNoXp') {
                document.getElementById('newNoXpChannel').value = '';
                loadConfigData();
            } else if (field === 'removeNoXp') {
                loadConfigData();
            }
            
            showNotification('Configuracion actualizada correctamente', 'success');
        } else {
            showNotification(data.message || 'Error al actualizar', 'error');
        }
    } catch (error) {
        console.error('Error updating config:', error);
        showNotification('Error de conexion', 'error');
    }
    
    hideConfirmModal();
}

function renderNoXpChannels(channels) {
    const container = document.getElementById('cfgNoXpChannels');
    if (channels && channels.length > 0) {
        container.innerHTML = channels.map(ch => `
            <span class="channel-tag">
                ${ch}
                <button class="remove-channel" onclick="removeNoXpChannel('${ch}')">×</button>
            </span>
        `).join('');
    } else {
        container.innerHTML = '<p class="empty-text">Ninguno</p>';
    }
}

function removeNoXpChannel(channelId) {
    showConfigConfirmation('channels', 'removeNoXp', channelId);
}

function showNotification(message, type) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${type === 'success' ? '✓' : '✕'} ${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
