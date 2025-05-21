const API_BASE = "/api/player";

document.addEventListener("DOMContentLoaded", function () {
  const modeButtons = document.querySelectorAll(".mode-btn");
  let selectedMode = "ffa";

  modeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      modeButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      selectedMode = this.dataset.mode;
      playSound("click");

      if (selectedMode === "ffa") {
        window.location.href = "gamePage.html";
      }
    });
  });

  const allButtons = document.querySelectorAll("button");
  allButtons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-3px)";
      playSound("hover");
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  document.getElementById("settingsBtn").addEventListener("click", function () {
    playSound("click");
    alert("Settings panel will open here");
  });

  document.getElementById("logoutBtn").addEventListener("click", function () {
    playSound("click");
    if (confirm("Are you sure you want to log out?")) {
      document.body.style.opacity = "0";
      setTimeout(() => {
        alert("Logged out successfully");
        document.body.style.opacity = "1";
      }, 500);
    }
  });

  createParticles();

  const nickname = document.querySelector(".nick")?.textContent || "Anonymous";
  const avatar = document.querySelector(".avatar");
  if (avatar) avatar.textContent = nickname.charAt(0).toUpperCase();

  const socket = new WebSocket("ws://localhost:8080");

  socket.addEventListener("open", () => {
    console.log("Connected to WebSocket server");
    socket.send(JSON.stringify({ type: "join", nickname }));
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "playerData") {
      console.log("Player data received:", data);
    } else if (data.type === "gameState") {
      updateGameState(data.players);
    }
  });

  socket.addEventListener("close", () => {
    console.log("Disconnected from WebSocket server");
  });

  socket.addEventListener("error", (err) => {
    console.error("WebSocket error:", err);
  });

  function sendPlayerInput(direction) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "input",
          direction: direction,
        })
      );
    }
  }

  function updateGameState(players) {
    players.forEach((player) => {
      let el = document.getElementById(player.id);
      if (!el) {
        el = document.createElement("div");
        el.id = player.id;
        el.className = "player";
        document.body.appendChild(el);
      }
      el.style.position = "absolute";
      el.style.left = player.position.x + "px";
      el.style.top = player.position.y + "px";
      el.textContent = `${player.nickname} (${player.score})`;
    });
  }

  let direction = { x: 0, y: 0 };
  window.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowUp":
        direction.y = -1;
        break;
      case "ArrowDown":
        direction.y = 1;
        break;
      case "ArrowLeft":
        direction.x = -1;
        break;
      case "ArrowRight":
        direction.x = 1;
        break;
    }
    sendPlayerInput(direction);
  });
  window.addEventListener("keyup", (e) => {
    switch (e.key) {
      case "ArrowUp":
      case "ArrowDown":
        direction.y = 0;
        break;
      case "ArrowLeft":
      case "ArrowRight":
        direction.x = 0;
        break;
    }
    sendPlayerInput(direction);
  });

  function playSound(type) {
    console.log(`Playing ${type} sound`);
  }

  function createParticles() {
    const particleCount = window.innerWidth < 600 ? 30 : 50;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.classList.add("particle");

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
      particle.style.position = "fixed";
      particle.style.borderRadius = "50%";
      particle.style.background = "white";
      particle.style.pointerEvents = "none";
      particle.style.animation = `float ${duration}s linear infinite`;
      particle.style.animationDelay = `${Math.random() * 20}s`;

      document.body.appendChild(particle);
    }

    const style = document.createElement("style");
    style.textContent = `
      @keyframes float {
        0% {
          transform: translateY(0) translateX(0);
          opacity: 0.5;
        }
        50% {
          transform: translateY(-100px) translateX(50px);
          opacity: 0.3;
        }
        100% {
          transform: translateY(-200px) translateX(0);
          opacity: 0;
        }
      }
      .player {
        background: #3498db;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: sans-serif;
        font-size: 12px;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
  }

  const levelElement = document.querySelector(".level");
  let currentLevel = levelElement
    ? parseInt(levelElement.textContent.replace("Level ", ""))
    : 1;

  setTimeout(() => {
    levelUp();
  }, 5000);

  function levelUp() {
    currentLevel++;
    if (levelElement) levelElement.textContent = `Level ${currentLevel}`;

    if (levelElement) levelElement.classList.add("level-up");

    setTimeout(() => {
      if (levelElement) levelElement.classList.remove("level-up");
    }, 1000);
  }

  const levelUpStyle = document.createElement("style");
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
