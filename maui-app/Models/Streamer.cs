namespace UniteRev.Maui.Models;

/// <summary>
/// Represents a saved streamer/channel
/// </summary>
public class Streamer
{
    public string Id { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string Handle { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ProfileUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string PlatformIcon => Platform.ToLower() switch
    {
        "twitch" => "🟣",
        "youtube" => "🔴",
        "kick" => "🟢",
        "facebook" => "🔵",
        "tiktok" => "⬛",
        _ => "📺"
    };
}

/// <summary>
/// Represents a live stream found by the scanner
/// </summary>
public class LiveStream
{
    public string Id { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string ChannelName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public int ViewerCount { get; set; }
    public bool IsLive { get; set; }
    public DateTime StartedAt { get; set; }
    public string? GameName { get; set; }
    public List<string> Tags { get; set; } = new();

    public string PlatformIcon => Platform.ToLower() switch
    {
        "twitch" => "🟣",
        "youtube" => "🔴",
        "kick" => "🟢",
        "facebook" => "🔵",
        "tiktok" => "⬛",
        _ => "📺"
    };

    public string FormattedViewers => ViewerCount switch
    {
        >= 1_000_000 => $"{ViewerCount / 1_000_000.0:F1}M",
        >= 1_000 => $"{ViewerCount / 1_000.0:F1}K",
        _ => ViewerCount.ToString()
    };
}

/// <summary>
/// Represents a stream in the grid viewer
/// </summary>
public class GridStream
{
    public int Position { get; set; }
    public string? Url { get; set; }
    public string? Name { get; set; }
    public bool HasAudio { get; set; }
    public bool IsActive => !string.IsNullOrEmpty(Url);
}
