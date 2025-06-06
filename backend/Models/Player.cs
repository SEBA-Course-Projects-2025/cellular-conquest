using System;
using System.Net.WebSockets;
using System.Numerics;

public class Player
{
    public Guid Id { get; set; }
    public string Nickname { get; set; } = "Anonymous";
    public WebSocket? Socket { get; set; }
    public List<Cell> Cells { get; set; } = new();
    public Vector2 Direction { get; set; } = Vector2.Zero;
    public int Score { get; set; } = 0;
    public SemaphoreSlim SendLock = new SemaphoreSlim(1, 1);
    public DateTime? SpeedBoostUntil { get; set; } = null;

    public bool HasSpeedBoost => SpeedBoostUntil.HasValue && SpeedBoostUntil.Value > DateTime.UtcNow;
    public int RemainingBoostSeconds => HasSpeedBoost ? (int)(SpeedBoostUntil.Value - DateTime.UtcNow).TotalSeconds : 0;
    public int SpeedBoostPoints { get; set; } = 0;
}
