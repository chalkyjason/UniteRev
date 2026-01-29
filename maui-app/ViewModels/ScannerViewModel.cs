using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UniteRev.Maui.Models;
using UniteRev.Maui.Services;

namespace UniteRev.Maui.ViewModels;

public partial class ScannerViewModel : ObservableObject
{
    private readonly IStreamService _streamService;
    private readonly ISettingsService _settingsService;
    private readonly ITwitchService _twitchService;
    private readonly IYouTubeService _youTubeService;

    private CancellationTokenSource? _scanCts;
    private Timer? _scanTimer;

    [ObservableProperty]
    private string _keywordInput = string.Empty;

    [ObservableProperty]
    private int _scanInterval = 60;

    [ObservableProperty]
    private int _minViewers;

    [ObservableProperty]
    private bool _isScanning;

    [ObservableProperty]
    private string _statusText = "Ready to scan";

    [ObservableProperty]
    private int _savedStreamersCount;

    [ObservableProperty]
    private bool _twitchEnabled = true;

    [ObservableProperty]
    private bool _youTubeEnabled = true;

    [ObservableProperty]
    private bool _twitchAuthenticated;

    [ObservableProperty]
    private bool _youTubeAuthenticated;

    public ObservableCollection<string> Keywords { get; } = new();
    public ObservableCollection<LiveStream> Results { get; } = new();

    public List<int> IntervalOptions { get; } = new() { 30, 60, 300, 600, 1800 };

    public string ScanButtonText => IsScanning ? "Stop Scanning" : "Start Scanning";

    public ScannerViewModel(
        IStreamService streamService,
        ISettingsService settingsService,
        ITwitchService twitchService,
        IYouTubeService youTubeService)
    {
        _streamService = streamService;
        _settingsService = settingsService;
        _twitchService = twitchService;
        _youTubeService = youTubeService;
    }

    public async Task InitializeAsync()
    {
        await _settingsService.LoadAsync();

        var settings = _settingsService.Settings;
        ScanInterval = settings.ScanInterval;
        MinViewers = settings.MinViewers;

        foreach (var keyword in settings.Keywords)
        {
            Keywords.Add(keyword);
        }

        TwitchAuthenticated = _twitchService.IsAuthenticated;
        YouTubeAuthenticated = _youTubeService.IsAuthenticated;
        SavedStreamersCount = _settingsService.SavedStreamers.Count;
    }

    [RelayCommand]
    private void AddKeyword()
    {
        var keyword = KeywordInput.Trim();

        if (string.IsNullOrEmpty(keyword) || keyword.Length < 2 || keyword.Length > 100)
            return;

        if (Keywords.Contains(keyword))
            return;

        if (Keywords.Count >= 50)
            return;

        Keywords.Add(keyword);
        SaveKeywords();
        KeywordInput = string.Empty;
    }

    [RelayCommand]
    private void RemoveKeyword(string keyword)
    {
        Keywords.Remove(keyword);
        SaveKeywords();
    }

    [RelayCommand]
    private void ClearKeywords()
    {
        Keywords.Clear();
        SaveKeywords();
    }

    [RelayCommand]
    private async Task SearchSavedStreamers()
    {
        var streamers = _settingsService.SavedStreamers;

        if (streamers.Count == 0)
        {
            StatusText = "No saved streamers found";
            return;
        }

        // Stop current scan
        if (IsScanning)
        {
            StopScanning();
        }

        // Replace keywords with streamer handles
        Keywords.Clear();

        foreach (var streamer in streamers)
        {
            var handle = streamer.Handle ?? streamer.DisplayName;
            if (handle.StartsWith('@'))
                handle = handle[1..];

            if (!string.IsNullOrEmpty(handle) && handle.Length >= 2 && !Keywords.Contains(handle))
            {
                Keywords.Add(handle);
            }
        }

        SaveKeywords();
        StatusText = $"Added {Keywords.Count} saved streamer(s)";

        // Auto-start scanning
        await ToggleScanningAsync();
    }

    [RelayCommand]
    private async Task ToggleScanningAsync()
    {
        if (IsScanning)
        {
            StopScanning();
        }
        else
        {
            await StartScanningAsync();
        }
    }

    private async Task StartScanningAsync()
    {
        if (Keywords.Count == 0)
        {
            StatusText = "Add keywords or search saved streamers first";
            return;
        }

        IsScanning = true;
        OnPropertyChanged(nameof(ScanButtonText));
        _scanCts = new CancellationTokenSource();

        StatusText = "Scanning...";

        // Initial scan
        await PerformScanAsync();

        // Set up periodic scanning
        _scanTimer = new Timer(
            async _ => await PerformScanAsync(),
            null,
            TimeSpan.FromSeconds(ScanInterval),
            TimeSpan.FromSeconds(ScanInterval));
    }

    private void StopScanning()
    {
        IsScanning = false;
        OnPropertyChanged(nameof(ScanButtonText));

        _scanCts?.Cancel();
        _scanTimer?.Dispose();
        _scanTimer = null;

        StatusText = $"Stopped. {Results.Count} streams found.";
    }

    private async Task PerformScanAsync()
    {
        try
        {
            MainThread.BeginInvokeOnMainThread(() =>
            {
                StatusText = "Scanning...";
            });

            var keywords = Keywords.ToList();
            var results = await _streamService.SearchStreamsAsync(keywords, MinViewers);

            MainThread.BeginInvokeOnMainThread(() =>
            {
                Results.Clear();
                foreach (var stream in results)
                {
                    Results.Add(stream);
                }

                StatusText = $"Found {Results.Count} stream(s)";
            });
        }
        catch (Exception ex)
        {
            MainThread.BeginInvokeOnMainThread(() =>
            {
                StatusText = $"Scan error: {ex.Message}";
            });
        }
    }

    [RelayCommand]
    private void OpenStream(LiveStream stream)
    {
        // Navigate to main page and add this stream to grid
        // This will be handled via messaging or navigation parameter
        _ = Launcher.OpenAsync(new Uri(stream.Url));
    }

    [RelayCommand]
    private async Task ConfigureTwitchAsync()
    {
        var clientId = await Application.Current!.MainPage!.DisplayPromptAsync(
            "Twitch Configuration",
            "Enter your Twitch Client ID:",
            placeholder: "Client ID from dev.twitch.tv",
            initialValue: _settingsService.GetCredentials("twitch")?.ClientId ?? "");

        if (string.IsNullOrEmpty(clientId))
            return;

        var clientSecret = await Application.Current.MainPage.DisplayPromptAsync(
            "Twitch Configuration",
            "Enter your Twitch Client Secret:",
            placeholder: "Client Secret");

        if (string.IsNullOrEmpty(clientSecret))
            return;

        StatusText = "Authenticating with Twitch...";

        var success = await _twitchService.AuthenticateAsync(clientId, clientSecret);
        TwitchAuthenticated = success;

        StatusText = success
            ? "Twitch authenticated successfully"
            : "Twitch authentication failed";
    }

    [RelayCommand]
    private async Task ConfigureYouTubeAsync()
    {
        var action = await Application.Current!.MainPage!.DisplayActionSheet(
            "YouTube Configuration", "Cancel", null,
            "Enter API Key", "Sign in with Google (OAuth)");

        if (action == "Enter API Key")
        {
            var apiKey = await Application.Current.MainPage.DisplayPromptAsync(
                "YouTube API Key",
                "Enter your YouTube Data API v3 key:",
                placeholder: "API key from Google Cloud Console",
                initialValue: _settingsService.GetCredentials("youtube")?.ApiKey ?? "");

            if (string.IsNullOrEmpty(apiKey))
                return;

            StatusText = "Verifying YouTube API key...";

            var success = await _youTubeService.SetApiKeyAsync(apiKey);
            YouTubeAuthenticated = success;

            StatusText = success
                ? "YouTube API key saved"
                : "Invalid YouTube API key";
        }
    }

    partial void OnScanIntervalChanged(int value)
    {
        _settingsService.Settings.ScanInterval = value;
        _ = _settingsService.SaveAsync();

        // Restart timer if scanning
        if (IsScanning && _scanTimer != null)
        {
            _scanTimer.Change(
                TimeSpan.FromSeconds(value),
                TimeSpan.FromSeconds(value));
        }
    }

    partial void OnMinViewersChanged(int value)
    {
        _settingsService.Settings.MinViewers = value;
        _ = _settingsService.SaveAsync();
    }

    private void SaveKeywords()
    {
        _settingsService.Settings.Keywords = Keywords.ToList();
        _ = _settingsService.SaveAsync();
    }
}
