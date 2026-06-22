// Security Check: Only allow local access
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  document.documentElement.innerHTML = `
    <div style="height: 100vh; width: 100vw; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #0f172a; font-family: 'Noto Serif SC', serif; margin: 0; position: fixed; top: 0; left: 0; z-index: 99999;">
      <div style="text-align: center; animation: fadeUp 0.8s ease-out;">
        <div style="font-size: 5rem; margin-bottom: 20px;">🛡️</div>
        <h1 style="color: #f87171; font-size: 3.5rem; letter-spacing: 0.1em; margin: 0 0 15px 0; text-shadow: 0 0 20px rgba(248,113,113,0.3);">AREA RESTRICTED</h1>
        <p style="color: #94a3b8; font-size: 1.2rem; letter-spacing: 0.05em; margin-bottom: 40px;">检测到外部网络访问。创世权限仅限本地主机 (Localhost) 持有者。</p>
        <a href="/index.html" style="display: inline-block; padding: 12px 35px; background: transparent; border: 1px solid #38bdf8; color: #38bdf8; text-decoration: none; border-radius: 4px; font-weight: bold; letter-spacing: 0.1em; transition: all 0.3s ease;" onmouseover="this.style.background='#38bdf8'; this.style.color='#0f172a'; this.style.boxShadow='0 0 20px rgba(56,189,248,0.4)'" onmouseout="this.style.background='transparent'; this.style.color='#38bdf8'; this.style.boxShadow='none'">返回观测世界</a>
      </div>
    </div>
    <style>
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
  `;
  throw new Error("CMS is restricted to local development environment only.");
}

document.addEventListener('DOMContentLoaded', async () => {
  const articleList = document.getElementById('articleList');

  async function loadArticles() {
    try {
      const response = await fetch('/api/articles');
      const articles = await response.json();
      
      if (articles.length === 0) {
        articleList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 40px; color: #999;">空空如也，快去写下第一篇文章吧！</td></tr>';
        return;
      }

      articleList.innerHTML = articles.map(article => `
        <tr>
          <td class="title"><a href="${article.url}" target="_blank" style="color: inherit; text-decoration: none;">${article.title}</a></td>
          <td class="date">${article.date}</td>
          <td class="actions">
            <div class="action-btns">
              <a href="/editor.html?id=${article.id}" class="btn-edit">编辑</a>
              <button class="btn-delete" data-id="${article.id}">删除</button>
            </div>
          </td>
        </tr>
      `).join('');

      // Add delete listeners
      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          if (confirm('确定要彻底删除这篇文章吗？（操作不可逆）')) {
            await deleteArticle(id);
          }
        });
      });

    } catch (e) {
      articleList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 40px; color: red;">加载失败，请确保本地开发服务器正常运行。</td></tr>';
    }
  }

  async function deleteArticle(id) {
    try {
      const res = await fetch('/api/delete-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        loadArticles(); // Reload list
      } else {
        alert('删除失败: ' + data.error);
      }
    } catch (e) {
      alert('网络错误');
    }
  }

  // --- Friend Management ---
  const friendList = document.getElementById('friendList');
  const friendModal = document.getElementById('friendModal');
  
  async function loadFriends() {
    try {
      const res = await fetch('/api/friends');
      const friends = await res.json();
      window.currentFriends = friends; // for easy edit lookup
      
      if (friends.length === 0) {
        friendList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 40px; color: #999;">还没有友链</td></tr>';
        return;
      }

      friendList.innerHTML = friends.map(f => `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 15px;">
              <img src="${f.avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
              <div>
                <div style="font-weight: bold; color: #2c3e50;">${f.name}</div>
                <div style="font-size: 0.85rem; color: #7f8c8d;">${f.desc}</div>
              </div>
            </div>
          </td>
          <td class="date"><a href="${f.url}" target="_blank" style="color: inherit; text-decoration: none;">${f.url}</a></td>
          <td class="actions">
            <div class="action-btns">
              <button class="btn-edit-friend btn-delete" style="color: var(--primary-color)" data-id="${f.id}">编辑</button>
              <button class="btn-delete-friend btn-delete" data-id="${f.id}">删除</button>
            </div>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-delete-friend').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          if (confirm('确定删除这个友链吗？')) {
            await fetch('/api/delete-friend', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id })
            });
            loadFriends();
          }
        });
      });

      document.querySelectorAll('.btn-edit-friend').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const f = window.currentFriends.find(x => x.id.toString() === id);
          if (f) openFriendModal(f);
        });
      });
    } catch (e) {
      console.error(e);
    }
  }

  const fId = document.getElementById('fId');
  const fName = document.getElementById('fName');
  const fDesc = document.getElementById('fDesc');
  const fUrl = document.getElementById('fUrl');
  const fAvatar = document.getElementById('fAvatar');

  function openFriendModal(f = null) {
    if (f) {
      fId.value = f.id;
      fName.value = f.name;
      fDesc.value = f.desc;
      fUrl.value = f.url;
      fAvatar.value = f.avatar;
    } else {
      fId.value = '';
      fName.value = '';
      fDesc.value = '';
      fUrl.value = '';
      fAvatar.value = '';
    }
    friendModal.style.display = 'flex';
  }

  document.getElementById('btnAddFriend').addEventListener('click', () => openFriendModal());
  document.getElementById('btnCancelFriend').addEventListener('click', () => friendModal.style.display = 'none');

  document.getElementById('btnSaveFriend').addEventListener('click', async () => {
    const originalText = document.getElementById('btnSaveFriend').textContent;
    document.getElementById('btnSaveFriend').textContent = '保存中...';
    await fetch('/api/save-friend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: fId.value,
        name: fName.value,
        desc: fDesc.value,
        url: fUrl.value,
        avatar: fAvatar.value
      })
    });
    document.getElementById('btnSaveFriend').textContent = originalText;
    friendModal.style.display = 'none';
    loadFriends();
  });

  // Avatar upload
  const btnUploadAvatar = document.getElementById('btnUploadAvatar');
  const avatarFile = document.getElementById('avatarFile');
  btnUploadAvatar.addEventListener('click', () => avatarFile.click());
  avatarFile.addEventListener('change', async (e) => {
    if (!e.target.files.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (ev) => {
      btnUploadAvatar.textContent = '...';
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, dataUrl: ev.target.result })
      });
      const data = await res.json();
      if (data.success) fAvatar.value = data.url;
      btnUploadAvatar.textContent = '📁';
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  // --- Deploy Management ---
  const btnDeploy = document.getElementById('btnDeploy');
  if (btnDeploy) {
    btnDeploy.addEventListener('click', async () => {
      const originalText = btnDeploy.innerHTML;
      btnDeploy.innerHTML = '🚀 正在打包并推送到云端...';
      btnDeploy.style.opacity = '0.7';
      btnDeploy.style.pointerEvents = 'none';
      
      try {
        const res = await fetch('/api/deploy', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          btnDeploy.innerHTML = '✅ 发布成功！Vercel正在更新';
          btnDeploy.style.background = '#2ecc71';
        } else {
          alert('发布失败: ' + data.error);
          btnDeploy.innerHTML = originalText;
        }
      } catch (e) {
        alert('发布失败: ' + e.message);
        btnDeploy.innerHTML = originalText;
      } finally {
        setTimeout(() => {
          btnDeploy.innerHTML = originalText;
          btnDeploy.style.opacity = '1';
          btnDeploy.style.pointerEvents = 'auto';
          btnDeploy.style.background = '#27ae60';
        }, 5000);
      }
    });
  }

  loadArticles();
  loadFriends();
});
