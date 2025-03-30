// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const githubLoginBtn = document.getElementById('github-login');
    const logoutBtn = document.getElementById('logout');
    const saveRepoBtn = document.getElementById('save-repo');
    const saveSettingsBtn = document.getElementById('save-settings');
    const repoSelect = document.getElementById('repo-select');
    const folderPath = document.getElementById('folder-path');
    const commitMessage = document.getElementById('commit-message');
    const statusMessage = document.getElementById('status-message');
    
    // Check if user is logged in
    chrome.storage.sync.get(['githubToken', 'username', 'repos', 'selectedRepo', 'folderPath', 'commitTemplate'], function(data) {
      if (data.githubToken) {
        showLoggedInUI(data.username);
        
        if (data.repos) {
          populateRepoDropdown(data.repos, data.selectedRepo);
        } else {
          fetchUserRepos(data.githubToken);
        }
        
        if (data.selectedRepo) {
          document.getElementById('settings-section').classList.remove('hidden');
          if (data.folderPath) {
            folderPath.value = data.folderPath;
          }
          if (data.commitTemplate) {
            commitMessage.value = data.commitTemplate;
          }
        }
      }
    });
    
    // Login with GitHub
    githubLoginBtn.addEventListener('click', function() {
      // In a real extension, you would use GitHub OAuth flow
      // For this example, we'll simulate the process
      const token = prompt("Enter your GitHub Personal Access Token:");
      if (token) {
        // Validate token and fetch user info
        fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${token}`
          }
        })
        .then(response => {
          if (!response.ok) throw new Error('Invalid token');
          return response.json();
        })
        .then(data => {
          const username = data.login;
          chrome.storage.sync.set({
            githubToken: token,
            username: username
          }, function() {
            showLoggedInUI(username);
            fetchUserRepos(token);
          });
        })
        .catch(error => {
          showStatus('Invalid GitHub token. Please try again.', 'error');
        });
      }
    });
    
    // Logout
    logoutBtn.addEventListener('click', function() {
      chrome.storage.sync.clear(function() {
        document.getElementById('not-logged-in').classList.remove('hidden');
        document.getElementById('logged-in').classList.add('hidden');
        document.getElementById('repo-section').classList.add('hidden');
        document.getElementById('settings-section').classList.add('hidden');
      });
    });
    
    // Save selected repository
    saveRepoBtn.addEventListener('click', function() {
      const selectedRepo = repoSelect.value;
      if (selectedRepo) {
        chrome.storage.sync.set({
          selectedRepo: selectedRepo
        }, function() {
          document.getElementById('settings-section').classList.remove('hidden');
          showStatus('Repository saved successfully!', 'success');
        });
      } else {
        showStatus('Please select a repository.', 'error');
      }
    });
    
    // Save settings
    saveSettingsBtn.addEventListener('click', function() {
      chrome.storage.sync.set({
        folderPath: folderPath.value.trim(),
        commitTemplate: commitMessage.value
      }, function() {
        showStatus('Settings saved successfully!', 'success');
      });
    });
    
    function showLoggedInUI(username) {
      document.getElementById('not-logged-in').classList.add('hidden');
      document.getElementById('logged-in').classList.remove('hidden');
      document.getElementById('repo-section').classList.remove('hidden');
      document.getElementById('username').textContent = username;
    }
    
    function fetchUserRepos(token) {
      fetch('https://api.github.com/user/repos', {
        headers: {
          'Authorization': `token ${token}`
        }
      })
      .then(response => response.json())
      .then(repos => {
        chrome.storage.sync.set({ repos: repos }, function() {
          populateRepoDropdown(repos);
        });
      })
      .catch(error => {
        showStatus('Failed to fetch repositories.', 'error');
      });
    }
    
    function populateRepoDropdown(repos, selectedRepo) {
      repoSelect.innerHTML = '';
      
      repos.forEach(repo => {
        const option = document.createElement('option');
        option.value = repo.full_name;
        option.textContent = repo.full_name;
        if (selectedRepo && repo.full_name === selectedRepo) {
          option.selected = true;
        }
        repoSelect.appendChild(option);
      });
    }
    
    function showStatus(message, type) {
      statusMessage.textContent = message;
      statusMessage.className = 'status ' + type;
      document.getElementById('status-section').classList.remove('hidden');
      
      setTimeout(function() {
        document.getElementById('status-section').classList.add('hidden');
      }, 3000);
    }
  });
  
  