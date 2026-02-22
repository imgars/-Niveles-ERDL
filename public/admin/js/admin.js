// ===== AUTH =====
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
        document.getElementById('customizeDropdown')?.classList.remove('active');
    });
    document.addEventListener('click', (e) => {
        if (!adminDropdownWrapper.contains(e.target)) adminDropdownWrapper.classList.remove('open');
    });
}

const adminNameEl = document.getElementById('adminName');
if (adminNameEl) {
    const username = localStorage.getItem('adminUsername');
    adminNameEl.textContent = username ? `👤 ${username}` : '';
}

// ===== SIDEBAR TOGGLE (MOBILE) =====
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
});

// ===== NAV ROUTING =====
const PAGE_TITLES = {
    dashboard: 'Dashboard Principal',
    graficas: 'Graficas de Actividad',
    alertas: 'Alertas del Sistema',
    xp: 'Sistema de XP',
    niveles: 'Sistema de Niveles',
    roles: 'Roles por Nivel',
    misiones: 'Misiones',
    'misiones-live': 'Misiones en Tiempo Real',
    powerups: 'Power-ups y Boosts',
    'sistemas-avanzados': 'Control Avanzado de Sistemas',
    estadisticas: 'Estadisticas',
    'audit-log': 'Audit Log',
    logs: 'Logs en Tiempo Real',
    usuarios: 'Gestion de Usuarios',
    configuracion: 'Configuracion',
    personalizacion: 'Personalizar Panel'
};

function showPage(page) {
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.page === page);
    });
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`)?.classList.add('active');
    document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || 'Panel Admin';
    document.getElementById('sidebar')?.classList.remove('open');
    loadPageData(page);
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(link.dataset.page);
    });
});

// ===== API =====
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('tokenExpiry');
            localStorage.removeItem('adminUsername');
            window.location.href = '/admin/login.html';
        }
        throw new Error(`API Error ${response.status}`);
    }
    return response.json();
}

async function postAPI(endpoint, body) {
    return fetchAPI(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

async function deleteAPI(endpoint) {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`API Error ${response.status}`);
    return response.json();
}

// ===== CHARTS =====
const charts = {};

function destroyChart(id) {
    if (charts[id]) {
        charts[id].destroy();
        delete charts[id];
    }
}

function createLineChart(canvasId, labels, datasets, options = {}) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#ccc' } } },
            scales: {
                x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
            },
            ...options
        }
    });
}

function createBarChart(canvasId, labels, data, label, color = 'rgba(102,126,234,0.8)') {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{ label, data, backgroundColor: color, borderRadius: 4 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#ccc' } } },
            scales: {
                x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
            },
            indexAxis: canvasId === 'chartCommands' ? 'y' : 'x'
        }
    });
}

let currentChartDays = 7;

async function loadGraficasData(days) {
    if (days) currentChartDays = days;
    try {
        const [timeData, commandData, levelData] = await Promise.all([
            fetchAPI(`/api/admin/analytics/timeseries?days=${currentChartDays}`),
            fetchAPI('/api/admin/analytics/commands'),
            fetchAPI('/api/admin/levels')
        ]);

        const labels = (timeData.series || []).map(d => d.label);
        const xpValues = (timeData.series || []).map(d => d.xp);
        const levelValues = (timeData.series || []).map(d => d.levels);

        createLineChart('chartXpTimeline', labels, [{
            label: 'XP por Dia',
            data: xpValues,
            borderColor: 'rgba(102,126,234,1)',
            backgroundColor: 'rgba(102,126,234,0.15)',
            fill: true,
            tension: 0.4
        }]);

        createLineChart('chartLevelsTimeline', labels, [{
            label: 'Niveles Subidos',
            data: levelValues,
            borderColor: 'rgba(67,181,129,1)',
            backgroundColor: 'rgba(67,181,129,0.15)',
            fill: true,
            tension: 0.4
        }]);

        const distEntries = Object.entries(levelData.levelDistribution || {}).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
        createBarChart('chartLevelDist',
            distEntries.map(e => e[0]),
            distEntries.map(e => e[1]),
            'Usuarios por Nivel',
            'rgba(240,147,251,0.8)'
        );

        const topCmds = (commandData.commands || []).slice(0, 10);
        createBarChart('chartCommands',
            topCmds.map(c => c.name),
            topCmds.map(c => c.count),
            'Usos',
            'rgba(245,87,108,0.8)'
        );
    } catch (error) {
        console.error('Error cargando graficas:', error);
    }
}

document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadGraficasData(parseInt(btn.dataset.days));
    });
});

// ===== ALERTS =====
async function loadAlertsData() {
    try {
        const data = await fetchAPI('/api/admin/alerts');
        const alerts = data.alerts || [];
        const unread = data.unreadCount || 0;

        const badge1 = document.getElementById('navAlertBadge');
        const badge2 = document.getElementById('alertBellBadge');
        if (badge1) { badge1.textContent = unread; badge1.style.display = unread > 0 ? 'inline' : 'none'; }
        if (badge2) { badge2.textContent = unread; badge2.style.display = unread > 0 ? 'inline' : 'none'; }

        const list = document.getElementById('alertsList');
        if (!list) return;

        if (alerts.length === 0) {
            list.innerHTML = '<p class="empty-text">No hay alertas activas</p>';
            return;
        }

        list.innerHTML = alerts.map(a => `
            <div class="alert-item-card severity-${a.severity}" data-id="${a.id}">
                <div class="alert-item-header">
                    <span class="alert-severity-badge ${a.severity}">${a.severity.toUpperCase()}</span>
                    <span class="alert-type">${a.type}</span>
                    <span class="alert-time">${formatDate(a.timestamp)}</span>
                    <button class="dismiss-alert-btn" onclick="dismissAlert('${a.id}')">Descartar</button>
                </div>
                <p class="alert-message">${a.message}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando alertas:', error);
    }
}

async function dismissAlert(id) {
    try {
        await postAPI(`/api/admin/alerts/${id}/dismiss`, {});
        loadAlertsData();
    } catch (error) {
        console.error('Error descartando alerta:', error);
    }
}

// ===== DASHBOARD =====
const dataHistory = { timestamps: [], xpData: [], levelsData: [], maxPoints: 12 };

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
            dataHistory.timestamps.shift(); dataHistory.xpData.shift(); dataHistory.levelsData.shift();
        }
        updateActivityChart();
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        document.getElementById('botStatus').textContent = 'Error';
    }
}

function updateActivityChart() {
    const container = document.getElementById('activityChartContainer');
    if (!container) return;
    if (dataHistory.timestamps.length === 0) { container.innerHTML = '<p style="color:#999">Cargando...</p>'; return; }
    const maxValue = Math.max(...dataHistory.xpData, 100);
    container.innerHTML = dataHistory.timestamps.map((time, i) => {
        const val = dataHistory.xpData[i];
        return `<div class="bar"><div class="bar-fill" style="height:${Math.max((val / maxValue) * 100, 5)}%" title="XP: ${val}"></div><div class="bar-value">${val}</div><div class="bar-label">${time}</div></div>`;
    }).join('');
}

// ===== XP =====
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
        if (data.topUsers?.length > 0) {
            topContainer.innerHTML = data.topUsers.map((user, i) => `
                <div class="top-item-card">
                    <div class="top-rank-badge">${i + 1}</div>
                    <img class="top-avatar" src="${user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="">
                    <div class="top-user-info">
                        <span class="top-username">${escHtml(user.displayName)}</span>
                        <span class="top-stats">${user.xp.toLocaleString()} XP · Nivel ${user.level}</span>
                    </div>
                    <button class="top-edit-btn" onclick="editTopUser('${user.guildId}','${user.id}','${escHtml(user.displayName)}')">Editar</button>
                </div>`).join('');
        } else { topContainer.innerHTML = '<p class="empty-text">No hay datos</p>'; }
    } catch (error) { console.error('Error XP:', error); document.getElementById('topXpUsers').innerHTML = '<p class="error-text">Error</p>'; }
}

// ===== LEVELS =====
async function loadLevelsData() {
    try {
        const data = await fetchAPI('/api/admin/levels');
        document.getElementById('maxLevel').textContent = data.maxLevel || 0;
        document.getElementById('avgLevel').textContent = data.avgLevel || 0;
        document.getElementById('level100Count').textContent = data.usersWithLevel100 || 0;

        const distContainer = document.getElementById('levelDistribution');
        if (data.levelDistribution) {
            const entries = Object.entries(data.levelDistribution).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
            const max = Math.max(...entries.map(e => e[1]), 1);
            distContainer.innerHTML = `<div class="bar-chart">${entries.map(([range, count]) => `
                <div class="chart-bar-item">
                    <div class="bar-container"><div class="bar-fill-h" style="width:${(count/max)*100}%"></div></div>
                    <span class="bar-label">${range}</span><span class="bar-count">${count}</span>
                </div>`).join('')}</div>`;
        }
        const topContainer = document.getElementById('topLevelUsers');
        if (data.topLevels?.length > 0) {
            topContainer.innerHTML = data.topLevels.map((user, i) => `
                <div class="top-item-card">
                    <div class="top-rank-badge">${i + 1}</div>
                    <img class="top-avatar" src="${user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="">
                    <div class="top-user-info">
                        <span class="top-username">${escHtml(user.displayName)}</span>
                        <span class="top-stats">Nivel ${user.level} · ${user.xp.toLocaleString()} XP</span>
                    </div>
                    <button class="top-edit-btn" onclick="editTopUser('${user.guildId}','${user.id}','${escHtml(user.displayName)}')">Editar</button>
                </div>`).join('');
        }
    } catch (error) { console.error('Error niveles:', error); }
}

// ===== ROLES =====
async function loadRolesData() {
    try {
        const data = await fetchAPI('/api/admin/roles');
        const rolesGrid = document.getElementById('levelRolesGrid');
        if (data.levelRoles?.length > 0) {
            rolesGrid.innerHTML = data.levelRoles.map(r => `
                <div class="role-card"><div class="role-level">Nivel ${r.level}</div><div class="role-name">${escHtml(r.roleName)}</div><div class="role-members">${r.memberCount} miembros</div></div>`).join('');
        }
        const specialGrid = document.getElementById('specialRolesGrid');
        if (data.specialRoles) {
            specialGrid.innerHTML = Object.entries(data.specialRoles).map(([k, r]) => `
                <div class="special-role-card"><div class="special-role-name">${escHtml(r.name)}</div><div class="special-role-id">ID: ${r.id}</div></div>`).join('');
        }
    } catch (error) { console.error('Error roles:', error); document.getElementById('levelRolesGrid').innerHTML = '<p class="error-text">Error</p>'; }
}

// ===== MISSIONS =====
async function loadMissionsData() {
    try {
        const data = await fetchAPI('/api/admin/missions');
        document.getElementById('weekNumber').textContent = data.weekNumber || 0;
        document.getElementById('missionYear').textContent = data.year || new Date().getFullYear();
        document.getElementById('totalMissions').textContent = data.totalMissions || 0;
        document.getElementById('completedMissions').textContent = data.completedMissions || 0;
        document.getElementById('completionRate').textContent = `${data.completionRate || 0}%`;
        document.getElementById('missionChannel').textContent = data.missionChannel || '-';
    } catch (error) { console.error('Error misiones:', error); }
}

// ===== MISSIONS LIVE =====
let missionsLiveInterval = null;

async function loadMissionsLive() {
    try {
        const data = await fetchAPI('/api/admin/missions/realtime');
        document.getElementById('liveActiveMissions').textContent = data.activeMissions?.length || 0;
        document.getElementById('liveCompletedToday').textContent = data.completedToday || 0;

        const list = document.getElementById('liveMissionsList');
        if (!data.activeMissions?.length) {
            list.innerHTML = '<p class="empty-text">No hay misiones en progreso en este momento</p>';
            return;
        }
        list.innerHTML = data.activeMissions.map(u => `
            <div class="live-mission-card">
                <div class="live-mission-user">${escHtml(u.username)} <span class="user-id-tag">${u.userId}</span></div>
                ${u.missions.map(m => `
                    <div class="mission-progress-item">
                        <span class="mission-name">${escHtml(m.name)}</span>
                        <div class="mission-progress-bar">
                            <div class="mission-progress-fill" style="width:${Math.min(m.percent,100)}%"></div>
                        </div>
                        <span class="mission-percent">${m.progress}/${m.target} (${m.percent}%)</span>
                    </div>`).join('')}
            </div>`).join('');
    } catch (error) { console.error('Error missions live:', error); }
}

function startMissionsLivePolling() {
    if (missionsLiveInterval) clearInterval(missionsLiveInterval);
    loadMissionsLive();
    missionsLiveInterval = setInterval(loadMissionsLive, 30000);
}

function stopMissionsLivePolling() {
    if (missionsLiveInterval) { clearInterval(missionsLiveInterval); missionsLiveInterval = null; }
}

// ===== POWERUPS =====
async function loadPowerupsData() {
    try {
        const [puData, allBoosts] = await Promise.all([
            fetchAPI('/api/admin/powerups'),
            fetchAPI('/api/admin/boosts/all')
        ]);

        document.getElementById('globalBoostsCount').textContent = puData.globalBoosts?.length || 0;
        document.getElementById('userBoostsCount').textContent = puData.userBoostCount || 0;
        document.getElementById('channelBoostsCount').textContent = puData.channelBoostCount || 0;
        document.getElementById('totalBoostsActive').textContent = puData.totalActive || 0;
        document.getElementById('boosterVipMult').textContent = `${puData.boosterVipMultiplier || 2.0}x`;
        document.getElementById('nightBoostMult').textContent = `+${puData.nightBoostMultiplier || 0.25}x`;

        const boostsList = document.getElementById('allBoostsList');
        const boosts = allBoosts.boosts || [];
        if (boosts.length > 0) {
            boostsList.innerHTML = boosts.map(b => `
                <div class="boost-item-full">
                    <div class="boost-item-info">
                        <span class="boost-category-badge ${b.category}">${b.category}</span>
                        <span class="boost-mult-value">${b.multiplier}x</span>
                        ${b.target && b.target !== 'global' ? `<span class="boost-target">ID: ${b.target}</span>` : ''}
                        <span class="boost-desc">${escHtml(b.description || '')}</span>
                        <span class="boost-expires">${b.expiresAt ? `Expira: ${new Date(b.expiresAt).toLocaleString('es-ES')}` : 'Permanente'}</span>
                    </div>
                    <button class="btn-danger btn-sm" onclick="deleteBoost('${b.id}')">Eliminar</button>
                </div>`).join('');
        } else {
            boostsList.innerHTML = '<p class="empty-text">No hay boosts activos</p>';
        }
    } catch (error) { console.error('Error powerups:', error); }
}

document.getElementById('newBoostType')?.addEventListener('change', function() {
    const targetRow = document.getElementById('boostTargetRow');
    if (targetRow) targetRow.style.display = this.value !== 'global' ? 'flex' : 'none';
});

async function createBoost() {
    const type = document.getElementById('newBoostType')?.value;
    const target = document.getElementById('newBoostTarget')?.value;
    const multiplier = document.getElementById('newBoostMult')?.value;
    const durationHours = document.getElementById('newBoostDuration')?.value;
    const description = document.getElementById('newBoostDesc')?.value;

    if (!multiplier || parseFloat(multiplier) < 1.1) { showNotification('El multiplicador debe ser mayor a 1.0', 'error'); return; }
    if (type !== 'global' && !target) { showNotification('Introduce el ID del objetivo', 'error'); return; }

    try {
        await postAPI('/api/admin/boosts/create', { type, target, multiplier, durationHours, description });
        showNotification('Boost creado correctamente', 'success');
        loadPowerupsData();
    } catch (error) { showNotification('Error creando boost', 'error'); }
}

async function deleteBoost(id) {
    if (!confirm('¿Eliminar este boost?')) return;
    try {
        await deleteAPI(`/api/admin/boosts/${id}`);
        showNotification('Boost eliminado', 'success');
        loadPowerupsData();
    } catch (error) { showNotification('Error eliminando boost', 'error'); }
}

// ===== ADVANCED SYSTEMS =====
async function loadAdvancedSystems() {
    try {
        const data = await fetchAPI('/api/admin/systems/advanced');
        const systems = data.systems || {};
        const grid = document.getElementById('systemsGrid');

        grid.innerHTML = Object.entries(systems).map(([key, sys]) => `
            <div class="system-card ${sys.enabled ? 'enabled' : 'disabled'}" id="sysCard_${key}">
                <div class="system-card-header">
                    <span class="system-icon">${sys.icon}</span>
                    <div class="system-card-title">
                        <h4>${sys.name}</h4>
                        <p class="system-desc">${sys.description}</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" ${sys.enabled ? 'checked' : ''} onchange="toggleSystem('${key}', this.checked)">
                        <span class="toggle-slider-sm"></span>
                    </label>
                </div>
                <div class="system-commands-list">
                    ${sys.commands.map(c => `<span class="cmd-tag">/${c}</span>`).join('')}
                </div>
                ${!sys.enabled && sys.reason ? `<div class="system-reason">Razon: ${escHtml(sys.reason)}</div>` : ''}
                ${!sys.enabled && sys.disabledAt ? `<div class="system-disabled-at">Desactivado: ${new Date(sys.disabledAt).toLocaleString('es-ES')} por ${escHtml(sys.disabledBy || 'Admin')}</div>` : ''}
                ${sys.scheduledReactivation ? `<div class="system-scheduled">Reactivacion: ${new Date(sys.scheduledReactivation).toLocaleString('es-ES')}</div>` : ''}
                <div class="system-advanced-controls">
                    <details class="system-details">
                        <summary>Opciones avanzadas</summary>
                        <div class="system-options-form">
                            <label>Razon de desactivacion:</label>
                            <input type="text" id="sysReason_${key}" value="${escHtml(sys.reason || '')}" placeholder="Ej: Mantenimiento programado">
                            <label>Reactivar automaticamente el:</label>
                            <input type="datetime-local" id="sysSchedule_${key}" value="${sys.scheduledReactivation ? new Date(sys.scheduledReactivation).toISOString().slice(0,16) : ''}">
                            <label>Override por canal (ID: toggle):</label>
                            <div class="channel-override-list" id="sysOverrides_${key}">
                                ${Object.entries(sys.channelOverrides || {}).map(([cid, enabled]) => `
                                    <span class="override-tag ${enabled ? 'enabled' : 'disabled'}">
                                        ${cid}: ${enabled ? 'activo' : 'inactivo'}
                                        <button onclick="removeChannelOverride('${key}','${cid}')">×</button>
                                    </span>`).join('')}
                            </div>
                            <div class="channel-override-add">
                                <input type="text" id="sysOverrideId_${key}" placeholder="ID Canal">
                                <select id="sysOverrideState_${key}">
                                    <option value="true">Activo en este canal</option>
                                    <option value="false">Inactivo en este canal</option>
                                </select>
                                <button class="btn-sm btn-secondary" onclick="addChannelOverride('${key}')">Agregar</button>
                            </div>
                            <button class="btn-primary btn-sm" style="margin-top:8px" onclick="saveSystemAdvanced('${key}')">Guardar configuracion</button>
                        </div>
                    </details>
                </div>
            </div>`).join('');
    } catch (error) { console.error('Error sistemas avanzados:', error); document.getElementById('systemsGrid').innerHTML = '<p class="error-text">Error cargando sistemas</p>'; }
}

async function toggleSystem(system, enabled) {
    try {
        await postAPI('/api/admin/systems/advanced', { system, enabled });
        showNotification(`Sistema ${enabled ? 'activado' : 'desactivado'}`, enabled ? 'success' : 'error');
        const card = document.getElementById(`sysCard_${system}`);
        if (card) { card.classList.toggle('enabled', enabled); card.classList.toggle('disabled', !enabled); }
    } catch (error) { showNotification('Error cambiando sistema', 'error'); loadAdvancedSystems(); }
}

async function saveSystemAdvanced(system) {
    const reason = document.getElementById(`sysReason_${system}`)?.value;
    const scheduleRaw = document.getElementById(`sysSchedule_${system}`)?.value;
    const scheduledReactivation = scheduleRaw ? new Date(scheduleRaw).toISOString() : null;
    try {
        await postAPI('/api/admin/systems/advanced', { system, reason, scheduledReactivation });
        showNotification('Configuracion guardada', 'success');
        loadAdvancedSystems();
    } catch (error) { showNotification('Error guardando', 'error'); }
}

async function addChannelOverride(system) {
    const channelId = document.getElementById(`sysOverrideId_${system}`)?.value?.trim();
    const enabled = document.getElementById(`sysOverrideState_${system}`)?.value === 'true';
    if (!channelId) { showNotification('Introduce un ID de canal', 'error'); return; }
    try {
        await postAPI('/api/admin/systems/advanced', { system, channelOverride: { channelId, enabled } });
        showNotification('Override agregado', 'success');
        loadAdvancedSystems();
    } catch (error) { showNotification('Error', 'error'); }
}

async function removeChannelOverride(system, channelId) {
    try {
        await postAPI('/api/admin/systems/advanced', { system, removeChannelOverride: channelId });
        showNotification('Override eliminado', 'success');
        loadAdvancedSystems();
    } catch (error) { showNotification('Error', 'error'); }
}

// ===== STATS =====
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
        document.getElementById('statsUptime').textContent = formatUptime((data.uptime || 0) * 1000);

        const bracketsContainer = document.getElementById('statsLevelBrackets');
        if (data.levelBrackets) {
            const entries = Object.entries(data.levelBrackets);
            const max = Math.max(...entries.map(e => e[1]), 1);
            bracketsContainer.innerHTML = `<div class="bar-chart">${entries.map(([range, count]) => `
                <div class="chart-bar-item">
                    <div class="bar-container"><div class="bar-fill-h" style="width:${(count/max)*100}%"></div></div>
                    <span class="bar-label">${range}</span><span class="bar-count">${count}</span>
                </div>`).join('')}</div>`;
        }
    } catch (error) { console.error('Error estadisticas:', error); }
}

// ===== EXPORT =====
async function exportData(type, format) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/export/${type}?format=${format}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Error exportando');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${Date.now()}.${format}`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification(`Exportacion ${type} (${format}) iniciada`, 'success');
    } catch (error) { showNotification('Error exportando', 'error'); }
}

// ===== AUDIT LOG =====
let currentAuditPage = 1;

async function loadAuditLog(page) {
    if (page) currentAuditPage = page;
    const action = document.getElementById('auditFilterAction')?.value || '';
    const adminName = document.getElementById('auditFilterAdmin')?.value || '';
    try {
        const data = await fetchAPI(`/api/admin/audit?page=${currentAuditPage}&limit=50&action=${action}&adminName=${adminName}`);
        const tbody = document.getElementById('auditTableBody');
        if (!data.logs?.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-text">No hay registros</td></tr>';
        } else {
            tbody.innerHTML = data.logs.map(log => `
                <tr class="audit-row audit-action-${log.action.split('_')[0]}">
                    <td>${new Date(log.timestamp).toLocaleString('es-ES')}</td>
                    <td><span class="admin-name-badge">${escHtml(log.adminName || 'Sistema')}</span></td>
                    <td><span class="audit-action-badge">${log.action}</span></td>
                    <td class="audit-details">${formatAuditDetails(log.details)}</td>
                </tr>`).join('');
        }
        renderAuditPagination(data);
    } catch (error) { console.error('Error audit:', error); }
}

function formatAuditDetails(details) {
    if (!details) return '-';
    const parts = [];
    for (const [k, v] of Object.entries(details)) {
        if (v !== null && v !== undefined && v !== '') parts.push(`<span class="detail-kv"><b>${k}:</b> ${escHtml(String(v))}</span>`);
    }
    return parts.join(' ') || '-';
}

function renderAuditPagination(data) {
    const div = document.getElementById('auditPagination');
    if (!div || data.totalPages <= 1) { if (div) div.innerHTML = ''; return; }
    div.innerHTML = `
        <button ${data.page <= 1 ? 'disabled' : ''} onclick="loadAuditLog(${data.page - 1})">←</button>
        <span>Pagina ${data.page} de ${data.totalPages} (${data.total} registros)</span>
        <button ${data.page >= data.totalPages ? 'disabled' : ''} onclick="loadAuditLog(${data.page + 1})">→</button>`;
}

async function exportAuditLog() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/audit?limit=2000', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const logs = data.logs || [];
        if (!logs.length) { showNotification('No hay registros para exportar', 'error'); return; }
        const headers = ['timestamp', 'adminName', 'action', 'details'];
        const csvRows = [headers.join(',')];
        for (const log of logs) {
            csvRows.push([
                new Date(log.timestamp).toISOString(),
                log.adminName || '',
                log.action,
                JSON.stringify(log.details || {}).replace(/"/g, '""')
            ].map(v => `"${v}"`).join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `audit_log_${Date.now()}.csv`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (error) { showNotification('Error exportando audit log', 'error'); }
}

// ===== LOGS =====
let currentLogsPage = 1;

async function loadLogsData(page) {
    if (page) currentLogsPage = page;
    const typeFilter = document.getElementById('logTypeFilter')?.value || '';
    const systemFilter = document.getElementById('logSystemFilter')?.value || '';
    const periodFilter = document.getElementById('logPeriodFilter')?.value || 'all';
    try {
        let url = `/api/admin/logs?page=${currentLogsPage}&limit=100&period=${periodFilter}`;
        if (typeFilter) url += `&type=${typeFilter}`;
        if (systemFilter) url += `&system=${systemFilter}`;
        const data = await fetchAPI(url);
        const container = document.getElementById('logsList');
        if (!data.logs?.length) { container.innerHTML = '<p class="empty-text">No hay logs con estos filtros</p>'; return; }
        container.innerHTML = data.logs.map(log => `
            <div class="log-entry log-type-${log.type}">
                <div class="log-time">${formatLogTime(log.timestamp)}</div>
                <div class="log-icon">${getLogIcon(log.type)}</div>
                <div class="log-content">
                    <span class="log-user">${escHtml(log.username || 'Sistema')}</span>
                    <span class="log-action">${getLogDescription(log)}</span>
                    ${log.amount ? `<span class="log-amount ${log.amount >= 0 ? 'positive' : 'negative'}">${log.amount >= 0 ? '+' : ''}${log.amount.toLocaleString()}</span>` : ''}
                </div>
                ${log.system ? `<span class="log-system-tag">${log.system}</span>` : ''}
            </div>`).join('');

        const pag = data.pagination;
        const pagDiv = document.getElementById('logsPagination');
        if (pag && pag.totalPages > 1) {
            pagDiv.innerHTML = `
                <button ${pag.page <= 1 ? 'disabled' : ''} onclick="loadLogsData(${pag.page - 1})">←</button>
                <span>Pag ${pag.page}/${pag.totalPages} (${pag.total} logs)</span>
                <button ${pag.page >= pag.totalPages ? 'disabled' : ''} onclick="loadLogsData(${pag.page + 1})">→</button>`;
        } else if (pagDiv) pagDiv.innerHTML = '';
    } catch (error) { console.error('Error logs:', error); document.getElementById('logsList').innerHTML = '<p class="error-text">Error</p>'; }
}

document.getElementById('applyLogsFilter')?.addEventListener('click', () => loadLogsData(1));
document.getElementById('exportLogsBtn')?.addEventListener('click', exportLogsCSV);

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
        const blob = await response.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `logs_${Date.now()}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (error) { showNotification('Error exportando logs', 'error'); }
}

// ===== USER MANAGEMENT =====
let selectedUser = null;
let selectedUserIds = new Set();
let usersCurrentPage = 1;

function initUserManagement() {
    const searchBtn = document.getElementById('userSearchBtn');
    const searchInput = document.getElementById('userSearchInput');
    if (searchBtn) searchBtn.onclick = searchUsers;
    if (searchInput) searchInput.onkeypress = (e) => { if (e.key === 'Enter') searchUsers(); };

    document.querySelectorAll('.user-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.user-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.user-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
            if (btn.dataset.tab === 'advanced' && selectedUser) loadUserAdvancedDetails();
            if (btn.dataset.tab === 'inventory' && selectedUser) loadUserInventory();
        });
    });
}

async function searchUsers() {
    const query = document.getElementById('userSearchInput')?.value?.trim();
    if (!query) return;
    try {
        const data = await fetchAPI(`/api/admin/user/search?query=${encodeURIComponent(query)}`);
        renderUsersList(data.users || []);
    } catch (error) { showNotification('Error buscando usuario', 'error'); }
}

async function loadAllUsers(page = 1) {
    usersCurrentPage = page;
    try {
        const data = await fetchAPI(`/api/admin/users/list?page=${page}&limit=50&sortBy=totalXp&order=desc`);
        renderUsersList(data.users || [], data);
    } catch (error) { showNotification('Error cargando usuarios', 'error'); }
}

function renderUsersList(users, pagination = null) {
    const list = document.getElementById('usersList');
    const total = document.getElementById('usersTotal');
    if (total) total.textContent = pagination ? `${pagination.total} usuarios` : `${users.length} encontrados`;

    if (!users.length) { list.innerHTML = '<p class="empty-text">No se encontraron usuarios</p>'; return; }

    list.innerHTML = users.map(user => `
        <div class="user-list-item" data-user-id="${user.userId}" data-guild-id="${user.guildId || ''}">
            <label class="user-checkbox-wrap">
                <input type="checkbox" class="user-checkbox" data-uid="${user.userId}" data-gid="${user.guildId}" onchange="toggleUserSelection(this)">
            </label>
            <img class="user-list-avatar" src="${user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="">
            <div class="user-list-info">
                <span class="user-list-name">${escHtml(user.displayName || user.username || 'Desconocido')}</span>
                <span class="user-list-stats">Nivel ${user.level || 0} · ${(user.totalXp || 0).toLocaleString()} XP</span>
            </div>
            <button class="btn-secondary btn-sm" onclick="loadUserDetail('${user.guildId || ''}','${user.userId}','${escHtml(user.displayName || user.username || 'Usuario')}','${user.avatar || ''}')">Ver</button>
        </div>`).join('');

    if (pagination && pagination.totalPages > 1) {
        const pagDiv = document.getElementById('usersPagination');
        if (pagDiv) pagDiv.innerHTML = `
            <button ${pagination.page <= 1 ? 'disabled' : ''} onclick="loadAllUsers(${pagination.page - 1})">←</button>
            <span>Pag ${pagination.page}/${pagination.totalPages}</span>
            <button ${pagination.page >= pagination.totalPages ? 'disabled' : ''} onclick="loadAllUsers(${pagination.page + 1})">→</button>`;
    }
}

function toggleUserSelection(checkbox) {
    const uid = checkbox.dataset.uid;
    const gid = checkbox.dataset.gid;
    if (checkbox.checked) selectedUserIds.add(JSON.stringify({ userId: uid, guildId: gid }));
    else selectedUserIds.delete(JSON.stringify({ userId: uid, guildId: gid }));
    updateBulkBar();
}

function toggleSelectAll(masterCheckbox) {
    document.querySelectorAll('.user-checkbox').forEach(cb => {
        cb.checked = masterCheckbox.checked;
        toggleUserSelection(cb);
    });
}

function updateBulkBar() {
    const bar = document.getElementById('bulkActionBar');
    const count = document.getElementById('bulkSelectedCount');
    if (bar) bar.style.display = selectedUserIds.size > 0 ? 'flex' : 'none';
    if (count) count.textContent = `${selectedUserIds.size} seleccionados`;
}

function clearBulkSelection() {
    selectedUserIds.clear();
    document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
    const master = document.getElementById('selectAllUsers');
    if (master) master.checked = false;
    updateBulkBar();
}

async function executeBulkAction() {
    const action = document.getElementById('bulkAction')?.value;
    const value = document.getElementById('bulkValue')?.value;
    if (!action) { showNotification('Selecciona una accion', 'error'); return; }
    if (selectedUserIds.size === 0) { showNotification('Selecciona al menos un usuario', 'error'); return; }

    const actionsNeedingValue = ['addXp', 'removeXp', 'addCoins', 'removeCoins', 'banXp'];
    if (actionsNeedingValue.includes(action) && !value) { showNotification('Introduce un valor', 'error'); return; }

    if (!confirm(`Aplicar "${action}" a ${selectedUserIds.size} usuarios?`)) return;

    try {
        const userIds = [...selectedUserIds].map(s => JSON.parse(s));
        const result = await postAPI('/api/admin/users/bulk', { userIds, action, value: parseInt(value) || 0, reason: 'Accion masiva desde panel' });
        showNotification(`Completado: ${result.successCount}/${result.total} exitosos`, 'success');
        clearBulkSelection();
    } catch (error) { showNotification('Error en accion masiva', 'error'); }
}

async function loadUserDetail(guildId, userId, displayName, avatar) {
    selectedUser = { guildId, userId };
    const panel = document.getElementById('userDetailPanel');
    panel.style.display = 'block';
    document.getElementById('userDetailName').textContent = displayName;
    document.getElementById('userDetailId').textContent = userId;
    document.getElementById('userDetailAvatar').src = avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';

    document.querySelectorAll('.user-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.user-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.user-tab-btn[data-tab="stats"]')?.classList.add('active');
    document.getElementById('tab-stats')?.classList.add('active');

    try {
        const data = await fetchAPI(`/api/admin/user/${guildId}/${userId}`);
        document.getElementById('userTotalXp').textContent = (data.user?.totalXp || 0).toLocaleString();
        document.getElementById('userLevel').textContent = data.user?.level || 0;
        document.getElementById('userLagcoins').textContent = (data.economy?.lagcoins || 0).toLocaleString();
        document.getElementById('userBank').textContent = (data.economy?.bank || 0).toLocaleString();

        const rolesEl = document.getElementById('userRoles');
        if (rolesEl) rolesEl.innerHTML = (data.roles || []).map(r => `<span class="role-tag" style="background:${r.color}22;border:1px solid ${r.color}">${escHtml(r.name)}</span>`).join('') || '<p class="empty-text">Sin roles</p>';

        const logsEl = document.getElementById('userActivityLogs');
        if (logsEl) {
            logsEl.innerHTML = (data.logs || []).length > 0
                ? (data.logs || []).map(log => `
                    <div class="activity-log-item">
                        <span class="log-icon-sm">${getLogIcon(log.type)}</span>
                        <span class="log-desc">${getLogDescription(log)}</span>
                        <span class="log-time-sm">${formatLogTime(log.timestamp)}</span>
                    </div>`).join('')
                : '<p class="empty-text">Sin actividad registrada</p>';
        }
    } catch (error) { showNotification('Error cargando usuario', 'error'); }

    panel.scrollIntoView({ behavior: 'smooth' });
}

async function loadUserAdvancedDetails() {
    if (!selectedUser) return;
    const { guildId, userId } = selectedUser;
    try {
        const data = await fetchAPI(`/api/admin/user/${guildId}/${userId}/details`);

        const banEl = document.getElementById('userXpBanStatus');
        const badgeEl = document.getElementById('userDetailBanBadge');
        if (data.banInfo?.banned) {
            banEl.innerHTML = `<span class="ban-active">BAN ACTIVO ${data.banInfo.permanent ? '(Permanente)' : `hasta ${new Date(data.banInfo.expiresAt).toLocaleString('es-ES')}`}</span>`;
            if (badgeEl) badgeEl.style.display = 'inline';
        } else {
            banEl.innerHTML = '<span class="ban-inactive">Sin ban</span>';
            if (badgeEl) badgeEl.style.display = 'none';
        }

        const cooldownsEl = document.getElementById('userCooldownsList');
        const cooldowns = data.cooldowns || {};
        cooldownsEl.innerHTML = Object.keys(cooldowns).length > 0
            ? Object.entries(cooldowns).map(([t, c]) => `<div class="cooldown-item"><span>${t}</span><span>${formatTimeLeft(c.remaining)}</span></div>`).join('')
            : '<p class="empty-text">Sin cooldowns activos</p>';

        const marriageEl = document.getElementById('userMarriageInfo');
        if (data.marriage) marriageEl.innerHTML = `<p>Casado con: ${data.marriage.partnerId}</p><p>Desde: ${data.marriage.since ? new Date(data.marriage.since).toLocaleDateString('es-ES') : 'Desconocido'}</p>`;
        else marriageEl.innerHTML = '<p class="empty-text">Sin matrimonio</p>';

        const insuranceEl = document.getElementById('userInsuranceInfo');
        if (data.insurance) insuranceEl.innerHTML = `<p>Activo: ${data.insurance.active ? 'Si' : 'No'}</p>`;
        else insuranceEl.innerHTML = '<p class="empty-text">Sin seguro</p>';

        const nationalityEl = document.getElementById('userNationalityInfo');
        nationalityEl.innerHTML = data.nationality ? `<p>${escHtml(data.nationality)}</p>` : '<p class="empty-text">Sin nacionalidad</p>';

        const streakEl = document.getElementById('userStreakInfo');
        streakEl.innerHTML = data.streak ? `<p>Racha activa</p>` : '<p class="empty-text">Sin racha activa</p>';
    } catch (error) { showNotification('Error cargando detalles avanzados', 'error'); }
}

async function loadUserInventory() {
    if (!selectedUser) return;
    const { guildId, userId } = selectedUser;
    const invEl = document.getElementById('userInventoryList');
    try {
        const data = await fetchAPI(`/api/admin/user/${guildId}/${userId}/details`);
        const inventory = data.inventory || [];
        invEl.innerHTML = inventory.length > 0
            ? inventory.map(item => `<div class="inventory-item"><span>${escHtml(item.name || item)}</span></div>`).join('')
            : '<p class="empty-text">Inventario vacio</p>';
    } catch (error) { invEl.innerHTML = '<p class="error-text">Error cargando inventario</p>'; }
}

async function applyXpBan(ban) {
    if (!selectedUser) return;
    const { guildId, userId } = selectedUser;
    const duration = document.getElementById('xpBanDuration')?.value || 0;
    try {
        await postAPI(`/api/admin/user/${guildId}/${userId}/xpban`, { ban, durationMinutes: parseInt(duration), reason: 'Desde panel admin' });
        showNotification(ban ? 'Ban XP aplicado' : 'Ban XP eliminado', ban ? 'error' : 'success');
        loadUserAdvancedDetails();
    } catch (error) { showNotification('Error aplicando ban', 'error'); }
}

async function resetUserCooldowns() {
    if (!selectedUser) return;
    const { guildId, userId } = selectedUser;
    try {
        await postAPI(`/api/admin/user/${guildId}/${userId}/reset-cooldowns`, {});
        showNotification('Cooldowns reseteados', 'success');
        loadUserAdvancedDetails();
    } catch (error) { showNotification('Error reseteando cooldowns', 'error'); }
}

function closeUserDetail() {
    document.getElementById('userDetailPanel').style.display = 'none';
    selectedUser = null;
}

function editTopUser(guildId, userId, displayName) {
    showPage('usuarios');
    setTimeout(() => loadUserDetail(guildId, userId, displayName, ''), 300);
}

// ===== MODAL =====
let pendingConfigChange = null;

function showConfirmModal(title, message, onConfirm, needsInput = false) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    const inputWrapper = document.getElementById('modalInputWrapper');
    if (inputWrapper) inputWrapper.style.display = needsInput ? 'flex' : 'none';
    document.getElementById('confirmModal').style.display = 'flex';
    document.getElementById('modalConfirmBtn').onclick = () => {
        onConfirm();
        hideConfirmModal();
    };
}

function hideConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    pendingConfigChange = null;
}

// ===== MODIFY USER =====
async function modifyUser(field, action) {
    if (!selectedUser) return;
    const { guildId, userId } = selectedUser;
    let value = null;
    if (action === 'add' || action === 'remove' || action === 'set') {
        value = prompt(`Introduce el valor para ${action} ${field}:`);
        if (value === null) return;
        value = parseInt(value);
        if (isNaN(value) || value < 0) { showNotification('Valor invalido', 'error'); return; }
    }
    try {
        const result = await postAPI(`/api/admin/user/${guildId}/${userId}/modify`, { field, action, value, reason: 'Desde panel admin' });
        if (result.success) {
            showNotification(`${field} actualizado correctamente`, 'success');
            loadUserDetail(guildId, userId, document.getElementById('userDetailName').textContent, document.getElementById('userDetailAvatar').src);
        }
    } catch (error) { showNotification('Error modificando usuario', 'error'); }
}

// ===== CONFIG =====
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
        const mToggle = document.getElementById('maintenanceToggle');
        const mStatus = document.getElementById('maintenanceStatus');
        if (mToggle) { mToggle.checked = data.maintenanceMode || false; }
        if (mStatus) mStatus.textContent = data.maintenanceMode ? 'Activado' : 'Desactivado';
        setupConfigListeners();
    } catch (error) { console.error('Error config:', error); }
}

async function toggleMaintenance(enabled) {
    try {
        await postAPI('/api/admin/maintenance', { enabled });
        document.getElementById('maintenanceStatus').textContent = enabled ? 'Activado' : 'Desactivado';
        showNotification(`Modo mantenimiento ${enabled ? 'activado' : 'desactivado'}`, enabled ? 'error' : 'success');
    } catch (error) { showNotification('Error', 'error'); }
}

function setupConfigListeners() {
    document.querySelectorAll('.config-save-btn').forEach(btn => {
        btn.onclick = function() {
            const field = this.dataset.field;
            const category = this.closest('.config-item')?.dataset.category;
            const inputMap = {
                cooldown: 'cfgCooldown', baseMin: 'cfgXpMin', baseMax: 'cfgXpMax',
                boosterMultiplier: 'cfgBoosterMult', nightMultiplier: 'cfgNightMult',
                levelUp: 'cfgLevelUpChannel', missionComplete: 'cfgMissionChannel',
                staff: 'cfgStaffRole', booster: 'cfgBoosterRole', vip: 'cfgVipRole', level100: 'cfgLevel100Role'
            };
            const inputId = inputMap[field];
            const value = inputId ? document.getElementById(inputId)?.value : null;
            if (!value) return;
            pendingConfigChange = { category, field, value };
            showConfirmModal('Confirmar cambio', `¿Cambiar ${field} a "${value}"?`, saveConfig);
        };
    });

    document.getElementById('addNoXpChannel')?.addEventListener('click', () => {
        const val = document.getElementById('newNoXpChannel')?.value?.trim();
        if (!val) return;
        pendingConfigChange = { category: 'channels', field: 'addNoXp', value: val };
        showConfirmModal('Agregar canal', `¿Agregar canal ${val} a la lista sin XP?`, saveConfig);
    });
}

async function saveConfig() {
    if (!pendingConfigChange) return;
    try {
        const result = await postAPI('/api/admin/config', pendingConfigChange);
        showNotification(`${pendingConfigChange.field} actualizado`, 'success');
        pendingConfigChange = null;
    } catch (error) { showNotification('Error guardando configuracion', 'error'); }
}

function renderNoXpChannels(channels) {
    const container = document.getElementById('cfgNoXpChannels');
    if (!container) return;
    if (channels.length > 0) {
        container.innerHTML = channels.map(ch => `
            <span class="channel-tag">${ch}
                <button class="remove-channel" onclick="removeNoXpChannel('${ch}')">×</button>
            </span>`).join('');
    } else {
        container.innerHTML = '<p class="empty-text">Ninguno</p>';
    }
}

function removeNoXpChannel(channelId) {
    pendingConfigChange = { category: 'channels', field: 'removeNoXp', value: channelId };
    showConfirmModal('Eliminar canal', `¿Eliminar canal ${channelId} de la lista sin XP?`, saveConfig);
}

// ===== PERSONALIZACION =====
const THEMES = {
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ocean: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    dark: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    fire: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)'
};

const BG_COLORS = {
    light: '#f5f7fa', dark: '#1a1a2e', cream: '#faf8f5',
    blue: '#e8f4fc', green: '#e8f5e9', purple: '#f3e5f5'
};

function applyTheme(theme) {
    document.getElementById('sidebar').style.background = THEMES[theme] || THEMES.default;
    localStorage.setItem('adminTheme', theme);
}

function applyBackground(bg) {
    document.body.style.background = BG_COLORS[bg] || BG_COLORS.light;
    document.querySelector('.main-content').style.background = BG_COLORS[bg] || BG_COLORS.light;
    localStorage.setItem('adminBg', bg);
}

document.querySelectorAll('.mini-theme, .theme-card').forEach(el => {
    el.addEventListener('click', () => applyTheme(el.dataset.theme));
});

document.querySelectorAll('.mini-bg, .bg-card').forEach(el => {
    el.addEventListener('click', () => applyBackground(el.dataset.bg));
});

const customizeBtn = document.getElementById('quickCustomizeBtn');
customizeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('customizeDropdown')?.classList.toggle('active');
    document.getElementById('adminDropdown')?.classList.remove('open');
});
document.addEventListener('click', () => document.getElementById('customizeDropdown')?.classList.remove('active'));

// ===== PAGE ROUTER =====
function loadPageData(page) {
    switch (page) {
        case 'dashboard': loadDashboardData(); break;
        case 'graficas': loadGraficasData(); break;
        case 'alertas': loadAlertsData(); break;
        case 'xp': loadXPData(); break;
        case 'niveles': loadLevelsData(); break;
        case 'roles': loadRolesData(); break;
        case 'misiones': loadMissionsData(); break;
        case 'misiones-live': startMissionsLivePolling(); break;
        case 'powerups': loadPowerupsData(); break;
        case 'sistemas-avanzados': loadAdvancedSystems(); break;
        case 'estadisticas': loadStatisticsData(); break;
        case 'audit-log': loadAuditLog(1); break;
        case 'logs': loadLogsData(1); break;
        case 'usuarios': initUserManagement(); break;
        case 'configuracion': loadConfigData(); break;
    }
    if (page !== 'misiones-live') stopMissionsLivePolling();
}

// ===== UTILS =====
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
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `Hace ${days}d`;
    if (hours > 0) return `Hace ${hours}h`;
    if (minutes > 0) return `Hace ${minutes}m`;
    return 'Hace poco';
}

function formatTimeLeft(ms) {
    if (!ms) return 'Permanente';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${Math.floor(ms / 1000)}s`;
}

function formatLogTime(ts) {
    return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getLogIcon(type) {
    const icons = {
        command_use: '⌨️', xp_gain: '⭐', xp_loss: '📉', level_up: '🎉', level_down: '📉',
        coins_gain: '💰', coins_loss: '💸', work: '💼', casino_win: '🎰', casino_loss: '🎲',
        theft_success: '🦝', theft_fail: '🚔', theft_victim: '😢', mission_complete: '✅',
        item_gain: '🎁', item_use: '🔧', daily_reward: '📅', bank_deposit: '🏦',
        bank_withdraw: '💵', shop_purchase: '🛒', powerup_activate: '⚡', admin_action: '👑',
        minigame_win: '🏆', minigame_loss: '❌', gift_sent: '🎁', gift_received: '📨',
        marriage: '💍', divorce: '💔', nationality_change: '🌍', bank_heist: '🏴‍☠️',
        trade: '🤝', streak_gain: '🔥', tax_paid: '📊', config_change: '⚙️'
    };
    return icons[type] || '📋';
}

function getLogDescription(log) {
    const descs = {
        command_use: `uso /${log.command || '?'}`, xp_gain: 'gano XP', xp_loss: 'perdio XP',
        level_up: 'subio de nivel', level_down: 'bajo de nivel', coins_gain: 'gano Lagcoins',
        coins_loss: 'perdio Lagcoins', work: 'trabajo', casino_win: 'gano en casino',
        casino_loss: 'perdio en casino', theft_success: 'robo exitoso', theft_fail: 'robo fallido',
        theft_victim: 'fue robado', mission_complete: 'completo mision', item_gain: 'obtuvo item',
        item_use: 'uso item', daily_reward: 'reclamo diario', bank_deposit: 'deposito al banco',
        bank_withdraw: 'retiro del banco', shop_purchase: 'compro en tienda',
        powerup_activate: 'activo power-up', admin_action: 'accion admin',
        minigame_win: 'gano minijuego', minigame_loss: 'perdio minijuego',
        gift_sent: 'envio regalo', gift_received: 'recibio regalo',
        marriage: 'matrimonio', divorce: 'divorcio', nationality_change: 'cambio nacionalidad',
        bank_heist: 'atraco al banco', trade: 'intercambio', streak_gain: 'racha',
        tax_paid: 'pago impuestos', config_change: 'cambio configuracion'
    };
    return log.reason || descs[log.type] || log.type;
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showNotification(message, type) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.innerHTML = `<span>${type === 'success' ? '✓' : '✕'} ${message}</span>`;
    n.style.cssText = `position:fixed;top:20px;right:20px;padding:15px 25px;border-radius:8px;color:white;font-weight:500;z-index:9999;animation:slideIn 0.3s ease;background:${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'}`;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 3000);
}

function updateSessionTime() {
    const expiry = parseInt(localStorage.getItem('tokenExpiry') || 0);
    const remaining = expiry - Date.now();
    if (remaining <= 0) { window.location.href = '/admin/login.html'; return; }
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const el = document.getElementById('sessionTime');
    if (el) el.textContent = `Sesion: ${hours}h ${minutes}m`;
}

// ===== INIT =====
checkAuthentication();

const savedTheme = localStorage.getItem('adminTheme');
const savedBg = localStorage.getItem('adminBg');
if (savedTheme) applyTheme(savedTheme);
if (savedBg) applyBackground(savedBg);

loadDashboardData();
updateSessionTime();
setInterval(updateSessionTime, 60000);
setInterval(loadAlertsData, 60000);
setTimeout(loadAlertsData, 2000);
