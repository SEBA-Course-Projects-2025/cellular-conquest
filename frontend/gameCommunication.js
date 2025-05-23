import {
  handleDeath,
  handleGameState,
  handleLeaderboard,
  handlePlayerData,
} from "./gameLogic.js";
import gameState from "./gameState.js";

const ENDPOINT = "ws://localhost:8080";
let socket;

export const connectToServer = () => {
  socket = new WebSocket(ENDPOINT);

  socket.onopen = () => {
    console.log("Connected to server");
    gameState.connected = true;

    socket.send(
      JSON.stringify({
        type: "join",
        nickname: gameState.playerName,
        mode: "ffa",
      })
    );
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case "playerData":
        handlePlayerData(message);
        break;
      case "gameState":
        handleGameState(message);
        break;
      case "death":
        handleDeath(message);
        break;
      case "leaderboard":
        handleLeaderboard(message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  };

  socket.onclose = () => {
    console.log("Disconnected from server");
    gameState.connected = false;

    setTimeout(connectToServer, 3000);
  };

  socket.onerror = (error) => {
    console.error("Websocket error:", error);
  };
};

export const sendInput = (mousePosition) => {
  if (!gameState.connected || !gameState.playerId || gameState.inactive) return;

  const player = gameState.players.find((p) => p.id === gameState.playerId);
  if (!player || player.cells.length === 0) return;

  const playerCell = player.cells[0];
  const dx = mousePosition.x - playerCell.x;
  const dy = mousePosition.y - playerCell.y;

  const length = Math.sqrt(dx * dx + dy * dy);
  const normalizedDx = length > 0 ? dx / length : 0;
  const normalizedDy = length > 0 ? dy / length : 0;

  socket.send(
    JSON.stringify({
      type: "input",
      direction: { x: normalizedDx, y: normalizedDy },
    })
  );
};

export const sendLeaveMessage = () => {
  if (gameState.connected && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "leave",
      })
    );
  }
};

export const sendSplitMessage = () => {
  if (gameState.connected && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "split",
      })
    );
  }
};
