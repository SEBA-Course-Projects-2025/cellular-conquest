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
    private ConcurrentDictionary<Guid, Player> visiblePlayers = new();
    private HttpListener httpListener = new();
    private List<Food> foodItems = new();
    private Random rng = new();
    private const int WorldWidth = 2000;
    private const int WorldHeight = 2000;
    private const float PlayerSpeed = 150f;
    private Timer? gameLoopTimer;
    private Timer? leaderboardTimer;


    public async Task StartServer()
    {
        // httpListener.Prefixes.Add("http://localhost:8080/");
        httpListener.Prefixes.Add("http://+:8080/");
        httpListener.Start();
        Console.WriteLine("Server started on ws://localhost:8080");
        
        SpawnFood(100);

        gameLoopTimer = new Timer(SendGameState, null, 0, 1000 / 60);
        leaderboardTimer = new Timer(async _ => await SendLeaderboardAsync(), null, 0, 1000); // every 1s

        while (true)
        {
            var context = await httpListener.GetContextAsync();
            if (context.Request.IsWebSocketRequest)
                _ = HandleConnection(context);
            else
                context.Response.StatusCode = 400;
        }
    }
   
    private void SpawnFood(int count)
    {
        for (int i = 0; i < count; i++)
        {
			bool isBoost = rng.NextDouble() < 0.1;
            foodItems.Add(new Food
            {
                Position = new Vector2(rng.Next(0, WorldWidth), rng.Next(0, WorldHeight)),
                Radius = isBoost ? 9f : 5f,
                Color = isBoost ? "#00cfff" : "#3dda83",
            	IsSpeedBoost = isBoost
            });
        }
    }

    private async Task SendLeaderboardAsync()
    {
        var playersList = visiblePlayers.Values.ToList();
        
        var topPlayers = playersList
            .OrderByDescending(p => p.Score)
            .Take(10)
            .Select(p => new {
                nickname = p.Nickname,
                score = p.Score
            }).ToList();

        foreach (var player in playersList) {
            if (player.Socket?.State != WebSocketState.Open)
                continue;

            int rank = playersList
                .OrderByDescending(p => p.Score)
                .ToList()
                .FindIndex(p => p.Id == player.Id) + 1;

            var leaderboard = new {
                type = "leaderboard",
                topPlayers = topPlayers,
                personal = new
                {
                    rank = rank,
                    score = player.Score
                }
            };

            try {
                await SendJson(player, leaderboard);
            }
            catch (Exception ex) {
                Console.WriteLine($"Error sending leaderboard to {player.Nickname}: {ex.Message}");
            }
        }
    }


    private async Task SendJson(Player player, object data) {
        var json = JsonSerializer.Serialize(data);
        var buffer = Encoding.UTF8.GetBytes(json);

        await player.SendLock.WaitAsync();
        try {
            if (player.Socket != null && player.Socket.State == WebSocketState.Open) {
                await player.Socket.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }
        finally {
            player.SendLock.Release();
        }
    }
}