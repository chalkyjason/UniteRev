using UniteRev.Maui.Models;

namespace UniteRev.Maui.Services;

public interface ISettingsService
{
    AppSettings Settings { get; }
    List<Streamer> SavedStreamers { get; }
    List<GridStream> GridStreams { get; }

    Task LoadAsync();
    Task SaveAsync();

    void AddStreamer(Streamer streamer);
    void RemoveStreamer(string id);

    void SetGridStream(int position, string? url, string? name);
    void ClearGridStream(int position);

    OAuthCredentials? GetCredentials(string platform);
    void SetCredentials(string platform, OAuthCredentials credentials);
}

public class SettingsService : ISettingsService
{
    private const string SettingsKey = "app_settings";
    private const string StreamersKey = "saved_streamers";
    private const string GridKey = "grid_streams";
    private const string CredentialsKey = "oauth_credentials";

    public AppSettings Settings { get; private set; } = new();
    public List<Streamer> SavedStreamers { get; private set; } = new();
    public List<GridStream> GridStreams { get; private set; } = new();

    private Dictionary<string, OAuthCredentials> _credentials = new();

    public async Task LoadAsync()
    {
        await Task.Run(() =>
        {
            // Load settings
            var settingsJson = Preferences.Get(SettingsKey, string.Empty);
            if (!string.IsNullOrEmpty(settingsJson))
            {
                Settings = System.Text.Json.JsonSerializer.Deserialize<AppSettings>(settingsJson) ?? new();
            }

            // Load streamers
            var streamersJson = Preferences.Get(StreamersKey, string.Empty);
            if (!string.IsNullOrEmpty(streamersJson))
            {
                SavedStreamers = System.Text.Json.JsonSerializer.Deserialize<List<Streamer>>(streamersJson) ?? new();
            }

            // Load grid
            var gridJson = Preferences.Get(GridKey, string.Empty);
            if (!string.IsNullOrEmpty(gridJson))
            {
                GridStreams = System.Text.Json.JsonSerializer.Deserialize<List<GridStream>>(gridJson) ?? new();
            }

            // Initialize grid if empty
            if (GridStreams.Count == 0)
            {
                InitializeGrid();
            }

            // Load credentials
            var credJson = Preferences.Get(CredentialsKey, string.Empty);
            if (!string.IsNullOrEmpty(credJson))
            {
                _credentials = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, OAuthCredentials>>(credJson) ?? new();
            }
        });
    }

    public async Task SaveAsync()
    {
        await Task.Run(() =>
        {
            Preferences.Set(SettingsKey, System.Text.Json.JsonSerializer.Serialize(Settings));
            Preferences.Set(StreamersKey, System.Text.Json.JsonSerializer.Serialize(SavedStreamers));
            Preferences.Set(GridKey, System.Text.Json.JsonSerializer.Serialize(GridStreams));
            Preferences.Set(CredentialsKey, System.Text.Json.JsonSerializer.Serialize(_credentials));
        });
    }

    public void AddStreamer(Streamer streamer)
    {
        if (!SavedStreamers.Any(s => s.Id == streamer.Id))
        {
            SavedStreamers.Add(streamer);
        }
    }

    public void RemoveStreamer(string id)
    {
        SavedStreamers.RemoveAll(s => s.Id == id);
    }

    public void SetGridStream(int position, string? url, string? name)
    {
        EnsureGridSize(position + 1);
        GridStreams[position] = new GridStream
        {
            Position = position,
            Url = url,
            Name = name
        };
    }

    public void ClearGridStream(int position)
    {
        if (position < GridStreams.Count)
        {
            GridStreams[position] = new GridStream { Position = position };
        }
    }

    public OAuthCredentials? GetCredentials(string platform)
    {
        return _credentials.TryGetValue(platform.ToLower(), out var creds) ? creds : null;
    }

    public void SetCredentials(string platform, OAuthCredentials credentials)
    {
        _credentials[platform.ToLower()] = credentials;
    }

    private void InitializeGrid()
    {
        var (rows, cols) = ParseLayout(Settings.GridLayout);
        var total = rows * cols;

        GridStreams.Clear();
        for (int i = 0; i < total; i++)
        {
            GridStreams.Add(new GridStream { Position = i });
        }
    }

    private void EnsureGridSize(int minSize)
    {
        while (GridStreams.Count < minSize)
        {
            GridStreams.Add(new GridStream { Position = GridStreams.Count });
        }
    }

    private (int rows, int cols) ParseLayout(string layout)
    {
        var parts = layout.Split('x');
        if (parts.Length == 2 &&
            int.TryParse(parts[0], out var rows) &&
            int.TryParse(parts[1], out var cols))
        {
            return (rows, cols);
        }
        return (2, 2);
    }
}
