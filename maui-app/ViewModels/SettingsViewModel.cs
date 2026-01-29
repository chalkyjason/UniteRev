using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UniteRev.Maui.Models;
using UniteRev.Maui.Services;

namespace UniteRev.Maui.ViewModels;

public partial class SettingsViewModel : ObservableObject
{
    private readonly ISettingsService _settingsService;
    private readonly ITwitchService _twitchService;
    private readonly IYouTubeService _youTubeService;

    [ObservableProperty]
    private string _gridLayout = "2x2";

    [ObservableProperty]
    private bool _twitchConnected;

    [ObservableProperty]
    private bool _youTubeConnected;

    [ObservableProperty]
    private int _savedStreamersCount;

    [ObservableProperty]
    private string _appVersion = "1.0.0";

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    public ObservableCollection<Streamer> SavedStreamers { get; } = new();

    public List<string> LayoutOptions { get; } = new()
    {
        "1x1", "1x2", "2x1", "2x2", "2x3", "3x2", "3x3", "4x4"
    };

    public SettingsViewModel(
        ISettingsService settingsService,
        ITwitchService twitchService,
        IYouTubeService youTubeService)
    {
        _settingsService = settingsService;
        _twitchService = twitchService;
        _youTubeService = youTubeService;
    }

    public async Task InitializeAsync()
    {
        await _settingsService.LoadAsync();

        GridLayout = _settingsService.Settings.GridLayout;
        TwitchConnected = _twitchService.IsAuthenticated;
        YouTubeConnected = _youTubeService.IsAuthenticated;

        SavedStreamers.Clear();
        foreach (var streamer in _settingsService.SavedStreamers)
        {
            SavedStreamers.Add(streamer);
        }

        SavedStreamersCount = SavedStreamers.Count;
        AppVersion = AppInfo.Current.VersionString;
    }

    [RelayCommand]
    private async Task ChangeLayoutAsync(string layout)
    {
        GridLayout = layout;
        _settingsService.Settings.GridLayout = layout;
        await _settingsService.SaveAsync();
        StatusMessage = $"Layout changed to {layout}";
    }

    [RelayCommand]
    private async Task DeleteStreamerAsync(Streamer streamer)
    {
        bool confirm = await Application.Current!.MainPage!.DisplayAlert(
            "Delete Streamer",
            $"Remove \"{streamer.DisplayName}\" from saved streamers?",
            "Delete", "Cancel");

        if (!confirm)
            return;

        _settingsService.RemoveStreamer(streamer.Id);
        SavedStreamers.Remove(streamer);
        SavedStreamersCount = SavedStreamers.Count;
        await _settingsService.SaveAsync();

        StatusMessage = $"Removed {streamer.DisplayName}";
    }

    [RelayCommand]
    private async Task ExportStreamersAsync()
    {
        if (SavedStreamers.Count == 0)
        {
            StatusMessage = "No streamers to export";
            return;
        }

        try
        {
            var json = System.Text.Json.JsonSerializer.Serialize(
                SavedStreamers.ToList(),
                new System.Text.Json.JsonSerializerOptions { WriteIndented = true });

            await Clipboard.Default.SetTextAsync(json);
            StatusMessage = $"Exported {SavedStreamers.Count} streamer(s) to clipboard";
        }
        catch (Exception ex)
        {
            StatusMessage = $"Export failed: {ex.Message}";
        }
    }

    [RelayCommand]
    private async Task ImportStreamersAsync()
    {
        try
        {
            var json = await Clipboard.Default.GetTextAsync();

            if (string.IsNullOrEmpty(json))
            {
                StatusMessage = "Clipboard is empty";
                return;
            }

            var streamers = System.Text.Json.JsonSerializer.Deserialize<List<Streamer>>(json);

            if (streamers == null || streamers.Count == 0)
            {
                StatusMessage = "No valid streamers found in clipboard";
                return;
            }

            int added = 0;
            foreach (var streamer in streamers)
            {
                if (!SavedStreamers.Any(s => s.Id == streamer.Id))
                {
                    _settingsService.AddStreamer(streamer);
                    SavedStreamers.Add(streamer);
                    added++;
                }
            }

            SavedStreamersCount = SavedStreamers.Count;
            await _settingsService.SaveAsync();

            StatusMessage = $"Imported {added} new streamer(s)";
        }
        catch (Exception ex)
        {
            StatusMessage = $"Import failed: {ex.Message}";
        }
    }

    [RelayCommand]
    private async Task ClearAllDataAsync()
    {
        bool confirm = await Application.Current!.MainPage!.DisplayAlert(
            "Clear All Data",
            "This will delete all saved streamers, settings, and API credentials. This cannot be undone.",
            "Clear Everything", "Cancel");

        if (!confirm)
            return;

        Preferences.Clear();
        SavedStreamers.Clear();
        SavedStreamersCount = 0;
        GridLayout = "2x2";
        TwitchConnected = false;
        YouTubeConnected = false;

        StatusMessage = "All data cleared";
    }

    [RelayCommand]
    private async Task OpenGitHubAsync()
    {
        await Launcher.OpenAsync(new Uri("https://github.com/chalkyjason/UniteRev"));
    }
}
