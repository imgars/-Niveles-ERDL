// Verificar autenticación
function checkAuthentication() {
    const token = localStorage.getItem('adminToken');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry || Date.now() >= parseInt(expiry)) {
        window.location.href = '/admin/login.html';
        return false;
    }
    return true;
}

// Cerrar sesión
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('tokenExpiry');
    window.location.href = '/admin/login.html';
});

// Navegación del sidebar
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        
        // Actualizar active
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Cambiar página
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}-page`)?.classList.add('active');
        
        // Actualizar título
        const titles = {
            dashboard: '📊 Dashboard Principal',
            xp: '⭐ Sistema de XP',
            niveles: '🏆 Sistema de Niveles',
            roles: '🎭 Roles por Nivel',
            misiones: '🎯 Misiones',
            powerups: '⚡ Power-ups',
            estadisticas: '📈 Estadísticas',
            configuracion: '⚙️ Configuración'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Panel Admin';
    });
});

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/admin/login.html';
            }
            return;
        }
        
        const data = await response.json();
        
        // Actualizar stats
        document.getElementById('botStatus').textContent = data.botStatus || 'Online';
        document.getElementById('uptime').textContent = formatUptime(data.uptime || 0);
        document.getElementById('guildCount').textContent = data.guildCount || 0;
        document.getElementById('userCount').textContent = data.userCount || 0;
        
        // Actualizar eventos de hoy
        document.getElementById('xpToday').textContent = (data.xpToday || 0).toLocaleString();
        document.getElementById('levelsToday').textContent = data.levelsToday || 0;
        document.getElementById('missionsToday').textContent = data.missionsToday || 0;
        document.getElementById('errorsToday').textContent = data.errorsToday || 0;
        
        // Actualizar información del sistema
        document.getElementById('botVersion').textContent = data.botVersion || '1.0.0';
        document.getElementById('lastSync').textContent = formatDate(data.lastSync);
        document.getElementById('mongoStatus').textContent = data.mongoStatus || 'Desconectado';
        document.getElementById('nodeVersion').textContent = data.nodeVersion || 'v20.0.0';
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

// Formatear uptime
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

// Formatear fecha
function formatDate(timestamp) {
    if (!timestamp) return 'Hace poco';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Hace poco';
}

// Actualizar hora de sesión
function updateSessionTime() {
    const expiry = parseInt(localStorage.getItem('tokenExpiry') || 0);
    const remaining = expiry - Date.now();
    
    if (remaining <= 0) {
        window.location.href = '/admin/login.html';
        return;
    }
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    document.getElementById('sessionTime').textContent = `Sesión expira en: ${minutes}m ${seconds}s`;
}

// Inicializar
window.addEventListener('load', () => {
    if (!checkAuthentication()) return;
    
    loadDashboardData();
    setInterval(loadDashboardData, 30000); // Actualizar cada 30 segundos
    
    updateSessionTime();
    setInterval(updateSessionTime, 1000); // Actualizar cada segundo
});
