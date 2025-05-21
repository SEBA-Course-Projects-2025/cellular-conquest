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
    private Timer gameLoopTimer;

    public async Task StartServer()
    {
        httpListener.Prefixes.Add("http://localhost:8080/");
        httpListener.Start();
        Console.WriteLine("Server started on ws://localhost:8080");

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
                            Nickname = obj["nickname"]?.ToString() ?? "Anonymous",
                            Socket = webSocket,
                            Position = new Vector2(500, 500), 
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
                        break;

                    case "split":
                        break;

                    case "leave":
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
            visiblePlayers
    .TryRemove(player.Id, out _);
    }

    private async void SendGameState(object? state)
    {
        
    }

    private async Task SendJson(WebSocket socket, object data)
    {
        if (socket.State != WebSocketState.Open) return;

        var json = JsonSerializer.Serialize(data);
        var bytes = Encoding.UTF8.GetBytes(json);
        await socket.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
    }
}