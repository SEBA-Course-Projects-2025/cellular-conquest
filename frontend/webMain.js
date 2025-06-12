const API_BASE = "/api/player";
document.addEventListener("DOMContentLoaded", function () {
  document.querySelector(".wrapper").style.display = "none";
  const loginScreen = document.getElementById("loginScreen");
  const nicknameInput = document.getElementById("nicknameInput");
  const loginBtn = document.getElementById("loginBtn");
  const roomCodeModal = document.getElementById("roomCodeModal");
  const closeModal = document.getElementById("closeModal");
  const createRoomBtn = document.getElementById("createRoomBtn");
  const joinRoomBtn = document.getElementById("joinRoomBtn");
  const roomCodeInput = document.getElementById("roomCodeInput");
  const createdRoomInfo = document.getElementById("createdRoomInfo");
  const displayRoomCode = document.getElementById("displayRoomCode");
  const copyCodeBtn = document.getElementById("copyCodeBtn");
  const startGameBtn = document.getElementById("startGameBtn");
  let socket = null;
  let nickname = "";
  let currentRoomId = null;
  loginBtn.addEventListener("click", tryLogin);
  nicknameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryLogin();
  });
  closeModal.addEventListener("click", () => {
    roomCodeModal.style.display = "none";
    resetModal();
  });
  window.addEventListener("click", (event) => {
    if (event.target === roomCodeModal) {
      roomCodeModal.style.display = "none";
      resetModal();
    }
  });
  createRoomBtn.addEventListener("click", createRoom);
  joinRoomBtn.addEventListener("click", joinRoom);
  copyCodeBtn.addEventListener("click", copyRoomCode);
  startGameBtn.addEventListener("click", startTeamsGame);
  roomCodeInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-F0-9-]/g, "");

    const isValidGuid = /^[A-F0-9]{8}-([A-F0-9]{4}-){3}[A-F0-9]{12}$/.test(e.target.value);
    
    console.log("Guid valid: ", isValidGuid);
    if (!isValidGuid) {
      // show warning, highlight input, etc.
    }
  });
  roomCodeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") joinRoom();
  });
  function tryLogin() {
    nickname = nicknameInput.value.trim();
    if (!nickname) {
      alert("Please enter a nickname!");
      nicknameInput.focus();
      return;
    }
    startGame(nickname);
  }
  function getWsHost() {
    const isLocal =
      location.hostname === "localhost" ||
      location.hostname.startsWith("192.168.") ||
      location.hostname === "127.0.0.1";
    return isLocal ? location.hostname + ":8080" : "161.35.75.14:8080";
  }
  function startGame(nick) {
    loginScreen.style.display = "none";
    document.querySelector(".wrapper").style.display = "block";
    document.querySelector(".nick").textContent = nick;
    document.querySelector(".avatar").textContent = nick
      .charAt(0)
      .toUpperCase();
    const wsHost = getWsHost();
    socket = new WebSocket("ws://" + wsHost);
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "join", nickname: nick }));
    });
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "playerData") {
        if (data.roomId) {
          currentRoomId = data.roomId;
        }
      } else if (data.type === "gameState") {
        updateGameState(data.visiblePlayers || data.players || []);
      } else if (data.type === "error") {
        alert(data.message || "An error occurred");
      }
    });
    socket.addEventListener("close", () => {
      alert("Disconnected from server");
      location.reload();
    });
    socket.addEventListener("error", (err) => {
      alert("WebSocket error!");
      console.error(err);
    });
  }
  function showRoomModal() {
    if (!nickname) {
      alert("Please enter a nickname and join the game first!");
      return;
    }
    roomCodeModal.style.display = "flex";
  }
  function resetModal() {
    createdRoomInfo.style.display = "none";
    roomCodeInput.value = "";
    displayRoomCode.textContent = "";
    currentRoomId = null;
  }
  function createRoom() {
    localStorage.setItem('privateRoomId', 'true');
    playSound("success");
    
    window.location.href = `gamePage.html`;
  }
  function joinRoom() {
    const roomCode = roomCodeInput.value.trim();
    if (!roomCode) {
      alert("Please enter a room code!");
      roomCodeInput.focus();
      return;
    }
    
    localStorage.setItem('privateRoomId', roomCode);
    playSound("success");
    
    window.location.href = `gamePage.html?nickname=${encodeURIComponent(
      nickname
    )}&mode=teams&roomId=${roomCode}`;
  }
  function copyRoomCode() {
    const code = displayRoomCode.textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        copyCodeBtn.textContent = "Copied!";
        setTimeout(() => {
          copyCodeBtn.textContent = "Copy";
        }, 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      copyCodeBtn.textContent = "Copied!";
      setTimeout(() => {
        copyCodeBtn.textContent = "Copy";
      }, 2000);
    }
    playSound("click");
  }
  function startTeamsGame() {
    if (!currentRoomId) {
      alert("No room selected!");
      return;
    }
    roomCodeModal.style.display = "none";
    resetModal();
    window.location.href = `gamePage.html?nickname=${encodeURIComponent(
      nickname
    )}&mode=teams&roomId=${currentRoomId}`;
  }
  const modeButtons = document.querySelectorAll(".mode-btn");
  let selectedMode = "ffa";
  modeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      modeButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      selectedMode = this.dataset.mode;
      playSound("click");
      if (selectedMode === "ffa") {
        // Clear private room ID when switching to FFA
        localStorage.removeItem('privateRoomId');
        const nicknameValue =
          nicknameInput.value.trim() ||
          document.querySelector(".nick").textContent;
        if (!nicknameValue || nicknameValue === "Nickname") {
          alert("Please enter a nickname and click Join Game first!");
          return;
        }
        window.location.href = `gamePage.html?nickname=${encodeURIComponent(
          nicknameValue
        )}`;
      } else if (selectedMode === "teams") {
        showRoomModal();
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
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "leave" }));
        socket.close();
      }
      // Clear private room ID on logout
      localStorage.removeItem('privateRoomId');
      document.querySelector(".wrapper").style.display = "none";
      loginScreen.style.display = "block";
      nicknameInput.value = "";
      resetModal();
    }
  });
  function updateGameState(players) {
    document.querySelectorAll(".player").forEach((el) => el.remove());
    players.forEach((player) => {
      const cell = player.cells && player.cells[0];
      let el = document.createElement("div");
      el.className = "player";
      el.style.position = "absolute";
      el.style.left = (cell?.x || player.position?.x || 0) + "px";
      el.style.top = (cell?.y || player.position?.y || 0) + "px";
      el.textContent = `${player.nickname} (${player.score})`;
      document.body.appendChild(el);
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
      default:
        return;
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
      default:
        return;
    }
    sendPlayerInput(direction);
  });
  function sendPlayerInput(direction) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "input", direction }));
    }
  }
  function playSound(type) {
    console.log(`Playing ${type} sound`);
  }
  createParticles();
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
        0%   { transform: translateY(0) translateX(0); opacity: 0.5; }
        50%  { transform: translateY(-100px) translateX(50px); opacity: 0.3; }
        100% { transform: translateY(-200px) translateX(0); opacity: 0; }
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
      0%   { transform: scale(1);   color: var(--text-secondary); }
      50%  { transform: scale(1.3); color: var(--accent); }
      100% { transform: scale(1);   color: var(--text-secondary); }
    }
  `;
  document.head.appendChild(levelUpStyle);
});