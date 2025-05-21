using System;
using System.Net.WebSockets;
using System.Numerics;

public class Player
{
    public Guid Id { get; set; }
    public string Nickname { get; set; } = "Anonymous";
    public WebSocket Socket { get; set; }
    public Vector2 Position { get; set; } = Vector2.Zero;
    public Vector2 Direction { get; set; } = Vector2.Zero;
    public int Score { get; set; } = 0;
}
