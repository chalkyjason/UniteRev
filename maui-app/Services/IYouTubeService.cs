using System.Text.Json;
using UniteRev.Maui.Models;

namespace UniteRev.Maui.Services;

public interface IYouTubeService
{
    bool IsAuthenticated { get; }
    Task<bool> SetApiKeyAsync(string apiKey);
    Task<bool> AuthenticateOAuthAsync(string clientId);
    Task<List<LiveStream>> SearchStreamsAsync(List<string> keywords, int minViewers = 0);
    Task<List<LiveStream>> GetStreamerStatusAsync(List<Streamer> streamers);
}

public class YouTubeService : IYouTubeService
{
    private readonly HttpClient _httpClient;
    private readonly ISettingsService _settingsService;

    private string? _apiKey;
    private string? _accessToken;
    private DateTime? _tokenExpiry;

    private const string ApiBase = "https://www.googleapis.com/youtube/v3";

    public bool IsAuthenticated => !string.IsNullOrEmpty(_apiKey) ||
                                   (!string.IsNullOrEmpty(_accessToken) &&
                                    (_tokenExpiry == null || _tokenExpiry > DateTime.UtcNow));

    public YouTubeService(HttpClient httpClient, ISettingsService settingsService)
    {
        _httpClient = httpClient;
        _settingsService = settingsService;

        // Load saved credentials
        var creds = _settingsService.GetCredentials("youtube");
        if (creds != null)
        {
            _apiKey = creds.ApiKey;
            _accessToken = creds.AccessToken;
            _tokenExpiry = creds.TokenExpiry;
        }
    }

    public async Task<bool> SetApiKeyAsync(string apiKey)
    {
        try
        {
            // Verify API key works
            var response = await _httpClient.GetAsync(
                $"{ApiBase}/videos?part=id&id=dQw4w9WgXcQ&key={apiKey}");

            if (!response.IsSuccessStatusCode)
                return false;

            _apiKey = apiKey;

            // Save credentials
            _settingsService.SetCredentials("youtube", new OAuthCredentials
            {
                Platform = "youtube",
                ApiKey = apiKey
            });
            await _settingsService.SaveAsync();

            return true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"YouTube API key error: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> AuthenticateOAuthAsync(string clientId)
    {
        // OAuth flow would be handled by OAuthService
        // This is just for setting up with an existing token
        return await Task.FromResult(false);
    }

    public async Task<List<LiveStream>> SearchStreamsAsync(List<string> keywords, int minViewers = 0)
    {
        var streams = new List<LiveStream>();

        if (!IsAuthenticated || keywords.Count == 0)
            return streams;

        try
        {
            foreach (var keyword in keywords.Take(5)) // Limit to 5 keywords (API quota)
            {
                var authParam = !string.IsNullOrEmpty(_accessToken)
                    ? $"access_token={_accessToken}"
                    : $"key={_apiKey}";

                var url = $"{ApiBase}/search?part=snippet" +
                    $"&q={Uri.EscapeDataString(keyword)}" +
                    $"&type=video&eventType=live&maxResults=25&{authParam}";

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                    continue;

                var json = await response.Content.ReadAsStringAsync();
                var data = JsonDocument.Parse(json);

                if (data.RootElement.TryGetProperty("items", out var items))
                {
                    foreach (var item in items.EnumerateArray())
                    {
                        var snippet = item.GetProperty("snippet");
                        var videoId = item.GetProperty("id").GetProperty("videoId").GetString();

                        var stream = new LiveStream
                        {
                            Id = videoId ?? "",
                            Platform = "YouTube",
                            ChannelName = snippet.GetProperty("channelTitle").GetString() ?? "",
                            Title = snippet.GetProperty("title").GetString() ?? "",
                            Url = $"https://www.youtube.com/watch?v={videoId}",
                            ThumbnailUrl = snippet.GetProperty("thumbnails").GetProperty("medium")
                                .GetProperty("url").GetString() ?? "",
                            IsLive = true
                        };

                        if (!streams.Any(s => s.Id == stream.Id))
                        {
                            streams.Add(stream);
                        }
                    }
                }
            }

            // Get viewer counts
            if (streams.Any())
            {
                await EnrichWithViewerCounts(streams);
            }

            return streams.Where(s => s.ViewerCount >= minViewers).ToList();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"YouTube search error: {ex.Message}");
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
            // For YouTube, we need to search for each channel's live streams
            foreach (var streamer in streamers.Take(10))
            {
                var authParam = !string.IsNullOrEmpty(_accessToken)
                    ? $"access_token={_accessToken}"
                    : $"key={_apiKey}";

                // Search for channel's live streams
                var handle = streamer.Handle.TrimStart('@');
                var url = $"{ApiBase}/search?part=snippet" +
                    $"&q={Uri.EscapeDataString(handle)}" +
                    $"&type=video&eventType=live&maxResults=5&{authParam}";

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                    continue;

                var json = await response.Content.ReadAsStringAsync();
                var data = JsonDocument.Parse(json);

                if (data.RootElement.TryGetProperty("items", out var items))
                {
                    foreach (var item in items.EnumerateArray())
                    {
                        var snippet = item.GetProperty("snippet");
                        var channelTitle = snippet.GetProperty("channelTitle").GetString()?.ToLower();

                        // Check if this is the correct channel
                        if (channelTitle?.Contains(handle.ToLower()) != true)
                            continue;

                        var videoId = item.GetProperty("id").GetProperty("videoId").GetString();

                        var stream = new LiveStream
                        {
                            Id = videoId ?? "",
                            Platform = "YouTube",
                            ChannelName = snippet.GetProperty("channelTitle").GetString() ?? "",
                            Title = snippet.GetProperty("title").GetString() ?? "",
                            Url = $"https://www.youtube.com/watch?v={videoId}",
                            ThumbnailUrl = snippet.GetProperty("thumbnails").GetProperty("medium")
                                .GetProperty("url").GetString() ?? "",
                            IsLive = true
                        };

                        if (!streams.Any(s => s.Id == stream.Id))
                        {
                            streams.Add(stream);
                        }
                    }
                }
            }

            // Get viewer counts
            if (streams.Any())
            {
                await EnrichWithViewerCounts(streams);
            }

            return streams;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"YouTube status error: {ex.Message}");
            return streams;
        }
    }

    private async Task EnrichWithViewerCounts(List<LiveStream> streams)
    {
        try
        {
            var videoIds = string.Join(",", streams.Select(s => s.Id).Take(50));

            var authParam = !string.IsNullOrEmpty(_accessToken)
                ? $"access_token={_accessToken}"
                : $"key={_apiKey}";

            var url = $"{ApiBase}/videos?part=liveStreamingDetails,statistics" +
                $"&id={videoIds}&{authParam}";

            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return;

            var json = await response.Content.ReadAsStringAsync();
            var data = JsonDocument.Parse(json);

            if (data.RootElement.TryGetProperty("items", out var items))
            {
                foreach (var item in items.EnumerateArray())
                {
                    var videoId = item.GetProperty("id").GetString();
                    var stream = streams.FirstOrDefault(s => s.Id == videoId);

                    if (stream == null) continue;

                    if (item.TryGetProperty("liveStreamingDetails", out var liveDetails))
                    {
                        if (liveDetails.TryGetProperty("concurrentViewers", out var viewers))
                        {
                            stream.ViewerCount = int.Parse(viewers.GetString() ?? "0");
                        }

                        if (liveDetails.TryGetProperty("actualStartTime", out var startTime))
                        {
                            stream.StartedAt = DateTime.Parse(startTime.GetString() ?? DateTime.UtcNow.ToString());
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"YouTube enrich error: {ex.Message}");
        }
    }
}
