<table>
<tr>
<th>Message Type</th>
<th>Direction</th>
<th>When Sent</th>
<th>Payload Format</th>
<th>Description & Details</th>
</tr>

<tr>
<td><code>join</code></td>
<td>Client → Server</td>
<td>Once, when the player connects and starts a session</td>
<td>

```json
{
  "type": "join",
  "nickname": "PlayerName",
  "mode"?: "FFA" | "Death Match" | "Teams" | "Other"
}
```

</td>
<td>Registers a new player in the game. In future, the client can request a specific game mode, which will put him in specific room.</td>
</tr>

<tr>
<td><code>playerData</code></td>
<td>Server → Client</td>
<td>After a valid join request. Only sent to the joining client</td>
<td>

```json
{
  "type": "playerData",
  "id": "UUID",
  "nickname": "PlayerName",
  "width": number,
  "height": number
}
```

</td>
<td>Confirms successful join, sends back unique ID and nickname for reference.</td>
</tr>

<tr>
<td><code>input</code></td>
<td>Client → Server</td>
<td>Whenever user moves the mouse</td>
<td>

```json
{
  "type": "input",
  "direction": {
    "x": number,
    "y": number
  }
}
```

</td>
<td>Informs server of new movement direction vector. Note that for multiple blobs of the same player angle of movement may be different.</td>
</tr>

<tr>
<td><code>split</code></td>
<td>Client → Server</td>
<td>On keypress (e.g., spacebar)</td>
<td>

```json
{
  "type": "split"
}
```

</td>
<td>Triggers a “split” action (e.g., a blob divides and shoots forward). Needs special implementation on the server.</td>
</tr>

<tr>
<td><code>leave</code></td>
<td>Client → Server</td>
<td>On intentional player quit</td>
<td>

```json
{
  "type": "leave"
}
```

</td>
<td>Notifies the server that the player is leaving the game.</td>
</tr>

<tr>
<td><code>gameState</code></td>
<td>Server → Client</td>
<td>Every ~16ms (~60 FPS)</td>
<td>

```json
{
  "type": "gameState",
  "visiblePlayers": [
    {
      "id": player.id,
      "score": player.score,
      "cells": [
        {
          x: number,
          y: number,
          radius: number,
          color: "rgb(number, number, number)"
        }
      ]
    }
  ],
  fvisibleFood: [
    {
      x: number,
      y: number,
      radius: number,
      color: number
    }
  ],
  timestamp: number
}
```

</td>
<td>Broadcasts visible world state: player blobs, food positions, etc. Clients should extract their own blob data from the players list by matching their ID.</td>
</tr>

<tr>
<td><code>death</code></td>
<td>Server → Client</td>
<td>When a player dies</td>
<td>

```json
{
  "type": "death",
  "score": number
}
```

</td>
<td>Informs the client of their death and final score.</td>
</tr>

<tr>
<td><code>leaderboard</code></td>
<td>Server → Client</td>
<td>Every 1 second</td>
<td>

```json
{
  "type": "leaderboard",
  "topPlayers": [
    {
      "nickname": string,
      "score": number
    }
  ],
  "personal": {
    "rank": number,
    "score": number
  }
}
```

</td>
<td>Contains current top player data and the recipient’s personal rank and score.</td>
</tr>
</table>
