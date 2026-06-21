import { friends } from './friends.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('friendListContainer');
  if (container) {
    if (friends.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px; width: 100%;">还没有添加任何友链...</p>';
      return;
    }
    
    container.innerHTML = friends.map(f => `
      <a href="${f.url}" class="friend-item" target="_blank" rel="noopener noreferrer">
        <img src="${f.avatar}" alt="头像" class="avatar" onerror="this.src='https://picsum.photos/100/100'">
        <div class="friend-info">
          <span class="friend-name">${f.name}</span>
          <span class="friend-desc">${f.desc}</span>
        </div>
      </a>
    `).join('');
  }
});
