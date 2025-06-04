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
    <pre><code>{
  "type": "join",
  "nickname": "PlayerName",
  "mode"?: "FFA" | "Death Match" | "Teams" | "Other",
  "privateServer"?: true | UUID
}</code></pre>
  </td>
  <td>Registers a new player in the game. Client can request a specific game mode.
    <br/><span style="color:#d4ac0d"><b>🧪 Beta:</b></span> The <code>private</code> flag enables creation or joining of a private server. If an <code>id</code> is provided, attempts to join it; otherwise, a new room will be created.
  </td>
</tr>

<tr>
  <td><code>playerData</code></td>
  <td>Server → Client</td>
  <td>After a valid join request. Only sent to the joining client</td>
  <td>
    <pre><code>{
  "type": "playerData",
  "id": "UUID",
  "nickname": "PlayerName",
  "width": number,
  "height": number,
  "roomId": UUID
}</code></pre>
  </td>
  <td>Confirms successful join, sends back unique ID and nickname for reference.
    <br/><span style="color:#d4ac0d"><b>🧪 Beta:</b></span> Return <code>roomId</code> so it can be displayed to players.
  </td>
</tr>

<tr>
  <td><code>input</code></td>
  <td>Client → Server</td>
  <td>Whenever user moves the mouse</td>
  <td>
    <pre><code>{
  "type": "input",
  "direction": {
    "x": number,
    "y": number
  }
}</code></pre>
  </td>
  <td>Informs server of movement vector. Each blob may react differently.</td>
</tr>

<tr>
  <td><code>split</code></td>
  <td>Client → Server</td>
  <td>On keypress (e.g., spacebar)</td>
  <td>
    <pre><code>{
  "type": "split"
}</code></pre>
  </td>
  <td>Triggers a blob split and shoot-forward action.</td>
</tr>

<tr>
  <td><code><span style="color:#d4ac0d">speedup</span></code></td>
  <td>Client → Server</td>
  <td>On key down and key up of speed key (e.g., Shift)</td>
  <td>
    <pre><code>{
  "type": "speedup",
  "active": boolean
}</code></pre>
  </td>
  <td><span style="color:#d4ac0d"><b>🧪 Beta:</b></span> Requests temporary speed boost. "active: true" starts the boost, "false" stops it. Server validates & consumes points.</td>
</tr>

<tr>
  <td><code>leave</code></td>
  <td>Client → Server</td>
  <td>On intentional player quit</td>
  <td>
    <pre><code>{
  "type": "leave"
}</code></pre>
  </td>
  <td>Notifies the server that the player is leaving the game.</td>
</tr>

<tr>
  <td><code>gameState</code></td>
  <td>Server → Client</td>
  <td>Every ~16ms (~60 FPS)</td>
  <td>
    <pre><code>{
  "type": "gameState",
  "visiblePlayers": [
    {
      "id": "UUID",
      "score": number,
      "cells": [
        {
          "x": number,
          "y": number,
          "radius": number,
          "color": "rgb(...)"
        }
      ],
      "abilities"?: {
        "speed": number (0 - 5)
      }
    }
  ],
  "visibleFood": [
    {
      "x": number,
      "y": number,
      "radius": number,
      "color": number,
      "type"?: "normal" | "speed" | "shield" | "unknown"
    }
  ],
  "timestamp": number
}</code></pre>
  </td>
  <td>World state updates.
    <br/><span style="color:#d4ac0d"><b>🧪 Beta:</b></span> Optional <code>abilities</code> field appears for players with special powers (e.g., speed boost).
    <br/><span style="color:#d4ac0d"><b>🧪 Beta:</b></span> <code>type</code> in food shows if it grants special effects.
  </td>
</tr>

<tr>
  <td><code>death</code></td>
  <td>Server → Client</td>
  <td>When a player dies</td>
  <td>
    <pre><code>{
  "type": "death",
  "score": number
}</code></pre>
  </td>
  <td>Informs the client of their death and final score.</td>
</tr>

<tr>
  <td><code>leaderboard</code></td>
  <td>Server → Client</td>
  <td>Every 1 second</td>
  <td>
    <pre><code>{
  "type": "leaderboard",
  "topPlayers": [
    { "nickname": string, "score": number }
  ],
  "personal": {
    "rank": number,
    "score": number
  }
}</code></pre>
  </td>
  <td>Current top players and the client's own stats.</td>
</tr>
</table>
