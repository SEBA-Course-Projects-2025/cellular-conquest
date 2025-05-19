import { sendInput } from "./gameCommunication.js";
import gameState from "./gameState.js";

export const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
export const playerNameElement = document.getElementById("playerName");
export const playerScoreElement = document.getElementById("playerScore");
export const leaderboardList = document.getElementById("leaderboardList");
export const exitPopup = document.getElementById("exitPopup");
export const cancelExitBtn = document.getElementById("cancelExit");
export const confirmExitBtn = document.getElementById("confirmExit");

export const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

export const render = () => {
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(gameState.camera.scale, gameState.camera.scale);
  ctx.translate(-gameState.camera.x, -gameState.camera.y);

  drawGrid();

  for (const food of gameState.food) {
    drawCircle(food.x, food.y, food.radius, food.color);
  }

  for (const player of gameState.players) {
    for (const cell of player.cells) {
      drawCircle(cell.x, cell.y, cell.radius, cell.color);
    }

    if (player.cells.length > 0) {
      const cell = player.cells[0];
      drawText(
        player.nickname,
        cell.x,
        cell.y,
        16 / gameState.camera.scale,
        "white"
      );
    }
  }

  ctx.restore();
};

export const drawCircle = (x, y, radius, fillColor, borderColor) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = borderColor;
  ctx.fill();
  ctx.stroke();
};

export const drawText = (text, x, y, size, color) => {
  ctx.font = `${size}px Inter`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
};

// todo: update protocol to include worldSize as PlayerData
export const drawGrid = (worldSize = { width: 2000, height: 2000 }) => {
  const gridSize = 50;
  const lineColor = "rgb(15, 66, 85)";

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;

  const startX =
    Math.floor(
      (gameState.camera.x - canvas.width / 2 / gameState.camera.scale) /
        gridSize
    ) * gridSize;
  const endX =
    Math.ceil(
      (gameState.camera.x + canvas.width / 2 / gameState.camera.scale) /
        gridSize
    ) * gridSize;
  const startY =
    Math.floor(
      (gameState.camera.y - canvas.height / 2 / gameState.camera.scale) /
        gridSize
    ) * gridSize;
  const endY =
    Math.ceil(
      (gameState.camera.y + canvas.height / 2 / gameState.camera.scale) /
        gridSize
    ) * gridSize;

  // vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    if (x < 0 || x > worldSize.width) continue;
    ctx.beginPath();
    ctx.moveTo(x, Math.max(0, startY));
    ctx.lineTo(x, Math.min(worldSize.height, endY));
    ctx.stroke();
  }

  // horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    if (y < 0 || y > worldSize.height) continue;
    ctx.beginPath();
    ctx.moveTo(Math.max(0, startX), y);
    ctx.lineTo(Math.min(worldSize.width, endX), y);
    ctx.stroke();
  }
};

export function handleKeyDown(event) {
  if (event.key === "Escape") {
    gameState.inactive = !gameState.inactive;
    if (gameState.inactive) exitPopup.classList.remove("hidden");
    else exitPopup.classList.add("hidden");
  }
}

export const handleMouseMove = (event) => {
  const rect = canvas.getBoundingClientRect();
  const screenX = event.clientX - rect.left;
  const screenY = event.clientY - rect.top;

  const worldX =
    gameState.camera.x + (screenX - canvas.width / 2) / gameState.camera.scale;
  const worldY =
    gameState.camera.y + (screenY - canvas.height / 2) / gameState.camera.scale;

  sendInput({ x: worldX, y: worldY });
};

export const hideExitPopup = () => {
  exitPopup.classList.add("hidden");
  gameState.inactive = false;
};
