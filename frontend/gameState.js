const state = {
  playerName: localStorage.getItem("playerName") || "YourNickname",
  playerId: null,
  playerScore: 0,
  players: [],
  food: [],
  lastTimestamp: null,
  dt: null,
  inactive: false,
  connected: false,
  camera: { x: 0, y: 0, scale: 1 },
};

export default state;
