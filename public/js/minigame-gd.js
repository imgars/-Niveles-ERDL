class GeometryDashGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.gameState = 'menu';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('gd_highscore') || '0');
    this.gameSpeed = 8;
    this.speedIncrement = 0.002;
    this.attempts = parseInt(localStorage.getItem('gd_attempts') || '0');
    
    this.player = {
      x: 100,
      y: this.height - 100,
      width: 32,
      height: 32,
      velocityY: 0,
      jumping: false,
      grounded: false,
      rotation: 0,
      trail: []
    };
    
    this.obstacles = [];
    this.particles = [];
    this.backgroundParticles = [];
    this.gravity = 0.7;
    this.jumpPower = -14;
    this.groundY = this.height - 50;
    
    this.obstacleSpawnRate = 0;
    this.obstacleSpawnThreshold = 100;
    
    this.colors = {
      neonCyan: '#00FFFF',
      neonPink: '#FF10F0',
      neonGreen: '#39FF14',
      neonYellow: '#FFFF00',
      neonPurple: '#BF00FF',
      neonOrange: '#FF6600'
    };
    
    this.pulsePhase = 0;
    this.gridOffset = 0;
    
    this.initBackgroundParticles();
    this.setupEventListeners();
    this.animate();
  }
  
  initBackgroundParticles() {
    for (let i = 0; i < 30; i++) {
      this.backgroundParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
        color: Object.values(this.colors)[Math.floor(Math.random() * 6)],
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }
  
  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.handleJump();
      }
    });
    
    this.canvas.addEventListener('click', () => {
      this.handleJump();
    });
    
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleJump();
    });
  }
  
  handleJump() {
    if (this.gameState === 'menu') {
      this.startGame();
    } else if (this.gameState === 'playing' && this.player.grounded) {
      this.player.velocityY = this.jumpPower;
      this.player.grounded = false;
      this.createJumpParticles();
    } else if (this.gameState === 'gameover') {
      this.reset();
    }
  }
  
  startGame() {
    this.gameState = 'playing';
    this.score = 0;
    this.gameSpeed = 8;
    this.obstacles = [];
    this.attempts++;
    localStorage.setItem('gd_attempts', this.attempts.toString());
  }
  
  reset() {
    this.gameState = 'menu';
    this.score = 0;
    this.gameSpeed = 8;
    this.obstacles = [];
    this.player.y = this.height - 100;
    this.player.velocityY = 0;
    this.player.grounded = false;
    this.player.rotation = 0;
    this.player.trail = [];
  }
  
  createJumpParticles() {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        life: 15,
        color: this.colors.neonCyan,
        size: Math.random() * 4 + 2
      });
    }
  }
  
  createExplosion() {
    const colors = [this.colors.neonPink, this.colors.neonCyan, this.colors.neonGreen, this.colors.neonYellow];
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = Math.random() * 6 + 3;
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3
      });
    }
  }
  
  update() {
    this.pulsePhase += 0.05;
    this.gridOffset = (this.gridOffset + (this.gameState === 'playing' ? this.gameSpeed : 2)) % 40;
    
    for (let i = this.backgroundParticles.length - 1; i >= 0; i--) {
      const p = this.backgroundParticles[i];
      p.x -= p.speed * (this.gameState === 'playing' ? 1.5 : 0.5);
      if (p.x < -10) {
        p.x = this.width + 10;
        p.y = Math.random() * this.height;
      }
    }
    
    if (this.gameState !== 'playing') return;
    
    this.player.trail.unshift({ x: this.player.x, y: this.player.y, rotation: this.player.rotation });
    if (this.player.trail.length > 8) {
      this.player.trail.pop();
    }
    
    this.player.velocityY += this.gravity;
    this.player.y += this.player.velocityY;
    
    if (!this.player.grounded) {
      this.player.rotation += 8;
    }
    
    if (this.player.y + this.player.height >= this.groundY) {
      this.player.y = this.groundY - this.player.height;
      this.player.velocityY = 0;
      this.player.grounded = true;
      this.player.rotation = Math.round(this.player.rotation / 90) * 90;
    } else {
      this.player.grounded = false;
    }
    
    this.gameSpeed += this.speedIncrement;
    
    this.obstacleSpawnRate++;
    if (this.obstacleSpawnRate > this.obstacleSpawnThreshold) {
      this.spawnObstacle();
      this.obstacleSpawnRate = 0;
      this.obstacleSpawnThreshold = Math.max(60, 100 - this.score * 0.08);
    }
    
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.gameSpeed;
      
      if (obs.type === 'saw') {
        obs.rotation = (obs.rotation || 0) + 10;
      }
      
      if (this.checkCollision(this.player, obs)) {
        this.gameState = 'gameover';
        this.createExplosion();
        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem('gd_highscore', this.highScore.toString());
        }
      }
      
      if (obs.x + obs.width < 0) {
        this.obstacles.splice(i, 1);
        this.score += 10;
      }
    }
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  spawnObstacle() {
    const types = ['spike', 'spike', 'spike', 'cube', 'doubleSpike', 'saw'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let obs;
    switch (type) {
      case 'spike':
        obs = {
          x: this.width,
          y: this.groundY - 35,
          width: 30,
          height: 35,
          type: 'spike'
        };
        break;
      case 'doubleSpike':
        obs = {
          x: this.width,
          y: this.groundY - 35,
          width: 55,
          height: 35,
          type: 'doubleSpike'
        };
        break;
      case 'cube':
        obs = {
          x: this.width,
          y: this.groundY - 35,
          width: 35,
          height: 35,
          type: 'cube'
        };
        break;
      case 'saw':
        obs = {
          x: this.width,
          y: this.groundY - 40,
          width: 40,
          height: 40,
          type: 'saw',
          rotation: 0
        };
        break;
    }
    
    this.obstacles.push(obs);
  }
  
  checkCollision(player, obs) {
    const shrink = 5;
    return player.x + shrink < obs.x + obs.width - shrink &&
           player.x + player.width - shrink > obs.x + shrink &&
           player.y + shrink < obs.y + obs.height - shrink &&
           player.y + player.height - shrink > obs.y + shrink;
  }
  
  drawGlow(x, y, radius, color) {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  
  drawPlayer() {
    const ctx = this.ctx;
    const p = this.player;
    
    for (let i = p.trail.length - 1; i >= 0; i--) {
      const t = p.trail[i];
      const alpha = (1 - i / p.trail.length) * 0.3;
      ctx.save();
      ctx.translate(t.x + p.width / 2, t.y + p.height / 2);
      ctx.rotate(t.rotation * Math.PI / 180);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.colors.neonCyan;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    
    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
    ctx.rotate(p.rotation * Math.PI / 180);
    
    this.drawGlow(0, 0, 25, 'rgba(0, 255, 255, 0.3)');
    
    let playerColor = this.colors.neonCyan;
    if (this.gameState === 'menu') playerColor = this.colors.neonPink;
    if (this.gameState === 'gameover') playerColor = '#FF0000';
    
    ctx.fillStyle = playerColor;
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
    
    ctx.strokeStyle = this.colors.neonGreen;
    ctx.lineWidth = 3;
    ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height / 2);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-4, -4, 8, 8);
    
    ctx.restore();
  }
  
  drawObstacle(obs) {
    const ctx = this.ctx;
    
    switch (obs.type) {
      case 'spike':
        this.drawGlow(obs.x + obs.width / 2, obs.y + obs.height / 2, 20, 'rgba(255, 0, 0, 0.3)');
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.fill();
        ctx.strokeStyle = '#FF6666';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
        
      case 'doubleSpike':
        this.drawGlow(obs.x + obs.width / 2, obs.y + obs.height / 2, 25, 'rgba(255, 0, 0, 0.3)');
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(obs.x + 15, obs.y);
        ctx.lineTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + 30, obs.y + obs.height);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(obs.x + 40, obs.y);
        ctx.lineTo(obs.x + 25, obs.y + obs.height);
        ctx.lineTo(obs.x + 55, obs.y + obs.height);
        ctx.fill();
        ctx.strokeStyle = '#FF6666';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
        
      case 'cube':
        this.drawGlow(obs.x + obs.width / 2, obs.y + obs.height / 2, 22, 'rgba(255, 215, 0, 0.3)');
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height / 2);
        break;
        
      case 'saw':
        ctx.save();
        ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
        ctx.rotate((obs.rotation || 0) * Math.PI / 180);
        this.drawGlow(0, 0, 25, 'rgba(191, 0, 255, 0.3)');
        ctx.fillStyle = this.colors.neonPurple;
        const teeth = 8;
        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
          const angle = (i / teeth) * Math.PI * 2;
          const outerRadius = obs.width / 2;
          const innerRadius = obs.width / 3;
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
    }
  }
  
  draw() {
    const ctx = this.ctx;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#1a0a2e');
    gradient.addColorStop(1, '#0a1e3e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.1)';
    ctx.lineWidth = 1;
    for (let x = -this.gridOffset; x < this.width + 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    
    for (const p of this.backgroundParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
    const groundGradient = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    groundGradient.addColorStop(0, `rgba(57, 255, 20, ${pulse})`);
    groundGradient.addColorStop(1, 'rgba(57, 255, 20, 0.1)');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
    
    ctx.fillStyle = this.colors.neonGreen;
    ctx.shadowColor = this.colors.neonGreen;
    ctx.shadowBlur = 10;
    ctx.fillRect(0, this.groundY, this.width, 3);
    ctx.shadowBlur = 0;
    
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / 30;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
    for (const obs of this.obstacles) {
      this.drawObstacle(obs);
    }
    
    this.drawPlayer();
    
    ctx.fillStyle = this.colors.neonGreen;
    ctx.shadowColor = this.colors.neonGreen;
    ctx.shadowBlur = 5;
    ctx.font = 'bold 18px "Press Start 2P", monospace';
    ctx.fillText(`SCORE: ${this.score}`, 20, 35);
    ctx.fillText(`BEST: ${this.highScore}`, 20, 60);
    ctx.fillText(`SPEED: ${this.gameSpeed.toFixed(1)}`, 20, 85);
    ctx.shadowBlur = 0;
    
    if (this.gameState === 'menu') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, this.width, this.height);
      
      ctx.shadowColor = this.colors.neonCyan;
      ctx.shadowBlur = 20;
      ctx.fillStyle = this.colors.neonCyan;
      ctx.font = 'bold 28px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GEOMETRY DASH', this.width / 2, 80);
      
      ctx.shadowColor = this.colors.neonPink;
      ctx.fillStyle = this.colors.neonPink;
      ctx.font = 'bold 14px "Press Start 2P", monospace';
      ctx.fillText('MINI EDITION', this.width / 2, 110);
      
      ctx.shadowColor = this.colors.neonGreen;
      ctx.fillStyle = this.colors.neonGreen;
      ctx.font = 'bold 14px "Press Start 2P", monospace';
      ctx.fillText('Click o Espacio para Jugar', this.width / 2, 180);
      
      ctx.fillStyle = this.colors.neonYellow;
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(`Intentos: ${this.attempts}`, this.width / 2, 220);
      ctx.fillText(`Mejor: ${this.highScore}`, this.width / 2, 245);
      
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }
    
    if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, this.width, this.height);
      
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#FF0000';
      ctx.font = 'bold 32px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.width / 2, 80);
      
      ctx.shadowColor = this.colors.neonCyan;
      ctx.fillStyle = this.colors.neonCyan;
      ctx.font = 'bold 16px "Press Start 2P", monospace';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, 130);
      
      if (this.score >= this.highScore && this.score > 0) {
        ctx.shadowColor = this.colors.neonYellow;
        ctx.fillStyle = this.colors.neonYellow;
        ctx.fillText('NEW BEST!', this.width / 2, 160);
      }
      
      ctx.shadowColor = this.colors.neonGreen;
      ctx.fillStyle = this.colors.neonGreen;
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.fillText('Click para Reintentar', this.width / 2, 210);
      
      ctx.fillStyle = this.colors.neonPurple;
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(`Intento #${this.attempts}`, this.width / 2, 245);
      
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }
  }
  
  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const gameCanvas = document.getElementById('geometry-dash-game');
  if (gameCanvas) {
    new GeometryDashGame(gameCanvas);
  }
});
