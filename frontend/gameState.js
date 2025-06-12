const defaultWorldSize = 2000;

const state = {
  playerName: localStorage.getItem("playerName") || "YourNickname",
  playerId: null,
  playerScore: 0,
  roomId: null,
  worldSize: { width: defaultWorldSize, height: defaultWorldSize },
  players: [],
  food: [],
  lastTimestamp: null,
  dt: null,
  speedupActive: false,
  inactive: false,
  connected: false,
  camera: { x: defaultWorldSize / 2, y: defaultWorldSize / 2, scale: 1 },
};

export default state;
