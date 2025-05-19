import gameState from "./gameState.js";
import {
  leaderboardList,
  playerNameElement,
  playerScoreElement,
  render,
} from "./gameUI.js";

export const gameLoop = () => {
  const dt = gameState.dt;

  render(dt);

  requestAnimationFrame(gameLoop);
};

export const handlePlayerData = (data) => {
  gameState.playerId = data.id;
  gameState.playerName = data.nickname;
  playerNameElement.textContent = gameState.playerName;

  console.log(`Joined as ${gameState.playerName} (ID: ${gameState.playerId})`);
};

export const handleGameState = (data) => {
  gameState.players = data.visiblePlayers;
  gameState.food = data.visibleFood;
  gameState.dt = data.timestamp - gameState.lastTimestamp;
  gameState.lastTimestamp = data.timestamp;

  const player = gameState.players.find((p) => p.id === gameState.playerId);
  if (player) {
    gameState.playerScore = player.score;
    playerScoreElement.textContent = `Score: ${Math.floor(
      gameState.playerScore
    )}`;

    if (player.cells.length > 0) {
      let centerX = 0,
        centerY = 0;
      for (const cell of player.cells) {
        centerX += cell.x;
        centerY += cell.y;
      }
      gameState.camera.x = centerX / player.cells.length;
      gameState.camera.y = centerY / player.cells.length;

      gameState.camera.scale = Math.max(
        0.5,
        Math.min(1, 300 / gameState.playerScore)
      );
    }
  }
};

export const handleLeaderboard = (data) => {
  leaderboardList.innerHTML = "";

  const sortedPlayers = data.topPlayers;

  for (let i = 0; i < Math.min(10, sortedPlayers.length); i++) {
    const player = sortedPlayers[i];
    const li = document.createElement("li");
    li.textContent = `${player.nickname}: ${Math.floor(player.score)}`;

    if (i === data.personal.rank - 1) {
      li.classList.add("special");
    }

    leaderboardList.appendChild(li);
  }

  if (data.personal.rank > sortedPlayers.length) {
    const li = document.createElement("li");
    li.textContent = `${gameState.playerName}: ${Math.floor(
      gameState.playerScore
    )}`;
    li.classList.add("special");
    li.value = data.personal.rank;
    leaderboardList.appendChild(li);
  }
};

export const handleDeath = (data) => {
  gameState.playerScore = data.score;
  console.log(`${gameState.playerName} has died.`);

  localStorage.setItem("lastScore", Math.floor(gameState.playerScore));

  setTimeout(() => {
    window.location.href = "index.html";
  }, 2000);

  // todo: gradual blur
};
