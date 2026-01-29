using CommunityToolkit.Mvvm.ComponentModel;

namespace UniteRev.Maui.ViewModels;

/// <summary>
/// Transient ViewModel used for DataTemplate binding in the stream grid.
/// GridCellViewModel (defined in MainViewModel.cs) handles actual cell state.
/// This class exists for DI registration.
/// </summary>
public partial class StreamCellViewModel : ObservableObject
{
    [ObservableProperty]
    private string? _streamUrl;

    [ObservableProperty]
    private string? _streamName;

    [ObservableProperty]
    private bool _hasAudio;

    [ObservableProperty]
    private int _position;
}
