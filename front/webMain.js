document.addEventListener('DOMContentLoaded', function() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    let selectedMode = 'ffa'; 
    
    modeButtons.forEach(button => {
      button.addEventListener('click', function() {
        modeButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        selectedMode = this.dataset.mode;
        playSound('click');
      });
    });
    
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
      button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        playSound('hover');
      });
      
      button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
    
    document.getElementById('settingsBtn').addEventListener('click', function() {
      playSound('click');
      alert('Settings panel will open here');
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
      playSound('click');
      if (confirm('Are you sure you want to log out?')) {
        document.body.style.opacity = '0';
        setTimeout(() => {
          alert('Logged out successfully');
          document.body.style.opacity = '1';
        }, 500);
      }
    });
    
    createParticles();
    
    const nickname = document.querySelector('.nick').textContent;
    const avatar = document.querySelector('.avatar');
    avatar.textContent = nickname.charAt(0).toUpperCase();
    
    function playSound(type) {
      console.log(`Playing ${type} sound`);
    }
    
    function createParticles() {
      const particleCount = window.innerWidth < 600 ? 30 : 50;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 5 + 1;
        const posX = Math.random() * window.innerWidth;
        const posY = Math.random() * window.innerHeight;
        const opacity = Math.random() * 0.5 + 0.1;
        const duration = Math.random() * 20 + 10;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        particle.style.opacity = opacity;
        particle.style.animation = `float ${duration}s linear infinite`;
        
        particle.style.animationDelay = `${Math.random() * 20}s`;
        
        document.body.appendChild(particle);
      }
      
      const style = document.createElement('style');
      style.textContent = `
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: ${Math.random() * 0.5 + 0.1};
          }
          50% {
            transform: translateY(-100px) translateX(50px);
            opacity: ${Math.random() * 0.3 + 0.1};
          }
          100% {
            transform: translateY(-200px) translateX(0);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    const levelElement = document.querySelector('.level');
    let currentLevel = parseInt(levelElement.textContent.replace('Level ', ''));
    
    setTimeout(() => {
      levelUp();
    }, 5000);
    
    function levelUp() {
      currentLevel++;
      levelElement.textContent = `Level ${currentLevel}`;
      
      levelElement.classList.add('level-up');
      
      setTimeout(() => {
        levelElement.classList.remove('level-up');
      }, 1000);
    }
    
    const levelUpStyle = document.createElement('style');
    levelUpStyle.textContent = `
      .level-up {
        animation: levelUp 0.5s ease-out;
      }
      
      @keyframes levelUp {
        0% { transform: scale(1); color: var(--text-secondary); }
        50% { transform: scale(1.3); color: var(--accent); }
        100% { transform: scale(1); color: var(--text-secondary); }
      }
    `;
    document.head.appendChild(levelUpStyle);
  });