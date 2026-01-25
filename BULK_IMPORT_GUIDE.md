# Bulk Stream Import Guide

## Overview

The bulk import feature allows you to quickly add multiple stream URLs to UniteRev from a text file or by pasting URLs directly. This is perfect for event preparation, team collaboration, or quickly setting up monitoring for multiple streams.

## How to Use

### Method 1: Paste URLs

1. Open `standalone/index.html` in your browser
2. Click the **"📁 Import/Export"** button in the header
3. In the **"📋 Bulk Add Streams"** section, paste your URLs into the text area
4. Click **"Add All Streams"**

### Method 2: Upload Text File

1. Open `standalone/index.html` in your browser
2. Click the **"📁 Import/Export"** button in the header
3. In the **"📋 Bulk Add Streams"** section, click **"Load from File"**
4. Select your `.txt` file containing stream URLs
5. Click **"Add All Streams"**

## Text File Format

Create a `.txt` file with one URL per line:

```
https://www.youtube.com/watch?v=VIDEO_ID
https://www.twitch.tv/CHANNEL_NAME
https://www.youtube.com/watch?v=ANOTHER_ID

https://rumble.com/VIDEO_URL
```

**Notes:**
- One URL per line
- Blank lines are automatically ignored
- URLs must start with `http://` or `https://`
- Invalid URLs are automatically skipped

## Sample File

A sample file `sample-streams.txt` has been included in the repository. It contains several public stream URLs you can use for testing:

```
https://www.youtube.com/watch?v=jfKfPfyJRdk
https://www.youtube.com/watch?v=aqz-KE-bpKQ
https://www.twitch.tv/nasa
https://www.youtube.com/watch?v=86YLFOog4GM
https://www.youtube.com/watch?v=EEIk7gwjgIM

https://www.youtube.com/watch?v=xcJtL7QggTI
```

## Supported Platforms

The bulk import feature automatically detects and configures streams from:

- ✅ **YouTube** - `https://youtube.com/watch?v=VIDEO_ID` or `https://youtu.be/VIDEO_ID`
- ✅ **Twitch** - `https://twitch.tv/CHANNEL`
- ✅ **Facebook** - `https://facebook.com/video.php?v=...`
- ✅ **Any embeddable video URL**

## Features

- **Smart Validation**: Invalid URLs are automatically skipped
- **Capacity Checking**: Won't overflow your grid (respects max stream limits)
- **Duplicate Detection**: Prevents adding the same stream twice
- **User Feedback**: Success messages show how many streams were added/skipped
- **Auto-Clear**: Text area is cleared after successful import

## Error Handling

### "Please enter at least one valid URL"
- Make sure you've pasted URLs or loaded a file
- Verify URLs start with `http://` or `https://`

### "Skipped X streams (invalid or grid full)"
- Some URLs may be invalid or not recognized
- Your grid may be at maximum capacity (4 in free version, 16 in premium)
- Consider removing existing streams or upgrading to premium

## Use Cases

### Event Preparation
Create a `.txt` file with all streams you'll monitor during an event, then bulk import them all at once.

### Team Collaboration
Share your stream list file with team members so everyone monitors the same sources.

### Quick Testing
Use the provided `sample-streams.txt` to quickly populate your grid for testing features.

### Migration
When moving to a new browser, export your config and use bulk import to restore streams.

## Tips

1. **Keep Stream Lists Organized**: Create different `.txt` files for different events or topics
2. **Test First**: Try importing 2-3 streams first to ensure URLs work
3. **Combine with Scenes**: After bulk importing, save different layouts as scenes
4. **Export After Setup**: Always export your configuration after bulk importing to preserve your work

## Example Workflow

1. Create `protest-streams.txt` with relevant stream URLs
2. Open UniteRev
3. Click **📁 Import/Export** → **Load from File**
4. Select `protest-streams.txt`
5. Click **Add All Streams**
6. Arrange streams in preferred layout
7. Save as a scene for quick access later
8. Export configuration as backup

## Troubleshooting

**Problem**: File won't upload
**Solution**: Ensure file is `.txt` format and contains valid text

**Problem**: No streams added after import
**Solution**: Check that URLs in your file start with `http://` or `https://`

**Problem**: Only some streams were added
**Solution**: This is normal - invalid URLs are skipped automatically

## Advanced: Creating Stream Lists Programmatically

You can generate stream URL lists programmatically:

```bash
# From a spreadsheet export
cut -d',' -f1 streams.csv > stream-urls.txt

# From a list of YouTube video IDs
while read id; do
  echo "https://www.youtube.com/watch?v=$id"
done < video-ids.txt > stream-urls.txt
```

## See Also

- [README.md](README.md) - Full feature documentation
- [Import/Export Documentation](README.md#-importexport-configuration) - Complete import/export guide
- [Scenes Guide](README.md#-scenes--layouts) - How to save layouts
