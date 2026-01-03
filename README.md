# GitHub Repo Quick Search - Chrome Extension

Quickly search and access GitHub repositories across multiple organizations with a keyboard shortcut.

## Features

- 🔍 **Fast Search**: Type to instantly filter repositories across all configured organizations
- ⌨️ **Keyboard Shortcut**: Default `Alt+Shift+G` (customizable via `chrome://extensions/shortcuts`)
- 🔐 **Optional Authentication**: Works unauthenticated (60 req/hour) or with a Personal Access Token (5000 req/hour)
- ⚡ **Smart Caching**: Customizable cache duration (5 min to 24 hours) to minimize API calls
- 🎨 **Clean UI**: GitHub-themed dark mode interface
- 🏢 **Multi-Org Support**: Search across unlimited GitHub organizations simultaneously

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `chrome` folder from this repository

## Setup

1. Click the extension icon or press `Alt+Shift+G`
2. Click "Open Settings" when prompted
3. Enter your GitHub organization names (one per line)
4. (Optional) Add a GitHub Personal Access Token for higher rate limits
5. (Optional) Adjust cache duration preference
6. Click "Save Settings"

## Usage

### Opening the Search

- **Click**: Click the extension icon in the Chrome toolbar
- **Keyboard**: Press `Alt+Shift+G`
- **Customize**: Visit `chrome://extensions/shortcuts` to change the keyboard shortcut

### Searching

1. Type in the search box to filter repositories
2. Use arrow keys (↑/↓) to navigate results
3. Press Enter or click to open the selected repository
4. Search matches against repo names, full names (org/repo), and descriptions

## Configuration

### GitHub Organizations

Enter organization names that match the GitHub URL format:
- URL: `github.com/my-org/my-repo`
- Enter: `my-org`

### Personal Access Token (Optional)

For higher API rate limits, create a token at [github.com/settings/tokens](https://github.com/settings/tokens):
- **For public repos only**: Select `public_repo` scope
- **For private repos**: Select full `repo` scope (gives access to all public and private repos)

### Cache Duration

Choose how long to cache repository data:
- **5-15 minutes**: Fresher data, more API calls
- **30-60 minutes**: Balanced (recommended for most users)
- **2-24 hours**: Minimal API usage, potentially stale data

Click "Clear Cache" in settings to force a refresh.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Alt+Shift+G` | Open search popup |
| `↑` / `↓` | Navigate through results |
| `Enter` | Open selected repository |
| `Esc` | Close popup |

## Permissions

The extension requires:
- **Storage**: Save your settings and cache repository data
- **GitHub API**: Fetch repository information from `api.github.com`

## Troubleshooting

### Keyboard shortcut not working

1. Go to `chrome://extensions/shortcuts`
2. Find "GitHub Repo Quick Search" in the list
3. Check if a shortcut is assigned - if not, click the pencil icon and set `Alt+Shift+G` (or your preferred shortcut)
4. If another extension is using the same shortcut, you'll need to change one of them
5. After setting the shortcut, try pressing it

**Note**: Chrome doesn't always auto-assign the "suggested" shortcuts - you may need to manually configure it.

### "API rate limit exceeded"

- Add a Personal Access Token in settings for 5000 requests/hour
- Increase cache duration to reduce API calls

### "Organization not found"

- Verify the organization name matches the GitHub URL
- Ensure the organization is public or you have access with your token

### No repositories showing

- Check that organizations are configured in settings
- Click "Clear Cache" and try again
- Verify organizations have public repositories

## Development

Built with:
- Manifest V3
- Vanilla JavaScript
- GitHub REST API v3

## License

MIT
