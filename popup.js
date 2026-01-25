// Cache and state management
let allRepos = [];
let filteredRepos = [];
let selectedIndex = -1;
let settings = null;

// DOM elements
const searchInput = document.getElementById('searchInput');
const results = document.getElementById('results');
const statusText = document.getElementById('statusText');
const repoCount = document.getElementById('repoCount');
const setupMessage = document.getElementById('setupMessage');
const mainContent = document.getElementById('mainContent');
const settingsBtn = document.getElementById('settingsBtn');
const openSettingsBtn = document.getElementById('openSettingsBtn');

// Initialize popup
async function init() {
  console.log('Initializing popup...');
  
  // Setup settings buttons first (they need to work even before configuration)
  setupSettingsButtons();
  
  settings = await loadSettings();
  
  console.log('Settings loaded:', settings);
  console.log('Organizations count:', settings.organizations ? settings.organizations.length : 0);
  
  if (!settings.organizations || settings.organizations.length === 0) {
    console.log('No organizations configured, showing setup message');
    showSetupMessage();
    return;
  }
  
  console.log('Organizations configured, showing main content');
  showMainContent();
  await loadRepos();
  setupEventListeners();
}

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get({
      organizations: [],
      token: '',
      cacheMinutes: 15
    });
    console.log('Loaded settings:', result);
    return result;
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      organizations: [],
      token: '',
      cacheMinutes: 15
    };
  }
}

// Show setup message if no orgs configured
function showSetupMessage() {
  setupMessage.style.display = 'block';
  mainContent.style.display = 'none';
}

// Show main content
function showMainContent() {
  setupMessage.style.display = 'none';
  mainContent.style.display = 'block';
}

// Load repositories (from cache or API)
async function loadRepos() {
  setStatus('Loading repositories...', 'loading');
  
  try {
    // Check cache first
    const cached = await getCachedRepos();
    if (cached) {
      allRepos = cached;
      filteredRepos = cached;
      renderResults();
      setStatus('', '');
      updateRepoCount();
      return;
    }
    
    // Fetch from API
    allRepos = await fetchAllRepos();
    filteredRepos = allRepos;
    
    // Cache the results
    await cacheRepos(allRepos);
    
    renderResults();
    setStatus('', '');
    updateRepoCount();
  } catch (error) {
    setStatus(`Error: ${error.message}`, 'error');
  }
}

// Get cached repos if still valid
async function getCachedRepos() {
  const result = await chrome.storage.local.get(['cachedRepos', 'cacheTimestamp']);
  
  if (!result.cachedRepos || !result.cacheTimestamp) {
    return null;
  }
  
  const now = Date.now();
  const cacheAge = now - result.cacheTimestamp;
  const cacheLimit = settings.cacheMinutes * 60 * 1000;
  
  if (cacheAge > cacheLimit) {
    return null;
  }
  
  return result.cachedRepos;
}

// Cache repos with timestamp
async function cacheRepos(repos) {
  await chrome.storage.local.set({
    cachedRepos: repos,
    cacheTimestamp: Date.now()
  });
}

// Fetch all repos from GitHub API
async function fetchAllRepos() {
  const repos = [];
  
  for (const org of settings.organizations) {
    try {
      const orgRepos = await fetchOrgRepos(org);
      repos.push(...orgRepos);
    } catch (error) {
      console.error(`Error fetching repos for ${org}:`, error);
      // Continue with other orgs even if one fails
    }
  }
  
  // Sort by name
  repos.sort((a, b) => a.name.localeCompare(b.name));
  
  return repos;
}

// Fetch repos for a single organization
async function fetchOrgRepos(org) {
  const repos = [];
  let page = 1;
  const perPage = 100;
  
  while (true) {
    const url = `https://api.github.com/orgs/${org}/repos?page=${page}&per_page=${perPage}&sort=full_name`;
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (settings.token) {
      headers['Authorization'] = `token ${settings.token}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Organization '${org}' not found`);
      } else if (response.status === 401) {
        throw new Error('Invalid GitHub token');
      } else if (response.status === 403) {
        throw new Error('API rate limit exceeded. Add a token in settings.');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      break;
    }
    
    repos.push(...data.map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      description: repo.description,
      org: org
    })));
    
    if (data.length < perPage) {
      break;
    }
    
    page++;
  }
  
  return repos;
}

// Filter repos based on search query (supports multiple keywords)
function filterRepos(query) {
  if (!query) {
    filteredRepos = allRepos;
  } else {
    // Split query into keywords (space-separated)
    const keywords = query.toLowerCase().trim().split(/\s+/).filter(k => k.length > 0);
    
    filteredRepos = allRepos.filter(repo => {
      const searchableText = [
        repo.name,
        repo.fullName,
        repo.org,
        repo.description || ''
      ].join(' ').toLowerCase();
      
      // All keywords must match (AND logic)
      return keywords.every(keyword => searchableText.includes(keyword));
    });
  }
  
  selectedIndex = -1;
  renderResults();
  updateRepoCount();
}

// Render results to DOM
function renderResults() {
  if (filteredRepos.length === 0) {
    results.innerHTML = '<div class="no-results">No repositories found</div>';
    return;
  }
  
  results.innerHTML = filteredRepos.map((repo, index) => {
    const shortcutBadge = index < 9 ? `<span class="shortcut-key">${index + 1}</span>` : '';
    const cloneCommand = `gh repo clone ${repo.fullName}`;
    return `
      <div class="repo-item" data-index="${index}">
        <div class="repo-header">
          ${shortcutBadge}
          <div class="repo-info">
            <div class="repo-name">${escapeHtml(repo.name)}</div>
            <div class="repo-org">${escapeHtml(repo.org)}/${escapeHtml(repo.name)}</div>
          </div>
          <button class="copy-btn" data-command="${escapeHtml(cloneCommand)}" title="Copy clone command">
            <span class="copy-text">Clone</span>
          </button>
        </div>
        ${repo.description ? `<div class="repo-description">${escapeHtml(repo.description)}</div>` : ''}
      </div>
    `;
  }).join('');
  
  // Add click handlers for repo items
  document.querySelectorAll('.repo-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't open repo if clicking the copy button
      if (e.target.closest('.copy-btn')) return;
      const index = parseInt(item.dataset.index);
      openRepo(filteredRepos[index]);
    });
  });
  
  // Add click handlers for copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const command = btn.dataset.command;
      copyToClipboard(command, btn);
    });
  });
}

// Update selected item
function updateSelection() {
  document.querySelectorAll('.repo-item').forEach((item, index) => {
    if (index === selectedIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

// Open repository in new tab
function openRepo(repo) {
  chrome.tabs.create({ url: repo.url });
  window.close();
}

// Copy command to clipboard with feedback
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const copyText = btn.querySelector('.copy-text');
    const originalText = copyText.textContent;
    copyText.textContent = 'Copied!';
    btn.classList.add('copied');
    
    setTimeout(() => {
      copyText.textContent = originalText;
      btn.classList.remove('copied');
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// Set status message
function setStatus(message, className = '') {
  statusText.textContent = message;
  statusText.className = `status-text ${className}`;
}

// Update repo count
function updateRepoCount() {
  if (filteredRepos.length > 0) {
    repoCount.textContent = `${filteredRepos.length} of ${allRepos.length} repos`;
  } else {
    repoCount.textContent = '';
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Setup settings buttons (called early so they work before configuration)
function setupSettingsButtons() {
  // Settings button
  settingsBtn.addEventListener('click', () => {
    console.log('Settings button clicked');
    chrome.runtime.openOptionsPage();
  });
  
  // Open settings from setup message
  openSettingsBtn.addEventListener('click', () => {
    console.log('Open settings button clicked');
    chrome.runtime.openOptionsPage();
  });
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', (e) => {
    filterRepos(e.target.value);
  });
  
  // Keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredRepos.length - 1);
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection();
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      openRepo(filteredRepos[selectedIndex]);
    } else if (e.key >= '1' && e.key <= '9') {
      const keyIndex = parseInt(e.key) - 1;
      if (keyIndex < filteredRepos.length) {
        e.preventDefault();
        selectedIndex = keyIndex;
        updateSelection();
      }
    }
  });
}

// Listen for window focus to reload settings
window.addEventListener('focus', async () => {
  console.log('Window focused, checking if settings changed');
  const newSettings = await loadSettings();
  
  // If settings changed, reinitialize
  if (!settings || JSON.stringify(settings.organizations) !== JSON.stringify(newSettings.organizations)) {
    console.log('Settings changed, reinitializing...');
    init();
  }
});

// Initialize on load
init();
