const defaultWorldSize = 2000;

const state = {
  playerName: localStorage.getItem("playerName") || "YourNickname",
  playerId: null,
  playerScore: 0,
  worldSize: { width: defaultWorldSize, height: defaultWorldSize },
  players: [],
  food: [],
  lastTimestamp: null,
  dt: null,
  inactive: false,
  connected: false,
  camera: { x: defaultWorldSize / 2, y: defaultWorldSize / 2, scale: 1 },
};

export default state;
