using System;
using System.Numerics;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;


public partial class Game
{
    private async Task HandleConnection(HttpListenerContext context) {
        WebSocket webSocket = (await context.AcceptWebSocketAsync(null)).WebSocket;
        Console.WriteLine("New connection");

        Player? player = null;

        byte[] buffer = new byte[1024];
        while (webSocket.State == WebSocketState.Open)
        {
            try
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Close)
                    break;

                var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                var obj = JsonNode.Parse(json);
                string? type = obj?["type"]?.ToString();

                switch (type)
                {
                    case "join":
                        //Console.WriteLine("new player has joined");
                        player = new Player
                        {
                            Id = Guid.NewGuid(),
                            Nickname = obj?["nickname"]?.ToString() ?? "Anonymous",
                            Socket = webSocket,
                            Cells = new List<Cell> {
                                new Cell {
                                    Position = new Vector2(500, 500),
                                    Radius = 20f
                                }
                            }, 
                            Direction = Vector2.Zero,
                            Score = 0
                        };
                        visiblePlayers
                        [player.Id] = player;

                        //send playerData
                        var joinResponse = new
                        {
                            type = "playerData",
                            id = player.Id,
                            nickname = player.Nickname
                        };
                        await SendJson(player, joinResponse);
                        break;

                    case "input":
                        if (player != null)
                        {
                            float x = obj?["direction"]?["x"]?.GetValue<float>() ?? 0f;
                            float y = obj?["direction"]?["y"]?.GetValue<float>() ?? 0f;
                            player.Direction = new Vector2(x, y);
                        }
                        break;

                    case "split":
                        if (player != null && player.Cells.Count < 16)
                        {
                            var newCells = new List<Cell>();
                            foreach (var cell in player.Cells)
                            {
                                if (cell.Radius > 10f) 
                                {
                                    var splitRadius = cell.Radius / 1.414f; 
                                    var direction = Vector2.Normalize(player.Direction == Vector2.Zero ? new Vector2(1, 0) : player.Direction);
                                    var offset = direction * (splitRadius + 2);

                                    newCells.Add(new Cell
                                    {
                                        Position = cell.Position + offset,
                                        Radius = splitRadius,
                                        Velocity = direction * 200 
                                    });

                                    cell.Position -= offset;
                                    cell.Radius = splitRadius;
                                }
                            }
                            player.Cells.AddRange(newCells);
                        }
                        break;

                    case "leave":
                        if (player != null)
                        {
                            visiblePlayers.TryRemove(player.Id, out _);
                            Console.WriteLine($"Player {player.Nickname} left the game.");
                        }

                        await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Player left", CancellationToken.None);
                        return;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
                break;
            }
        }

        if (player != null)
            visiblePlayers.TryRemove(player.Id, out _);
            Console.WriteLine($"Player {player?.Nickname} disconnected.");
    }
}