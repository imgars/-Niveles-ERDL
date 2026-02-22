document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    let leaderboardData = [];
    let currentPage = 1;
    const itemsPerPage = 25;
    let filteredData = [];

    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        if (sectionId === 'leaderboard' && leaderboardData.length === 0) {
            loadLeaderboard();
        }
        
        if (sectionId === 'preguntas') {
            loadQuestions();
        }
        
        if (sectionId === 'estadisticas') {
            // Resetear búsqueda al entrar a la sección
            document.getElementById('stats-username-input').value = '';
            document.getElementById('stats-container').style.display = 'none';
            document.getElementById('stats-error').style.display = 'none';
        }

    }

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('open');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
            history.pushState(null, '', `#${sectionId}`);
            if (hamburgerBtn) {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('open');
            }
        });
    });

    // Cargar preguntas
    async function loadQuestions() {
        try {
            const response = await fetch('/api/questions');
            const questions = await response.json();
            
            const questionsList = document.getElementById('questions-list');
            questionsList.innerHTML = '';
            
            if (questions.length === 0) {
                questionsList.innerHTML = '<div class="no-answered">No hay preguntas aún. ¡Sé el primero!</div>';
                return;
            }
            
            questions.forEach(q => {
                const card = document.createElement('div');
                card.className = `question-card ${q.answered ? 'answered' : 'unanswered'}`;
                
                const date = new Date(q.createdAt).toLocaleDateString('es-ES');
                
                card.innerHTML = `
                    <div class="question-header">
                        <span class="asker-name">${q.askerName}</span>
                        <span class="question-date">${date}</span>
                    </div>
                    <div class="question-text">${q.question}</div>
                    ${q.answered ? `
                        <div class="answer-section">
                            <span class="answer-label">Respuesta:</span>
                            <div class="answer-text">${q.answer}</div>
                        </div>
                    ` : `
                        <div class="no-answered">Pendiente de respuesta...</div>
                        <button type="button" class="answer-button" data-question-id="${q._id}">Responder</button>
                    `}
                `;
                
                questionsList.appendChild(card);
                
                // Agregar event listener al botón de responder
                if (!q.answered) {
                    const answerBtn = card.querySelector('.answer-button');
                    answerBtn.addEventListener('click', () => openAnswerModal(q));
                }
            });
        } catch (error) {
            console.error('Error loading questions:', error);
        }
    }
    
    // Abrir modal de respuesta
    function openAnswerModal(question) {
        const modal = document.getElementById('answer-modal');
        const preview = document.getElementById('answer-question-preview');
        
        preview.innerHTML = `
            <div class="preview-asker">${question.askerName}</div>
            <div class="preview-text">${question.question}</div>
        `;
        
        // Guardar ID de la pregunta en el formulario
        document.getElementById('answer-form').dataset.questionId = question._id;
        
        modal.classList.add('show');
    }
    
    // Cerrar modal de respuesta
    function closeAnswerModal() {
        const modal = document.getElementById('answer-modal');
        modal.classList.remove('show');
        document.getElementById('answer-form').reset();
        document.getElementById('answer-message').className = 'form-message';
    }
    
    // Evento para cerrar modal
    document.querySelector('.answer-modal-close').addEventListener('click', closeAnswerModal);
    
    document.getElementById('answer-modal').addEventListener('click', (e) => {
        if (e.target.id === 'answer-modal') closeAnswerModal();
    });
    
    // Manejar envío de respuesta
    const answerForm = document.getElementById('answer-form');
    answerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const questionId = answerForm.dataset.questionId;
        const answerText = document.getElementById('answer-text').value;
        const password = document.getElementById('admin-password').value;
        const messageDiv = document.getElementById('answer-message');
        
        try {
            const response = await fetch(`/api/questions/${questionId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: answerText, password })
            });
            
            if (response.ok) {
                messageDiv.textContent = '✅ Respuesta enviada correctamente!';
                messageDiv.className = 'form-message success';
                setTimeout(() => {
                    closeAnswerModal();
                    loadQuestions();
                }, 1500);
            } else {
                const error = await response.json();
                messageDiv.textContent = '❌ ' + error.error;
                messageDiv.className = 'form-message error';
            }
        } catch (error) {
            messageDiv.textContent = '❌ Error al enviar respuesta';
            messageDiv.className = 'form-message error';
        }
    });
    
    // Manejar formulario de preguntas
    const questionForm = document.getElementById('question-form');
    if (questionForm) {
        questionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const askerName = document.getElementById('asker-name').value.trim();
            const questionText = document.getElementById('question-text').value.trim();
            const messageDiv = document.getElementById('form-message');
            
            if (!askerName || !questionText) return;
            
            try {
                const response = await fetch('/api/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: questionText, askerName })
                });
                
                if (response.ok) {
                    messageDiv.textContent = '✅ Pregunta enviada correctamente!';
                    messageDiv.className = 'form-message success';
                    questionForm.reset();
                    setTimeout(() => messageDiv.className = 'form-message', 3000);
                    loadQuestions();
                } else {
                    const error = await response.json();
                    messageDiv.textContent = '❌ ' + error.error;
                    messageDiv.className = 'form-message error';
                }
            } catch (error) {
                messageDiv.textContent = '❌ Error al enviar pregunta';
                messageDiv.className = 'form-message error';
            }
        });
    }

    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(hash)) {
        showSection(hash);
    } else {
        showSection('inicio');
    }

    window.addEventListener('popstate', function() {
        const hash = window.location.hash.slice(1);
        if (hash && document.getElementById(hash)) {
            showSection(hash);
        } else {
            showSection('inicio');
        }
    });

    async function loadLeaderboard() {
        const podiumEl = document.getElementById('lb-podium');
        const listEl = document.getElementById('lb-list');

        podiumEl.innerHTML = '<div class="lb-podium-loading"><div class="loading-spinner"></div><span>Cargando podio...</span></div>';
        listEl.innerHTML = '<div class="lb-list-loading"><div class="loading-spinner"></div><span>Cargando leaderboard...</span></div>';

        try {
            const response = await fetch('/api/leaderboard');
            const data = await response.json();

            leaderboardData = data.users;
            filteredData = [...leaderboardData];

            document.getElementById('total-users').textContent = data.total;
            document.getElementById('lb-total').textContent = `${data.total} usuarios`;

            currentPage = 1;
            renderLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            podiumEl.innerHTML = '';
            listEl.innerHTML = '<div class="lb-list-loading"><span style="color: #FF6B6B;">Error al cargar el leaderboard</span></div>';
        }
    }

    function buildUserDataAttr(user, rank) {
        return JSON.stringify({
            userId: user.userId,
            username: user.username || user.displayName || '',
            displayName: user.displayName || user.username || 'Usuario ' + user.userId.slice(-4),
            avatar: user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
            level: user.level,
            totalXp: user.totalXp,
            rank: rank
        }).replace(/'/g, "\\'");
    }

    function renderLeaderboard() {
        const podiumEl = document.getElementById('lb-podium');
        const listEl = document.getElementById('lb-list');
        const isSearching = document.getElementById('search-user').value.trim() !== '';

        if (filteredData.length === 0) {
            podiumEl.innerHTML = '';
            listEl.innerHTML = '<div class="lb-list-loading"><span>No se encontraron usuarios</span></div>';
            updatePagination();
            return;
        }

        if (currentPage === 1 && !isSearching) {
            const top3 = filteredData.slice(0, 3);
            const classes = ['gold', 'silver', 'bronze'];
            const medals = ['👑', '', ''];

            podiumEl.innerHTML = top3.map((user, i) => {
                const displayName = user.displayName || user.username || 'Usuario ' + user.userId.slice(-4);
                const avatarUrl = user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
                const crown = i === 0 ? '<div class="lb-crown">👑</div>' : '';
                return '<div class="lb-podium-card ' + classes[i] + '" data-user=\'' + buildUserDataAttr(user, i + 1) + '\'>' +
                    '<div class="lb-podium-rank">' + (i + 1) + '</div>' +
                    crown +
                    '<img src="' + avatarUrl + '" alt="" class="lb-podium-avatar" onerror="this.src=\'https://cdn.discordapp.com/embed/avatars/0.png\'">' +
                    '<div class="lb-podium-name">' + escapeHtml(displayName) + '</div>' +
                    '<div class="lb-podium-level">Nivel ' + user.level + '</div>' +
                    '<div class="lb-podium-xp">' + formatNumber(user.totalXp) + ' XP</div>' +
                '</div>';
            }).join('');

            podiumEl.querySelectorAll('.lb-podium-card').forEach(card => {
                card.addEventListener('click', function() {
                    try { showUserModal(JSON.parse(this.dataset.user)); } catch(e) {}
                });
            });
            podiumEl.style.display = 'flex';
        } else {
            podiumEl.innerHTML = '';
            podiumEl.style.display = 'none';
        }

        const hasPodium = currentPage === 1 && !isSearching;
        const podiumCount = hasPodium ? Math.min(3, filteredData.length) : 0;
        let listStart, listEnd;
        if (isSearching) {
            listStart = (currentPage - 1) * itemsPerPage;
            listEnd = listStart + itemsPerPage;
        } else {
            listStart = podiumCount + (currentPage - 1) * itemsPerPage;
            listEnd = listStart + itemsPerPage;
        }
        const pageData = filteredData.slice(listStart, listEnd);

        if (pageData.length === 0 && currentPage === 1) {
            listEl.innerHTML = '';
            updatePagination();
            return;
        }

        listEl.innerHTML = pageData.map((user, index) => {
            const rank = listStart + index + 1;
            const displayName = user.displayName || user.username || 'Usuario ' + user.userId.slice(-4);
            const avatarUrl = user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';

            return '<div class="lb-row" data-user=\'' + buildUserDataAttr(user, rank) + '\'>' +
                '<div class="lb-row-rank">#' + rank + '</div>' +
                '<div class="lb-row-user">' +
                    '<img src="' + avatarUrl + '" alt="" class="lb-row-avatar" onerror="this.src=\'https://cdn.discordapp.com/embed/avatars/0.png\'">' +
                    '<span class="lb-row-name">' + escapeHtml(displayName) + '</span>' +
                '</div>' +
                '<div class="lb-row-level">Nv. ' + user.level + '</div>' +
                '<div class="lb-row-xp">' + formatNumber(user.totalXp) + ' XP</div>' +
            '</div>';
        }).join('');

        listEl.querySelectorAll('.lb-row').forEach(row => {
            row.addEventListener('click', function() {
                try { showUserModal(JSON.parse(this.dataset.user)); } catch(e) {}
            });
        });

        updatePagination();
    }

    function updatePagination() {
        const isSearching = document.getElementById('search-user').value.trim() !== '';
        const dataLen = filteredData.length;
        let totalPages;
        if (isSearching) {
            totalPages = Math.ceil(dataLen / itemsPerPage);
        } else {
            const podiumCount = Math.min(3, dataLen);
            const remaining = Math.max(0, dataLen - podiumCount);
            totalPages = remaining > 0 ? Math.ceil(remaining / itemsPerPage) : (dataLen > 0 ? 1 : 0);
        }
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        pageInfo.textContent = 'Pagina ' + currentPage + ' de ' + totalPages;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
    }

    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderLeaderboard();
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        if (!this.disabled) {
            currentPage++;
            renderLeaderboard();
        }
    });

    const searchInput = document.getElementById('search-user');
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.toLowerCase().trim();
            
            if (query === '') {
                filteredData = [...leaderboardData];
            } else {
                filteredData = leaderboardData.filter(user => {
                    const username = (user.username || '').toLowerCase();
                    const displayName = (user.displayName || '').toLowerCase();
                    const userId = (user.userId || '').toLowerCase();
                    return username.includes(query) || displayName.includes(query) || userId.includes(query);
                });
            }
            
            currentPage = 1;
            renderLeaderboard();
        }, 300);
    });

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showUserModal(userData) {
        let modal = document.getElementById('user-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'user-modal';
            modal.className = 'user-modal';
            modal.innerHTML = `
                <div class="user-modal-content">
                    <span class="user-modal-close">&times;</span>
                    <div class="user-modal-header">
                        <img class="user-modal-avatar" src="" alt="Avatar">
                        <div class="user-modal-info">
                            <h2 class="user-modal-name"></h2>
                            <p class="user-modal-rank"></p>
                        </div>
                    </div>
                    <div class="user-modal-stats">
                        <div class="user-modal-stat">
                            <span class="stat-value user-modal-level"></span>
                            <span class="stat-label">Nivel</span>
                        </div>
                        <div class="user-modal-stat">
                            <span class="stat-value user-modal-xp"></span>
                            <span class="stat-label">XP Total</span>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('.user-modal-close').addEventListener('click', () => {
                modal.classList.remove('show');
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        }
        
        modal.querySelector('.user-modal-avatar').src = userData.avatar;
        modal.querySelector('.user-modal-name').textContent = userData.displayName || userData.username;
        modal.querySelector('.user-modal-rank').textContent = `Posicion #${userData.rank}`;
        modal.querySelector('.user-modal-level').textContent = userData.level;
        modal.querySelector('.user-modal-xp').textContent = formatNumber(userData.totalXp);
        
        modal.classList.add('show');
    }

    async function loadStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            document.getElementById('total-users').textContent = stats.totalUsers;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async function loadBoosts() {
        const container = document.getElementById('active-boosts-container');
        if (!container) return;

        try {
            const response = await fetch('/api/boosts');
            const data = await response.json();
            
            let html = '';
            
            if (data.globalBoosts && data.globalBoosts.length > 0) {
                data.globalBoosts.forEach(boost => {
                    const timeLeft = boost.timeLeft ? formatTime(boost.timeLeft) : 'Permanente';
                    html += `
                        <div class="boost-card global">
                            <div class="boost-multiplier">+${Math.round((boost.multiplier - 1) * 100)}%</div>
                            <div class="boost-type">BOOST GLOBAL</div>
                            <div class="boost-timer">${timeLeft}</div>
                        </div>
                    `;
                });
            }
            
            if (data.totalActive === 0) {
                html = '<p class="no-boosts">No hay boosts activos en este momento</p>';
            } else {
                html += `
                    <div class="boost-summary">
                        <div class="boost-stat">
                            <div class="boost-stat-value">${data.globalBoosts?.length || 0}</div>
                            <div class="boost-stat-label">Globales</div>
                        </div>
                        <div class="boost-stat">
                            <div class="boost-stat-value">${data.userBoostCount || 0}</div>
                            <div class="boost-stat-label">Usuario</div>
                        </div>
                        <div class="boost-stat">
                            <div class="boost-stat-value">${data.channelBoostCount || 0}</div>
                            <div class="boost-stat-label">Canal</div>
                        </div>
                    </div>
                `;
            }
            
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading boosts:', error);
            container.innerHTML = '<p class="no-boosts">Error cargando boosts</p>';
        }
    }

    function formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }

    loadStats();
    loadBoosts();
    setInterval(loadBoosts, 60000);

    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const letters = heroTitle.textContent.split('');
        heroTitle.innerHTML = letters.map((letter, i) => 
            `<span style="animation-delay: ${i * 0.1}s">${letter}</span>`
        ).join('');
    }

    document.querySelectorAll('.feature-card, .command-card, .minigame-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Lógica para el modal de imagen (zoom de tarjetas)
    const imgModal = document.getElementById('image-modal');
    const modalImg = document.getElementById('img-full');
    const captionText = document.getElementById('image-modal-caption');
    const tutorialContent = document.getElementById('card-tutorial-content');

    const cardTutorials = {
        "Default": "Estilo predeterminado del Servidor. Se obtiene automáticamente al unirte.",
        "Pixel": "¡Es totalmente **Gratuita**! Una opción clásica para empezar.",
        "Ocean": "Requieres el rol **Miembro Activo** (Alcanza el **Nivel 25**).",
        "Zelda": "Requieres el rol **Miembro Super Activo** (Alcanza el **Nivel 35**).",
        "Pokemon": "Requieres el rol **Inmortal** (Alcanza el **Nivel 100**).",
        "Minecraft": "Cómprala en la tienda con el comando `/shop` por **5,000 Lagcoins**.",
        "FNAF": "Cómprala en la tienda con el comando `/shop` por **4,500 Lagcoins**.",
        "Roblox": "Cómprala en la tienda con el comando `/shop` por **7,500 Lagcoins**.",
        "Twitch VIP": "Obtenla comprando una suscripción en el canal de **Twitch** de Sirgio.",
        "TikTok VIP": "Obtenla comprando una suscripción o siendo VIP en el canal de **TikTok** de Sirgio.",
        "Boosters": "Obtenla mejorando (**Boosteando**) el servidor de Discord.",
        "Geometry Dash": "Obtenla mejorando (**Boosteando**) el servidor de Discord."
    };

    const cardColors = {
        "Default": "#5865F2",
        "Pixel": "#00CED1",
        "Ocean": "#0077BE",
        "Zelda": "#DAA520",
        "Pokemon": "#FF0000",
        "Minecraft": "#5A8D4D",
        "FNAF": "#4a0000",
        "Roblox": "#E2231A",
        "Twitch VIP": "#9146FF",
        "TikTok VIP": "#EE1D52",
        "Boosters": "#FF73FA",
        "Geometry Dash": "#FF10F0"
    };

    const imgModalContainer = document.querySelector('.image-modal-container');
    const imgModalInfoSide = document.querySelector('.image-modal-info-side');

    document.querySelectorAll('.card-img-preview').forEach(img => {
        img.onclick = function() {
            imgModal.style.display = "block";
            modalImg.src = this.src;
            const cardName = this.alt;
            captionText.innerHTML = cardName;
            
            // Cambiar color del borde
            const borderColor = cardColors[cardName] || "#FFD700";
            imgModalContainer.style.setProperty('--modal-border-color', borderColor);
            imgModalInfoSide.style.setProperty('--modal-border-color', borderColor);
            modalImg.style.setProperty('--modal-border-color', borderColor);

            // Mostrar tutorial
            if (tutorialContent) {
                const tutorial = cardTutorials[cardName] || "Información no disponible.";
                tutorialContent.innerHTML = `<p>${tutorial}</p>`;
            }
        }
    });

    const closeImgModal = document.querySelector('.image-modal-close');
    if (closeImgModal) {
        closeImgModal.onclick = function() {
            imgModal.style.display = "none";
        }
    }

    window.onclick = function(event) {
        if (event.target == imgModal) {
            imgModal.style.display = "none";
        }
    }

    // Sistema de Estadísticas de Usuario
    const statsSearchBtn = document.getElementById('stats-search-btn');
    const statsUsernameInput = document.getElementById('stats-username-input');
    const statsContainer = document.getElementById('stats-container');
    const statsError = document.getElementById('stats-error');
    const statsLoading = document.getElementById('stats-loading');

    function showStatsLoading() {
        statsLoading.style.display = 'block';
        statsContainer.style.display = 'none';
        statsError.style.display = 'none';
    }

    function hideStatsLoading() {
        statsLoading.style.display = 'none';
    }

    function showStatsError(message) {
        statsError.textContent = message;
        statsError.style.display = 'block';
        statsContainer.style.display = 'none';
        hideStatsLoading();
    }

    function formatNumber(num) {
        if (num === null || num === undefined) return '-';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function formatTime(ms) {
        if (!ms) return 'Permanente';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }

    async function loadUserStats(username) {
        showStatsLoading();
        
        try {
            const response = await fetch(`/api/user-stats?username=${encodeURIComponent(username)}`);
            const data = await response.json();
            
            if (!response.ok) {
                showStatsError(`❌ ${data.error || 'Error al cargar estadísticas'}`);
                return;
            }
            
            hideStatsLoading();
            displayUserStats(data);
        } catch (error) {
            console.error('Error loading user stats:', error);
            showStatsError('❌ Error al conectar con el servidor');
        }
    }

    function displayUserStats(data) {
        // Información básica
        document.getElementById('stats-avatar').src = data.avatar;
        document.getElementById('stats-username').textContent = data.displayName || data.username;
        document.getElementById('stats-userid').textContent = `ID: ${data.userId}`;
        
        if (data.rankcardImage) {
            document.getElementById('stats-rankcard').src = data.rankcardImage;
            document.getElementById('stats-rankcard').style.display = 'block';
        } else {
            document.getElementById('stats-rankcard').style.display = 'none';
        }
        
        // Niveles y XP
        document.getElementById('stat-level').textContent = data.level || 0;
        document.getElementById('stat-totalxp').textContent = formatNumber(data.totalXp);
        if (data.xpProgress) {
            document.getElementById('stat-xpprogress').textContent = 
                `${formatNumber(Math.floor(data.xpProgress.current))} / ${formatNumber(Math.floor(data.xpProgress.needed))} (${Math.floor(data.xpProgress.percentage)}%)`;
        } else {
            document.getElementById('stat-xpprogress').textContent = '-';
        }
        document.getElementById('stat-leaderboard-pos').textContent = data.leaderboardPosition ? `#${data.leaderboardPosition}` : 'N/A';
        
        // Economía
        document.getElementById('stat-lagcoins').textContent = formatNumber(data.lagcoins);
        document.getElementById('stat-bank').textContent = formatNumber(data.bankBalance);
        document.getElementById('stat-married').textContent = data.isMarried ? 
            (data.marriedTo ? `Casado/a con <@${data.marriedTo}>` : 'Casado/a') : 'Soltero/a';
        document.getElementById('stat-items-count').textContent = data.inventoryCount || 0;
        
        // Robos
        document.getElementById('stat-robberies').textContent = data.successfulRobberies || 0;
        document.getElementById('stat-robbed').textContent = data.timesRobbed || 0;
        
        // Boosts y Power-ups
        document.getElementById('stat-boosts').textContent = data.activeBoosts?.length || 0;
        document.getElementById('stat-powerups').textContent = data.activePowerups?.length || 0;
        
        const boostsList = document.getElementById('stat-boosts-list');
        boostsList.innerHTML = '';
        if (data.activeBoosts && data.activeBoosts.length > 0) {
            data.activeBoosts.forEach(boost => {
                const item = document.createElement('div');
                item.className = 'stat-list-item';
                const percentage = boost.multiplier >= 1 ? Math.round((boost.multiplier - 1) * 100) : Math.round(boost.multiplier * 100);
                let timeLeft = 'Permanente';
                if (boost.expiresAt) {
                    const expiresAt = new Date(boost.expiresAt).getTime();
                    const remaining = expiresAt - Date.now();
                    if (remaining > 0) {
                        timeLeft = formatTime(remaining);
                    } else {
                        timeLeft = 'Expirado';
                    }
                }
                item.innerHTML = `<span>+${percentage}% ${boost.description || ''}</span><span>${timeLeft}</span>`;
                boostsList.appendChild(item);
            });
        }
        
        const powerupsList = document.getElementById('stat-powerups-list');
        powerupsList.innerHTML = '';
        if (data.activePowerups && data.activePowerups.length > 0) {
            data.activePowerups.forEach(powerup => {
                const item = document.createElement('div');
                item.className = 'stat-list-item';
                let timeLeft = 'Expirado';
                if (powerup.expiresAt) {
                    const remaining = powerup.expiresAt - Date.now();
                    if (remaining > 0) {
                        timeLeft = formatTime(remaining);
                    }
                }
                const powerupNames = {
                    'work_boost': 'Boost Trabajo',
                    'casino_luck': 'Suerte Casino',
                    'rob_success': 'Sigilo Robo',
                    'xp_boost': 'Boost XP',
                    'cooldown_reduction': 'Reducción Cooldown',
                    'luck_boost': 'Boost Suerte'
                };
                item.innerHTML = `<span>${powerupNames[powerup.type] || powerup.type}</span><span>${timeLeft}</span>`;
                powerupsList.appendChild(item);
            });
        }
        
        // Rankcard
        const themeNames = {
            'discord': 'Discord',
            'pixel': 'Pixel',
            'ocean': 'Océano',
            'zelda': 'Zelda',
            'pokemon': 'Pokémon',
            'minecraft': 'Minecraft',
            'fnaf': 'FNAF',
            'roblox': 'Roblox',
            'night': 'Noche Estrellada',
            'geometrydash': 'Geometry Dash'
        };
        document.getElementById('stat-card-theme').textContent = themeNames[data.selectedCardTheme] || data.selectedCardTheme || 'Discord';
        document.getElementById('stat-purchased-cards').textContent = data.purchasedCards?.length || 0;
        
        // Misiones
        document.getElementById('stat-missions-completed').textContent = data.completedMissions || 0;
        document.getElementById('stat-missions-total').textContent = data.totalMissions || 0;
        
        // Rachas
        document.getElementById('stat-active-streaks').textContent = data.activeStreaks || 0;
        document.getElementById('stat-broken-streaks').textContent = data.brokenStreaks || 0;
        document.getElementById('stat-longest-streak').textContent = data.longestStreak ? `${data.longestStreak} días` : '0 días';
        document.getElementById('stat-total-streak-days').textContent = data.totalStreakDays || 0;
        
        const streaksDetails = document.getElementById('stat-streaks-details');
        streaksDetails.innerHTML = '';
        if (data.streakDetails && data.streakDetails.length > 0) {
            data.streakDetails.forEach(streak => {
                const item = document.createElement('div');
                item.className = 'stat-list-item';
                item.innerHTML = `<span>Con <@${streak.partnerId}></span><span>${streak.days} días</span>`;
                streaksDetails.appendChild(item);
            });
        }
        
        // Casino y Minijuegos
        document.getElementById('stat-minigames-won').textContent = data.minigamesWon || 0;
        document.getElementById('stat-minigame-wr').textContent = data.minigameWinRate || '0%';
        document.getElementById('stat-casino-plays').textContent = data.casinoPlays || 0;
        document.getElementById('stat-casino-wins').textContent = data.casinoWins || 0;
        document.getElementById('stat-casino-wr').textContent = data.casinoWinRate || '0%';
        document.getElementById('stat-casino-won').textContent = formatNumber(data.casinoTotalWon);
        document.getElementById('stat-casino-lost').textContent = formatNumber(data.casinoTotalLost);
        
        // Trabajos
        document.getElementById('stat-times-worked').textContent = formatNumber(data.timesWorked);
        document.getElementById('stat-available-jobs').textContent = `${data.availableJobs} / ${data.totalJobsAvailable}`;
        document.getElementById('stat-total-jobs').textContent = data.totalJobsAvailable || 0;
        document.getElementById('stat-favorite-job').textContent = data.favoriteJob || 'Ninguno';
        
        // Nacionalidad
        if (data.nationality) {
            document.getElementById('stat-nationality').textContent = 
                `${data.nationality.emoji || ''} ${data.nationality.name || data.nationality.country || 'N/A'}`;
            document.getElementById('stat-current-country').textContent = 
                data.nationality.currentCountry === data.nationality.country ? 
                'Mismo país' : 
                (data.nationality.currentCountry ? data.nationality.currentCountry : 'N/A');
        } else {
            document.getElementById('stat-nationality').textContent = 'No asignada';
            document.getElementById('stat-current-country').textContent = '-';
        }
        
        // Items
        const itemsList = document.getElementById('stat-items-list');
        itemsList.innerHTML = '';
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.className = 'stat-item-card';
                itemCard.innerHTML = `
                    <span class="stat-item-emoji">${item.emoji || '❓'}</span>
                    <span class="stat-item-name">${item.name || 'Item'}</span>
                `;
                itemsList.appendChild(itemCard);
            });
        } else {
            itemsList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); font-size: 8px;">No hay items</div>';
        }
        
        statsContainer.style.display = 'block';
    }

    if (statsSearchBtn) {
        statsSearchBtn.addEventListener('click', () => {
            const username = statsUsernameInput.value.trim();
            if (username) {
                loadUserStats(username);
            }
        });
    }

    if (statsUsernameInput) {
        statsUsernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const username = statsUsernameInput.value.trim();
                if (username) {
                    loadUserStats(username);
                }
            }
        });
    }
});
