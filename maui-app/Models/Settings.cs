namespace UniteRev.Maui.Models;

/// <summary>
/// Application settings
/// </summary>
public class AppSettings
{
    public string GridLayout { get; set; } = "2x2";
    public int ScanInterval { get; set; } = 60; // seconds
    public int MinViewers { get; set; } = 0;
    public List<string> Keywords { get; set; } = new();
    public bool AutoStartScan { get; set; } = false;
    public bool DarkMode { get; set; } = true;
}

/// <summary>
/// OAuth credentials for a platform
/// </summary>
public class OAuthCredentials
{
    public string Platform { get; set; } = string.Empty;
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? TokenExpiry { get; set; }
    public string? ApiKey { get; set; }

    public bool IsAuthenticated => !string.IsNullOrEmpty(AccessToken) &&
                                   (TokenExpiry == null || TokenExpiry > DateTime.UtcNow);
}

/// <summary>
/// Scanner plugin configuration
/// </summary>
public class PluginConfig
{
    public string Platform { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public OAuthCredentials? Credentials { get; set; }
}
