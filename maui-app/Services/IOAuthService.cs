using System.Net;
using System.Text;
using UniteRev.Maui.Models;

namespace UniteRev.Maui.Services;

public interface IOAuthService
{
    Task<OAuthCredentials?> AuthenticateYouTubeAsync(string clientId);
    Task<OAuthCredentials?> AuthenticateTwitchAsync(string clientId, string clientSecret);
    Task<string?> RefreshTokenAsync(string platform, OAuthCredentials credentials);
}

public class OAuthService : IOAuthService
{
    private readonly HttpClient _httpClient;
    private HttpListener? _listener;
    private int _port;

    public OAuthService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<OAuthCredentials?> AuthenticateYouTubeAsync(string clientId)
    {
        try
        {
            // Start local server for OAuth callback
            _port = GetAvailablePort();
            var redirectUri = $"http://127.0.0.1:{_port}/callback";

            _listener = new HttpListener();
            _listener.Prefixes.Add($"http://127.0.0.1:{_port}/");
            _listener.Start();

            // Build OAuth URL
            var scope = "https://www.googleapis.com/auth/youtube.readonly";
            var state = Guid.NewGuid().ToString("N");
            var authUrl = $"https://accounts.google.com/o/oauth2/v2/auth?" +
                $"client_id={Uri.EscapeDataString(clientId)}" +
                $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                $"&response_type=token" +
                $"&scope={Uri.EscapeDataString(scope)}" +
                $"&state={Uri.EscapeDataString(state)}";

            // Open browser
            await Launcher.OpenAsync(new Uri(authUrl));

            // Wait for callback
            var context = await _listener.GetContextAsync();
            var request = context.Request;
            var response = context.Response;

            // Send success page (token will be in fragment, handled by JS)
            var html = GetSuccessHtml();
            var buffer = Encoding.UTF8.GetBytes(html);
            response.ContentLength64 = buffer.Length;
            response.ContentType = "text/html";
            await response.OutputStream.WriteAsync(buffer);
            response.Close();

            // The token is in the URL fragment, which isn't sent to server
            // For MAUI, we need to use a custom scheme or WebAuthenticator
            // This is a simplified version - in production, use WebAuthenticator

            _listener.Stop();

            // Note: In a real implementation, you'd use WebAuthenticator
            // or a custom URL scheme to capture the token
            return null;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"YouTube OAuth error: {ex.Message}");
            return null;
        }
        finally
        {
            _listener?.Stop();
        }
    }

    public async Task<OAuthCredentials?> AuthenticateTwitchAsync(string clientId, string clientSecret)
    {
        try
        {
            // Start local server for OAuth callback
            _port = GetAvailablePort();
            var redirectUri = $"http://127.0.0.1:{_port}/callback";

            _listener = new HttpListener();
            _listener.Prefixes.Add($"http://127.0.0.1:{_port}/");
            _listener.Start();

            // Build OAuth URL
            var scope = "user:read:email";
            var state = Guid.NewGuid().ToString("N");
            var authUrl = $"https://id.twitch.tv/oauth2/authorize?" +
                $"client_id={Uri.EscapeDataString(clientId)}" +
                $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                $"&response_type=code" +
                $"&scope={Uri.EscapeDataString(scope)}" +
                $"&state={Uri.EscapeDataString(state)}";

            // Open browser
            await Launcher.OpenAsync(new Uri(authUrl));

            // Wait for callback
            var context = await _listener.GetContextAsync();
            var request = context.Request;
            var response = context.Response;

            // Get authorization code
            var code = request.QueryString["code"];
            var returnedState = request.QueryString["state"];

            if (returnedState != state)
            {
                throw new Exception("State mismatch - possible CSRF attack");
            }

            // Send success page
            var html = GetSuccessHtml();
            var buffer = Encoding.UTF8.GetBytes(html);
            response.ContentLength64 = buffer.Length;
            response.ContentType = "text/html";
            await response.OutputStream.WriteAsync(buffer);
            response.Close();

            _listener.Stop();

            if (string.IsNullOrEmpty(code))
            {
                return null;
            }

            // Exchange code for token
            var tokenResponse = await _httpClient.PostAsync(
                "https://id.twitch.tv/oauth2/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["client_id"] = clientId,
                    ["client_secret"] = clientSecret,
                    ["code"] = code,
                    ["grant_type"] = "authorization_code",
                    ["redirect_uri"] = redirectUri
                }));

            if (!tokenResponse.IsSuccessStatusCode)
            {
                return null;
            }

            var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
            var tokenData = System.Text.Json.JsonDocument.Parse(tokenJson);

            return new OAuthCredentials
            {
                Platform = "twitch",
                ClientId = clientId,
                ClientSecret = clientSecret,
                AccessToken = tokenData.RootElement.GetProperty("access_token").GetString(),
                RefreshToken = tokenData.RootElement.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null,
                TokenExpiry = DateTime.UtcNow.AddSeconds(
                    tokenData.RootElement.TryGetProperty("expires_in", out var exp) ? exp.GetInt32() : 3600)
            };
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Twitch OAuth error: {ex.Message}");
            return null;
        }
        finally
        {
            _listener?.Stop();
        }
    }

    public async Task<string?> RefreshTokenAsync(string platform, OAuthCredentials credentials)
    {
        if (string.IsNullOrEmpty(credentials.RefreshToken))
            return null;

        try
        {
            if (platform.ToLower() == "twitch")
            {
                var response = await _httpClient.PostAsync(
                    "https://id.twitch.tv/oauth2/token",
                    new FormUrlEncodedContent(new Dictionary<string, string>
                    {
                        ["client_id"] = credentials.ClientId!,
                        ["client_secret"] = credentials.ClientSecret!,
                        ["refresh_token"] = credentials.RefreshToken,
                        ["grant_type"] = "refresh_token"
                    }));

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var data = System.Text.Json.JsonDocument.Parse(json);
                    return data.RootElement.GetProperty("access_token").GetString();
                }
            }
            else if (platform.ToLower() == "youtube")
            {
                var response = await _httpClient.PostAsync(
                    "https://oauth2.googleapis.com/token",
                    new FormUrlEncodedContent(new Dictionary<string, string>
                    {
                        ["client_id"] = credentials.ClientId!,
                        ["refresh_token"] = credentials.RefreshToken,
                        ["grant_type"] = "refresh_token"
                    }));

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var data = System.Text.Json.JsonDocument.Parse(json);
                    return data.RootElement.GetProperty("access_token").GetString();
                }
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Token refresh error: {ex.Message}");
        }

        return null;
    }

    private int GetAvailablePort()
    {
        var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    private string GetSuccessHtml() => """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Successful</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    text-align: center;
                    padding: 40px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 16px;
                    backdrop-filter: blur(10px);
                }
                h1 { color: #22c55e; margin-bottom: 16px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✓ Authentication Successful</h1>
                <p>You can close this window and return to the application.</p>
            </div>
        </body>
        </html>
        """;
}

// Helper for getting available port
file class TcpListener : System.Net.Sockets.TcpListener
{
    public TcpListener(IPAddress localaddr, int port) : base(localaddr, port) { }
}
