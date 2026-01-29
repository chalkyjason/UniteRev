using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UniteRev.Maui.Models;
using UniteRev.Maui.Services;

namespace UniteRev.Maui.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly ISettingsService _settingsService;
    private readonly IStreamService _streamService;

    [ObservableProperty]
    private string _gridLayout = "2x2";

    [ObservableProperty]
    private int _gridRows = 2;

    [ObservableProperty]
    private int _gridColumns = 2;

    [ObservableProperty]
    private int _activeAudioIndex = -1;

    [ObservableProperty]
    private string _streamUrlInput = string.Empty;

    [ObservableProperty]
    private int _selectedCellIndex = -1;

    [ObservableProperty]
    private bool _isLoading;

    public ObservableCollection<GridCellViewModel> GridCells { get; } = new();
    public ObservableCollection<Streamer> SavedStreamers { get; } = new();

    public List<string> LayoutOptions { get; } = new()
    {
        "1x1", "1x2", "2x1", "2x2", "2x3", "3x2", "3x3", "4x4"
    };

    public MainViewModel(ISettingsService settingsService, IStreamService streamService)
    {
        _settingsService = settingsService;
        _streamService = streamService;
    }

    public async Task InitializeAsync()
    {
        IsLoading = true;

        await _settingsService.LoadAsync();

        GridLayout = _settingsService.Settings.GridLayout;
        UpdateGridDimensions();
        RebuildGridCells();
        LoadSavedStreamers();

        IsLoading = false;
    }

    [RelayCommand]
    private void ChangeLayout(string layout)
    {
        GridLayout = layout;
        _settingsService.Settings.GridLayout = layout;
        UpdateGridDimensions();
        RebuildGridCells();
        _ = _settingsService.SaveAsync();
    }

    [RelayCommand]
    private void AddStream()
    {
        if (string.IsNullOrWhiteSpace(StreamUrlInput))
            return;

        // Find first empty cell
        var emptyCell = GridCells.FirstOrDefault(c => !c.HasStream);
        if (emptyCell == null)
        {
            // All cells full - use selected cell or first cell
            emptyCell = SelectedCellIndex >= 0 && SelectedCellIndex < GridCells.Count
                ? GridCells[SelectedCellIndex]
                : GridCells[0];
        }

        emptyCell.StreamUrl = StreamUrlInput;
        emptyCell.StreamName = ExtractStreamName(StreamUrlInput);

        _settingsService.SetGridStream(emptyCell.Position, StreamUrlInput, emptyCell.StreamName);
        _ = _settingsService.SaveAsync();

        StreamUrlInput = string.Empty;
    }

    [RelayCommand]
    private void AddStreamToCell(int position)
    {
        if (string.IsNullOrWhiteSpace(StreamUrlInput) || position < 0 || position >= GridCells.Count)
            return;

        var cell = GridCells[position];
        cell.StreamUrl = StreamUrlInput;
        cell.StreamName = ExtractStreamName(StreamUrlInput);

        _settingsService.SetGridStream(position, StreamUrlInput, cell.StreamName);
        _ = _settingsService.SaveAsync();

        StreamUrlInput = string.Empty;
    }

    [RelayCommand]
    private void RemoveStream(int position)
    {
        if (position < 0 || position >= GridCells.Count)
            return;

        GridCells[position].Clear();
        _settingsService.ClearGridStream(position);
        _ = _settingsService.SaveAsync();
    }

    [RelayCommand]
    private void ToggleAudio(int position)
    {
        foreach (var cell in GridCells)
        {
            cell.HasAudio = cell.Position == position && !cell.HasAudio;
        }

        ActiveAudioIndex = GridCells.FirstOrDefault(c => c.HasAudio)?.Position ?? -1;
    }

    [RelayCommand]
    private void LoadStreamFromStreamer(Streamer streamer)
    {
        StreamUrlInput = streamer.ProfileUrl;
        AddStream();
    }

    [RelayCommand]
    private void SaveCurrentAsStreamer(int position)
    {
        if (position < 0 || position >= GridCells.Count)
            return;

        var cell = GridCells[position];
        if (!cell.HasStream || string.IsNullOrEmpty(cell.StreamUrl))
            return;

        var platformInfo = ExtractPlatformInfo(cell.StreamUrl);
        var streamer = new Streamer
        {
            Id = platformInfo.id,
            Platform = platformInfo.platform,
            Handle = platformInfo.handle,
            DisplayName = cell.StreamName ?? platformInfo.handle,
            ProfileUrl = cell.StreamUrl,
            CreatedAt = DateTime.UtcNow
        };

        _settingsService.AddStreamer(streamer);

        if (!SavedStreamers.Any(s => s.Id == streamer.Id))
        {
            SavedStreamers.Add(streamer);
        }

        _ = _settingsService.SaveAsync();
    }

    [RelayCommand]
    private void DeleteStreamer(Streamer streamer)
    {
        _settingsService.RemoveStreamer(streamer.Id);
        SavedStreamers.Remove(streamer);
        _ = _settingsService.SaveAsync();
    }

    [RelayCommand]
    private async Task CheckSavedStreamersLive()
    {
        if (!SavedStreamers.Any())
            return;

        IsLoading = true;

        try
        {
            var liveStreams = await _streamService.GetLiveStreamsForStreamersAsync(SavedStreamers.ToList());

            // Update streamers with live status
            foreach (var streamer in SavedStreamers)
            {
                var liveStream = liveStreams.FirstOrDefault(s =>
                    s.ChannelName.Equals(streamer.Handle.TrimStart('@'), StringComparison.OrdinalIgnoreCase) ||
                    s.Url.Contains(streamer.Handle.TrimStart('@'), StringComparison.OrdinalIgnoreCase));
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Error checking live status: {ex.Message}");
        }
        finally
        {
            IsLoading = false;
        }
    }

    private void UpdateGridDimensions()
    {
        var parts = GridLayout.Split('x');
        if (parts.Length == 2 &&
            int.TryParse(parts[0], out var rows) &&
            int.TryParse(parts[1], out var cols))
        {
            GridRows = rows;
            GridColumns = cols;
        }
    }

    private void RebuildGridCells()
    {
        var total = GridRows * GridColumns;
        var existingStreams = _settingsService.GridStreams;

        GridCells.Clear();

        for (int i = 0; i < total; i++)
        {
            var cell = new GridCellViewModel { Position = i };

            if (i < existingStreams.Count && existingStreams[i].IsActive)
            {
                cell.StreamUrl = existingStreams[i].Url;
                cell.StreamName = existingStreams[i].Name;
                cell.HasAudio = existingStreams[i].HasAudio;
            }

            GridCells.Add(cell);
        }
    }

    private void LoadSavedStreamers()
    {
        SavedStreamers.Clear();
        foreach (var streamer in _settingsService.SavedStreamers)
        {
            SavedStreamers.Add(streamer);
        }
    }

    private string ExtractStreamName(string url)
    {
        var info = ExtractPlatformInfo(url);
        return info.handle;
    }

    private (string platform, string handle, string id) ExtractPlatformInfo(string url)
    {
        url = url.Trim();

        if (url.Contains("twitch.tv"))
        {
            var handle = url.Split("twitch.tv/").LastOrDefault()?.Split('/').FirstOrDefault()?.Split('?').FirstOrDefault() ?? "unknown";
            return ("twitch", handle, $"twitch:{handle}");
        }

        if (url.Contains("youtube.com/@"))
        {
            var match = System.Text.RegularExpressions.Regex.Match(url, @"/@([^/\?]+)");
            if (match.Success)
            {
                var handle = match.Groups[1].Value;
                return ("youtube", $"@{handle}", $"youtube:@{handle}");
            }
        }

        if (url.Contains("youtube.com/watch"))
        {
            var match = System.Text.RegularExpressions.Regex.Match(url, @"[?&]v=([^&]+)");
            if (match.Success)
            {
                var videoId = match.Groups[1].Value;
                return ("youtube", videoId, $"youtube:{videoId}");
            }
        }

        if (url.Contains("youtube.com/live"))
        {
            var videoId = url.Split("/live/").LastOrDefault()?.Split('?').FirstOrDefault() ?? "unknown";
            return ("youtube", videoId, $"youtube:{videoId}");
        }

        if (url.Contains("kick.com"))
        {
            var handle = url.Split("kick.com/").LastOrDefault()?.Split('/').FirstOrDefault()?.Split('?').FirstOrDefault() ?? "unknown";
            return ("kick", handle, $"kick:{handle}");
        }

        if (url.Contains("facebook.com"))
        {
            var handle = url.Split("facebook.com/").LastOrDefault()?.Split('/').FirstOrDefault()?.Split('?').FirstOrDefault() ?? "unknown";
            return ("facebook", handle, $"facebook:{handle}");
        }

        return ("unknown", url, $"unknown:{url}");
    }
}

/// <summary>
/// ViewModel for each cell in the stream grid
/// </summary>
public partial class GridCellViewModel : ObservableObject
{
    [ObservableProperty]
    private int _position;

    [ObservableProperty]
    private string? _streamUrl;

    [ObservableProperty]
    private string? _streamName;

    [ObservableProperty]
    private bool _hasAudio;

    public bool HasStream => !string.IsNullOrEmpty(StreamUrl);

    public string DisplayLabel => HasStream ? (StreamName ?? "Stream") : $"Cell {Position + 1}";

    public void Clear()
    {
        StreamUrl = null;
        StreamName = null;
        HasAudio = false;
        OnPropertyChanged(nameof(HasStream));
        OnPropertyChanged(nameof(DisplayLabel));
    }

    partial void OnStreamUrlChanged(string? value)
    {
        OnPropertyChanged(nameof(HasStream));
        OnPropertyChanged(nameof(DisplayLabel));
    }

    partial void OnStreamNameChanged(string? value)
    {
        OnPropertyChanged(nameof(DisplayLabel));
    }
}
