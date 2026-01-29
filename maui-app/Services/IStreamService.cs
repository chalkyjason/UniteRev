using UniteRev.Maui.Models;

namespace UniteRev.Maui.Services;

public interface IStreamService
{
    Task<List<LiveStream>> SearchStreamsAsync(List<string> keywords, int minViewers = 0);
    Task<List<LiveStream>> GetLiveStreamsForStreamersAsync(List<Streamer> streamers);
}

public class StreamService : IStreamService
{
    private readonly ITwitchService _twitchService;
    private readonly IYouTubeService _youTubeService;

    public StreamService(ITwitchService twitchService, IYouTubeService youTubeService)
    {
        _twitchService = twitchService;
        _youTubeService = youTubeService;
    }

    public async Task<List<LiveStream>> SearchStreamsAsync(List<string> keywords, int minViewers = 0)
    {
        var allStreams = new List<LiveStream>();

        // Search in parallel across all platforms
        var tasks = new List<Task<List<LiveStream>>>
        {
            _twitchService.SearchStreamsAsync(keywords, minViewers),
            _youTubeService.SearchStreamsAsync(keywords, minViewers)
        };

        var results = await Task.WhenAll(tasks);

        foreach (var result in results)
        {
            allStreams.AddRange(result);
        }

        // Sort by viewer count descending
        return allStreams.OrderByDescending(s => s.ViewerCount).ToList();
    }

    public async Task<List<LiveStream>> GetLiveStreamsForStreamersAsync(List<Streamer> streamers)
    {
        var allStreams = new List<LiveStream>();

        // Group streamers by platform
        var twitchStreamers = streamers.Where(s => s.Platform.ToLower() == "twitch").ToList();
        var youtubeStreamers = streamers.Where(s => s.Platform.ToLower() == "youtube").ToList();

        var tasks = new List<Task<List<LiveStream>>>();

        if (twitchStreamers.Any())
        {
            tasks.Add(_twitchService.GetStreamerStatusAsync(twitchStreamers));
        }

        if (youtubeStreamers.Any())
        {
            tasks.Add(_youTubeService.GetStreamerStatusAsync(youtubeStreamers));
        }

        var results = await Task.WhenAll(tasks);

        foreach (var result in results)
        {
            allStreams.AddRange(result);
        }

        return allStreams.Where(s => s.IsLive).OrderByDescending(s => s.ViewerCount).ToList();
    }
}
