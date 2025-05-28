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
    // private Timer? leaderboardTimer;


    public async Task StartServer()
    {
        // httpListener.Prefixes.Add("http://localhost:8080/");
        httpListener.Prefixes.Add("http://+:8080/");
        httpListener.Start();
        Console.WriteLine("Server started on ws://localhost:8080");
        
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