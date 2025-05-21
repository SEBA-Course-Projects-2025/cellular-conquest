using System;
using System.Net.WebSockets;
using System.Numerics;

public class Player
{
    public Guid Id { get; set; }
    public string Nickname { get; set; } = "";
    public WebSocket Socket { get; set; }
    public Vector2 Direction { get; set; } = Vector2.Zero;
    public float Score { get; set; } = 10f;
    public Vector2 Position { get; set; } = new(Random.Shared.Next(0, 1000), Random.Shared.Next(0, 1000));
}
