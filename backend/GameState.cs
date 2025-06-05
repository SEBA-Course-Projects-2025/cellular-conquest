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

public partial class Game {
    private async void SendGameState(object? state)
    {
        var deltaTime = 1f / 60f;
        var eatenCells = new List<(Player victim, Cell cell)>();


        //cell movements
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
        

        //eaten food by cells
        foreach (var player in visiblePlayers.Values)
        {
            var eaten = new List<Food>();
            foreach (var cell in player.Cells)
            {
                foreach (var food in foodItems)
                {
                    if (Vector2.Distance(cell.Position, food.Position) < cell.Radius)
                    {
                        eaten.Add(food);
                        
                        float currentArea = MathF.PI * cell.Radius * cell.Radius;
                        float foodArea = MathF.PI * food.Radius * food.Radius;
                        int points = (int)(foodArea / 10f);
                        player.Score += points;
                        float newArea = currentArea + foodArea;
                        cell.Radius = MathF.Sqrt(newArea / MathF.PI);
                        
                        if (food.IsSpeedBoost)
                        {
                            player.SpeedBoostUntil = DateTime.UtcNow.AddSeconds(5);
                        }
                        
                        break;
                    }
                }
            }

            //remove eaten food, add new
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
        
        //handling cell VS cell
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
                        if ((hunterCell.Radius > preyCell.Radius * 1.1f && distance < hunterCell.Radius && hunter.Cells.Count() == 1)
                        || (hunterCell.Radius > preyCell.Radius * 1.33f && distance < hunterCell.Radius && hunter.Cells.Count() > 1))
                        {
                            float hunterArea = MathF.PI * hunterCell.Radius * hunterCell.Radius;
                            float preyArea = MathF.PI * preyCell.Radius * preyCell.Radius;
                            float newArea = hunterArea + preyArea;
                            hunterCell.Radius = MathF.Sqrt(newArea / MathF.PI);
                            int points = (int)(preyArea / 35f);
                            hunter.Score += points;
                            prey.Score = (prey.Score - points) < 0 ? 0 : prey.Score - points;
                            eatenCells.Add((prey, preyCell));
                        }
                    }
                }
            }
        }
        
        //check who ate who, remove the pray
        foreach (var (victim, cell) in eatenCells)
        {
            victim.Cells.Remove(cell);
            

            if (victim.Cells.Count == 0)
            {
                var deathMessage = new {
                    type = "death",
                    score = victim.Score,
                };
                
                
                await SendJson(victim, deathMessage);
                

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
            boost = p.RemainingBoostSeconds,
            cells = p.Cells.Select(c => new {
                x = c.Position.X,
                y = c.Position.Y,
                radius = c.Radius,
                color = "#3d78dd"
            }).ToList()
        }).ToList();


        //write gameState
        var gameState = new
        {
            type = "gameState",
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            visiblePlayers = visiblePlayersList,
            visibleFood = visibleFood
        };


        foreach (var player in visiblePlayers.Values)
        {
            await SendJson(player, gameState);
        }
    }
}
