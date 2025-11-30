document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    let leaderboardData = [];
    let currentPage = 1;
    const itemsPerPage = 50;
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
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
            history.pushState(null, '', `#${sectionId}`);
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
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="loading-row">
                    <div class="loading-spinner"></div>
                    <span>Cargando leaderboard...</span>
                </td>
            </tr>
        `;

        try {
            const response = await fetch('/api/leaderboard');
            const data = await response.json();
            
            leaderboardData = data.users;
            filteredData = [...leaderboardData];
            
            document.getElementById('total-users').textContent = data.total;
            document.getElementById('lb-total').textContent = `Total: ${data.total} usuarios`;
            
            currentPage = 1;
            renderLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-row">
                        <span style="color: #FF6B6B;">Error al cargar el leaderboard</span>
                    </td>
                </tr>
            `;
        }
    }

    function renderLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-row">
                        <span>No se encontraron usuarios</span>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageData.map((user, index) => {
            const rank = startIndex + index + 1;
            let rankClass = '';
            let rankIcon = '';
            
            if (rank === 1) {
                rankClass = 'rank-1';
                rankIcon = '&#9813;';
            } else if (rank === 2) {
                rankClass = 'rank-2';
                rankIcon = '&#9814;';
            } else if (rank === 3) {
                rankClass = 'rank-3';
                rankIcon = '&#9815;';
            }
            
            const displayName = user.displayName || user.username || `Usuario ${user.userId.slice(-4)}`;
            const avatarUrl = user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
            
            return `
                <tr>
                    <td class="rank-col ${rankClass}">${rankIcon} #${rank}</td>
                    <td class="user-col">
                        <div class="user-info">
                            <img src="${avatarUrl}" alt="Avatar" class="user-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                            <span class="user-name">${escapeHtml(displayName)}</span>
                        </div>
                    </td>
                    <td class="level-col">Nivel ${user.level}</td>
                    <td class="xp-col">${formatNumber(user.totalXp)} XP</td>
                </tr>
            `;
        }).join('');

        updatePagination();
    }

    function updatePagination() {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        pageInfo.textContent = `Pagina ${currentPage} de ${totalPages}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderLeaderboard();
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < totalPages) {
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
                filteredData = leaderboardData.filter(user => 
                    user.userId.toLowerCase().includes(query)
                );
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

    async function loadStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            document.getElementById('total-users').textContent = stats.totalUsers;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    loadStats();

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
});
