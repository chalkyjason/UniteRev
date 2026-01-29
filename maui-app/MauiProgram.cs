using CommunityToolkit.Maui;
using Microsoft.Extensions.Logging;
using UniteRev.Maui.Services;
using UniteRev.Maui.ViewModels;
using UniteRev.Maui.Views;

namespace UniteRev.Maui;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // Register Services
        builder.Services.AddSingleton<ISettingsService, SettingsService>();
        builder.Services.AddSingleton<IStreamService, StreamService>();
        builder.Services.AddSingleton<ITwitchService, TwitchService>();
        builder.Services.AddSingleton<IYouTubeService, YouTubeService>();
        builder.Services.AddSingleton<IOAuthService, OAuthService>();
        builder.Services.AddSingleton<HttpClient>();

        // Register ViewModels
        builder.Services.AddSingleton<MainViewModel>();
        builder.Services.AddSingleton<ScannerViewModel>();
        builder.Services.AddSingleton<SettingsViewModel>();
        builder.Services.AddTransient<StreamCellViewModel>();

        // Register Views
        builder.Services.AddSingleton<MainPage>();
        builder.Services.AddSingleton<ScannerPage>();
        builder.Services.AddSingleton<SettingsPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
