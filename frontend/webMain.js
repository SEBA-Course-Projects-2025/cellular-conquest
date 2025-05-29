const API_BASE = "/api/player";

document.addEventListener("DOMContentLoaded", function () {
  document.querySelector(".wrapper").style.display = "none";
  const loginScreen = document.getElementById("loginScreen");
  const nicknameInput = document.getElementById("nicknameInput");
  if (localStorage.getItem("playerName")) {
    nicknameInput.placeholder = localStorage.getItem("playerName");
  }
  const loginBtn = document.getElementById("loginBtn");
  let socket = null;
  let nickname = "";

  loginBtn.addEventListener("click", tryLogin);
  nicknameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryLogin();
  });

  function tryLogin() {
    nickname = nicknameInput.value.trim() || localStorage.getItem("playerName");
    if (!nickname) {
      alert("Please enter a nickname!");
      nicknameInput.focus();
      return;
    }
    localStorage.setItem("playerName", nickname);
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
        const nicknameValue =
          nicknameInput.value.trim() ||
          document.querySelector(".nick").textContent;
        if (!nicknameValue || nicknameValue === "Nickname") {
          alert("Please enter a nickname and click Join Game first!");
          return;
        }
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
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "leave" }));
        socket.close();
      }
      document.querySelector(".wrapper").style.display = "none";
      loginScreen.style.display = "block";
      nicknameInput.value = "";
    }
  });

  function playSound(type) {
    console.log(`Playing ${type} sound`);
  }
});
