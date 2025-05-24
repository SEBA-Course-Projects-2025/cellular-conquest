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

public class Game
{
    private ConcurrentDictionary<Guid, Player> visiblePlayers = new();
    private HttpListener httpListener = new();
    private List<Food> foodItems = new();
    private Random rng = new();
    private const int WorldWidth = 2000;
    private const int WorldHeight = 2000;
    private const float PlayerSpeed = 150f;
    private Timer? gameLoopTimer;

    public async Task StartServer()
{
    try
    {
        httpListener.Prefixes.Add("http://*:8080/");
        httpListener.Prefixes.Add("http://0.0.0.0:8080/");
        httpListener.Prefixes.Add("http://localhost:8080/");
        httpListener.Start();
        Console.WriteLine("Server started on ws://0.0.0.0:8080");
    }
    catch (Exception ex)
    {
        Console.WriteLine("FAILED TO START SERVER: " + ex.Message);
        return;
    }

    SpawnFood(100);

    gameLoopTimer = new Timer(SendGameState, null, 0, 1000 / 60);

    while (true)
    {
        var context = await httpListener.GetContextAsync();
        if (context.Request.IsWebSocketRequest)
            _ = HandleConnection(context);
        else
            context.Response.StatusCode = 400;
    }
}


    private async Task HandleConnection(HttpListenerContext context)
    {
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

                        var joinResponse = new
                        {
                            type = "playerData",
                            id = player.Id,
                            nickname = player.Nickname
                        };
                        await SendJson(webSocket, joinResponse);
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
   private async void SendGameState(object? state)
    {
        var deltaTime = 1f / 60f;
        var eatenCells = new List<(Player victim, Cell cell)>();

        foreach (var player in visiblePlayers.Values)
        {
            foreach (var cell in player.Cells)
            {
                cell.Position += player.Direction * PlayerSpeed * deltaTime;
                cell.Position = Vector2.Clamp(cell.Position, Vector2.Zero, new Vector2(WorldWidth, WorldHeight));
                
                cell.Position += cell.Velocity * deltaTime;
                cell.Velocity *= 0.9f;
            }      
        }
        
        foreach (var player in visiblePlayers.Values)
        {
            var eaten = new List<Food>();
            foreach (var cell in player.Cells)
            {
                foreach (var food in foodItems)
                {
                    if (Vector2.Distance(cell.Position, food.Position) < cell.Radius)
                    {
                        player.Score += 10;
                        eaten.Add(food);
                        
                        float currentArea = MathF.PI * cell.Radius * cell.Radius;
                        float foodArea = MathF.PI * food.Radius * food.Radius;
                        float newArea = currentArea + foodArea;
                        cell.Radius = MathF.Sqrt(newArea / MathF.PI);
                        
                        break;
                    }
                }
            }

            foreach (var food in eaten)
            {
                foodItems.Remove(food);
                foodItems.Add(new Food
                {
                    Position = new Vector2(rng.Next(0, WorldWidth), rng.Next(0, WorldHeight)),
                    Radius = 5f,
                    Color = "#3dda83"
                });
            }
        }
        
        foreach (var hunter in visiblePlayers.Values)
        {
            foreach (var prey in visiblePlayers.Values)
            {
                if (hunter.Id == prey.Id) continue; 

                foreach (var hunterCell in hunter.Cells)
                {
                    foreach (var preyCell in prey.Cells)
                    {
                        float distance = Vector2.Distance(hunterCell.Position, preyCell.Position);
                        if (hunterCell.Radius > preyCell.Radius * 1.1f && distance < hunterCell.Radius)
                        {
                            float hunterArea = MathF.PI * hunterCell.Radius * hunterCell.Radius;
                            float preyArea = MathF.PI * preyCell.Radius * preyCell.Radius;
                            float newArea = hunterArea + preyArea;
                            hunterCell.Radius = MathF.Sqrt(newArea / MathF.PI);
                            hunter.Score += (int)(preyCell.Radius); 

                            eatenCells.Add((prey, preyCell));
                        }
                    }
                }
            }
        }
        
        foreach (var (victim, cell) in eatenCells)
        {
            victim.Cells.Remove(cell);

            if (victim.Cells.Count == 0)
            {
                visiblePlayers.TryRemove(victim.Id, out _);
                Console.WriteLine($"{victim.Nickname} was eaten.");
            }
        }

        var visibleFood = foodItems.Select(f => new
        {
            x = f.Position.X,
            y = f.Position.Y,
            radius = f.Radius,
            color = f.Color
        }).ToList();

        var visiblePlayersList = visiblePlayers.Values.Select(p => new
        {
            id = p.Id,
            nickname = p.Nickname,
            score = p.Score,
            cells = p.Cells.Select(c => new {
                x = c.Position.X,
                y = c.Position.Y,
                radius = c.Radius,
                color = "#3d78dd"
            }).ToList()
        }).ToList();

        var gameState = new
        {
            type = "gameState",
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            visiblePlayers = visiblePlayersList,
            visibleFood = visibleFood
        };

        var json = JsonSerializer.Serialize(gameState);
        var buffer = Encoding.UTF8.GetBytes(json);

        foreach (var player in visiblePlayers.Values)
        {
            if (player?.Socket?.State == WebSocketState.Open)
            {
                await player.Socket.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }
    }

    private void SpawnFood(int count)
    {
        for (int i = 0; i < count; i++)
        {
            foodItems.Add(new Food
            {
                Position = new Vector2(rng.Next(0, WorldWidth), rng.Next(0, WorldHeight)),
                Radius = 5f,
                Color = "#3dda83"
            });
        }
    }

    private async Task SendJson(WebSocket socket, object data)
    {
        if (socket.State != WebSocketState.Open) return;

        var json = JsonSerializer.Serialize(data);
        var bytes = Encoding.UTF8.GetBytes(json);
        await socket.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
    }
}