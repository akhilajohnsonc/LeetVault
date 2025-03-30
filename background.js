
  // background.js
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'saveSolution') {
      // Get GitHub credentials and repo info
      chrome.storage.sync.get(['githubToken', 'selectedRepo', 'folderPath', 'commitTemplate'], function(data) {
        if (!data.githubToken || !data.selectedRepo) {
          return;
        }
        
        const { code, language, problem, difficulty, url } = request.data;
        
        // Generate file name and path
        const sanitizedProblem = problem.replace(/[^a-zA-Z0-9]/g, '_');
        const fileExtension = getFileExtension(language);
        const fileName = `${sanitizedProblem}.${fileExtension}`;
        
        let filePath = fileName;
        if (data.folderPath) {
          filePath = `${data.folderPath}/${fileName}`;
        }
        
        // Generate commit message
        let commitMessage = 'Solved LeetCode problem';
        if (data.commitTemplate) {
          commitMessage = data.commitTemplate
            .replace('[PROBLEM_NAME]', problem)
            .replace('[DIFFICULTY]', difficulty);
        }
        
        // Prepare file content with metadata
        const fileContent = `/*
  * Problem: ${problem}
  * Difficulty: ${difficulty}
  * URL: ${url}
  * Date: ${new Date().toISOString().split('T')[0]}
  */
  
  ${code}`;
        
        // Upload to GitHub
        uploadToGitHub(data.githubToken, data.selectedRepo, filePath, fileContent, commitMessage, sender.tab.id);
      });
    }
  });
  
  function getFileExtension(language) {
    const languageMap = {
      'javascript': 'js',
      'python': 'py',
      'python3': 'py',
      'java': 'java',
      'c++': 'cpp',
      'c#': 'cs',
      'ruby': 'rb',
      'swift': 'swift',
      'go': 'go',
      'kotlin': 'kt',
      'scala': 'scala',
      'rust': 'rs',
      'php': 'php',
      'typescript': 'ts'
    };
    
    return languageMap[language.toLowerCase()] || 'txt';
  }
  
  function uploadToGitHub(token, repo, path, content, message, tabId) {
    // First, we need to check if the file already exists
    fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    .then(response => {
      if (response.status === 404) {
        // File doesn't exist, create new file
        return { exists: false };
      } else if (!response.ok) {
        throw new Error('Failed to check if file exists');
      }
      return response.json().then(data => ({ exists: true, sha: data.sha }));
    })
    .then(result => {
      // Encode content to base64
      const encodedContent = btoa(unescape(encodeURIComponent(content)));
      
      const body = {
        message: message,
        content: encodedContent,
        branch: 'main'  // or whatever branch you want to commit to
      };
      
      if (result.exists) {
        body.sha = result.sha;
      }
      
      return fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to upload file');
      return response.json();
    })
    .then(data => {
      // Notify content script of successful upload
      chrome.tabs.sendMessage(tabId, { action: 'solutionSaved', data: data });
    })
    .catch(error => {
      console.error('Error uploading to GitHub:', error);
    });
  }