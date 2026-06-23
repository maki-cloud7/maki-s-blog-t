export const GITHUB_OWNER = 'maki-cloud7';
export const GITHUB_REPO = 'maki-s-blog-t';
export const GITHUB_BRANCH = 'main';

export function getGitHubToken() {
  return localStorage.getItem('github_token');
}

export function setGitHubToken(token) {
  localStorage.setItem('github_token', token);
}

export function requireAuth() {
  const token = getGitHubToken();
  if (!token) {
    const modal = document.getElementById('githubAuthModal');
    if (modal) {
      modal.style.display = 'flex';
      document.getElementById('btnGhLogin').addEventListener('click', () => {
        const val = document.getElementById('ghTokenInput').value.trim();
        if (val) {
          setGitHubToken(val);
          modal.style.display = 'none';
          window.location.reload();
        }
      });
    }
    return false;
  }
  return true;
}

export async function fetchGithubFile(path) {
  const token = getGitHubToken();
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}&t=${Date.now()}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('GitHub API Error: ' + res.status);
  }
  const data = await res.json();
  // decode base64 utf-8 safely
  const content = decodeURIComponent(escape(atob(data.content)));
  return { content, sha: data.sha };
}

export async function saveGithubFile(path, content, message, sha) {
  const token = getGitHubToken();
  // encode base64 utf-8 safely
  const encodedContent = btoa(unescape(encodeURIComponent(content)));
  
  const body = {
    message: message,
    content: encodedContent,
    branch: GITHUB_BRANCH
  };
  if (sha) body.sha = sha;

  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) throw new Error('Failed to save file: ' + res.status);
  return await res.json();
}

export async function deleteGithubFile(path, message, sha) {
  const token = getGitHubToken();
  const body = {
    message: message,
    sha: sha,
    branch: GITHUB_BRANCH
  };

  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) throw new Error('Failed to delete file: ' + res.status);
}

// Utility functions for parsing JS data files
export function parseJsData(content, varName) {
  if (!content) return [];
  const arrayStr = content.replace(`export const ${varName} = `, '').trim().replace(/;$/, '');
  try {
    const parser = new Function(`return ${arrayStr}`);
    return parser();
  } catch(e) {
    console.error(`Error parsing ${varName}`, e);
    return [];
  }
}

export function stringifyJsData(data, varName) {
  return `export const ${varName} = ${JSON.stringify(data, null, 2)};\n`;
}
