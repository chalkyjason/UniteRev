using System.Text.Json;
using UniteRev.Maui.Models;

namespace UniteRev.Maui.Services;

public interface ITwitchService
{
    bool IsAuthenticated { get; }
    Task<bool> AuthenticateAsync(string clientId, string clientSecret);
    Task<List<LiveStream>> SearchStreamsAsync(List<string> keywords, int minViewers = 0);
    Task<List<LiveStream>> GetStreamerStatusAsync(List<Streamer> streamers);
}

public class TwitchService : ITwitchService
{
    private readonly HttpClient _httpClient;
    private readonly ISettingsService _settingsService;

    private string? _clientId;
    private string? _accessToken;
    private DateTime? _tokenExpiry;

    private const string ApiBase = "https://api.twitch.tv/helix";

    public bool IsAuthenticated => !string.IsNullOrEmpty(_accessToken) &&
                                   (_tokenExpiry == null || _tokenExpiry > DateTime.UtcNow);

    public TwitchService(HttpClient httpClient, ISettingsService settingsService)
    {
        _httpClient = httpClient;
        _settingsService = settingsService;

        // Load saved credentials
        var creds = _settingsService.GetCredentials("twitch");
        if (creds != null)
        {
            _clientId = creds.ClientId;
            _accessToken = creds.AccessToken;
            _tokenExpiry = creds.TokenExpiry;
        }
    }

    public async Task<bool> AuthenticateAsync(string clientId, string clientSecret)
    {
        try
        {
            // Get app access token (client credentials flow)
            var response = await _httpClient.PostAsync(
                "https://id.twitch.tv/oauth2/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["client_id"] = clientId,
                    ["client_secret"] = clientSecret,
                    ["grant_type"] = "client_credentials"
                }));

            if (!response.IsSuccessStatusCode)
                return false;

            var json = await response.Content.ReadAsStringAsync();
            var data = JsonDocument.Parse(json);

            _clientId = clientId;
            _accessToken = data.RootElement.GetProperty("access_token").GetString();
            var expiresIn = data.RootElement.GetProperty("expires_in").GetInt32();
            _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn);

            // Save credentials
            _settingsService.SetCredentials("twitch", new OAuthCredentials
            {
                Platform = "twitch",
                ClientId = clientId,
                ClientSecret = clientSecret,
                AccessToken = _accessToken,
                TokenExpiry = _tokenExpiry
            });
            await _settingsService.SaveAsync();

            return true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Twitch auth error: {ex.Message}");
            return false;
        }
    }

    public async Task<List<LiveStream>> SearchStreamsAsync(List<string> keywords, int minViewers = 0)
    {
        var streams = new List<LiveStream>();

        if (!IsAuthenticated || keywords.Count == 0)
            return streams;

        try
        {
            foreach (var keyword in keywords.Take(10)) // Limit to 10 keywords
            {
                var request = new HttpRequestMessage(HttpMethod.Get,
                    $"{ApiBase}/search/channels?query={Uri.EscapeDataString(keyword)}&live_only=true&first=20");

                request.Headers.Add("Client-ID", _clientId);
                request.Headers.Add("Authorization", $"Bearer {_accessToken}");

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                    continue;

                var json = await response.Content.ReadAsStringAsync();
                var data = JsonDocument.Parse(json);

                if (data.RootElement.TryGetProperty("data", out var channels))
                {
                    foreach (var channel in channels.EnumerateArray())
                    {
                        var isLive = channel.GetProperty("is_live").GetBoolean();
                        if (!isLive) continue;

                        var stream = new LiveStream
                        {
                            Id = channel.GetProperty("id").GetString() ?? "",
                            Platform = "Twitch",
                            ChannelName = channel.GetProperty("display_name").GetString() ?? "",
                            Title = channel.GetProperty("title").GetString() ?? "",
                            Url = $"https://twitch.tv/{channel.GetProperty("broadcaster_login").GetString()}",
                            ThumbnailUrl = channel.GetProperty("thumbnail_url").GetString() ?? "",
                            IsLive = true,
                            GameName = channel.TryGetProperty("game_name", out var game) ? game.GetString() : null
                        };

                        // Only add if meets minimum viewers (we'll get exact count separately)
                        if (!streams.Any(s => s.Id == stream.Id))
                        {
                            streams.Add(stream);
                        }
                    }
                }
            }

            // Get viewer counts for live streams
            if (streams.Any())
            {
                await EnrichWithViewerCounts(streams);
            }

            return streams.Where(s => s.ViewerCount >= minViewers).ToList();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Twitch search error: {ex.Message}");
            return streams;
        }
    }

    public async Task<List<LiveStream>> GetStreamerStatusAsync(List<Streamer> streamers)
    {
        var streams = new List<LiveStream>();

        if (!IsAuthenticated || streamers.Count == 0)
            return streams;

        try
        {
            // Get user logins
            var logins = streamers.Select(s => s.Handle.TrimStart('@')).Take(100);
            var query = string.Join("&user_login=", logins);

            var request = new HttpRequestMessage(HttpMethod.Get,
                $"{ApiBase}/streams?user_login={query}");

            request.Headers.Add("Client-ID", _clientId);
            request.Headers.Add("Authorization", $"Bearer {_accessToken}");

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
                return streams;

            var json = await response.Content.ReadAsStringAsync();
            var data = JsonDocument.Parse(json);

            if (data.RootElement.TryGetProperty("data", out var streamData))
            {
                foreach (var s in streamData.EnumerateArray())
                {
                    streams.Add(new LiveStream
                    {
                        Id = s.GetProperty("id").GetString() ?? "",
                        Platform = "Twitch",
                        ChannelName = s.GetProperty("user_name").GetString() ?? "",
                        Title = s.GetProperty("title").GetString() ?? "",
                        Url = $"https://twitch.tv/{s.GetProperty("user_login").GetString()}",
                        ThumbnailUrl = s.GetProperty("thumbnail_url").GetString()
                            ?.Replace("{width}", "320").Replace("{height}", "180") ?? "",
                        ViewerCount = s.GetProperty("viewer_count").GetInt32(),
                        IsLive = true,
                        GameName = s.TryGetProperty("game_name", out var game) ? game.GetString() : null,
                        StartedAt = DateTime.Parse(s.GetProperty("started_at").GetString() ?? DateTime.UtcNow.ToString())
                    });
                }
            }

            return streams;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Twitch status error: {ex.Message}");
            return streams;
        }
    }

    private async Task EnrichWithViewerCounts(List<LiveStream> streams)
    {
        try
        {
            var logins = streams.Select(s => s.Url.Split('/').Last()).Take(100);
            var query = string.Join("&user_login=", logins);

            var request = new HttpRequestMessage(HttpMethod.Get,
                $"{ApiBase}/streams?user_login={query}");

            request.Headers.Add("Client-ID", _clientId);
            request.Headers.Add("Authorization", $"Bearer {_accessToken}");

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
                return;

            var json = await response.Content.ReadAsStringAsync();
            var data = JsonDocument.Parse(json);

            if (data.RootElement.TryGetProperty("data", out var streamData))
            {
                foreach (var s in streamData.EnumerateArray())
                {
                    var login = s.GetProperty("user_login").GetString()?.ToLower();
                    var stream = streams.FirstOrDefault(st =>
                        st.Url.ToLower().EndsWith($"/{login}"));

                    if (stream != null)
                    {
                        stream.ViewerCount = s.GetProperty("viewer_count").GetInt32();
                        stream.StartedAt = DateTime.Parse(s.GetProperty("started_at").GetString() ?? DateTime.UtcNow.ToString());
                    }
                }
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Twitch enrich error: {ex.Message}");
        }
    }
}
