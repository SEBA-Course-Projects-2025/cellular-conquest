import { sendInput, sendSplitMessage } from "./gameCommunication.js";
import gameState from "./gameState.js";

export const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
export const playerNameElement = document.getElementById("playerName");
export const playerScoreElement = document.getElementById("playerScore");
export const leaderboardList = document.getElementById("leaderboardList");
export const exitPopup = document.getElementById("exitPopup");
export const cancelExitBtn = document.getElementById("cancelExit");
export const confirmExitBtn = document.getElementById("confirmExit");
let currentScale = gameState.camera.scale;
let lastRenderTime = performance.now();
const lerp = (start, end, t) => start + (end - start) * t;

export const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

export const render = () => {
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  ctx.translate(canvas.width / 2, canvas.height / 2);
  const now = performance.now();
  const deltaTime = (now - lastRenderTime) / 1000;
  lastRenderTime = now;

  const smoothingSpeed = 5;
  if (Math.abs(currentScale - gameState.camera.scale) > 0.001) {
    currentScale = lerp(
      currentScale,
      gameState.camera.scale,
      1 - Math.exp(-smoothingSpeed * deltaTime)
    );
  }

  ctx.scale(currentScale, currentScale);
  ctx.translate(-gameState.camera.x, -gameState.camera.y);

  drawGrid();

  for (const food of gameState.food) {
    drawCircle(food.x, food.y, food.radius, food.color);
  }

  for (const player of gameState.players) {
    for (const cell of player.cells) {
      drawWavyBlob(
        cell.x,
        cell.y,
        cell.radius,
        cell.color,
        Date.now(),
        player.id
      );
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
  } else if (event.key === " ") {
    sendSplitMessage();
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

const blobCache = new Map();

function getMiddlePoint(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

function drawWavyBlob(x, y, radius, color, timestamp, blobId) {
  const points = Math.max(8, Math.min(16, Math.floor(radius / 10)));
  const wobbleAmount = radius * 0.04;
  const wobbleSpeed = 0.008;

  let controlPoints = blobCache.get(blobId);

  if (!controlPoints) {
    controlPoints = [];
    const angleStep = (Math.PI * 2) / points;

    for (let i = 0; i < points; i++) {
      const angle = i * angleStep;
      const phaseOffset = Math.random() * Math.PI * 2;

      controlPoints.push({
        baseX: Math.cos(angle),
        baseY: Math.sin(angle),
        phaseOffset: phaseOffset,
        wobbleFreq: 0.9 + Math.random() * 0.2,
      });
    }

    blobCache.set(blobId, controlPoints);
  }

  for (let i = 0; i < controlPoints.length; i++) {
    const point = controlPoints[i];

    const wobble =
      Math.sin(timestamp * wobbleSpeed * point.wobbleFreq + point.phaseOffset) *
      wobbleAmount;
    const adjustedRadius = radius + wobble;

    point.x = x + adjustedRadius * point.baseX;
    point.y = y + adjustedRadius * point.baseY;
  }

  ctx.fillStyle = color;
  ctx.beginPath();

  if (controlPoints.length > 0) {
    const firstMidpoint = getMiddlePoint(
      controlPoints[controlPoints.length - 1],
      controlPoints[0]
    );
    ctx.moveTo(firstMidpoint.x, firstMidpoint.y);

    for (let i = 0; i < controlPoints.length; i++) {
      const current = controlPoints[i];
      const next = controlPoints[(i + 1) % controlPoints.length];
      const midPoint = getMiddlePoint(current, next);

      ctx.quadraticCurveTo(current.x, current.y, midPoint.x, midPoint.y);
    }
  }

  ctx.closePath();
  ctx.fill();
}
