import { requireAuth, fetchGithubFile, saveGithubFile, deleteGithubFile, parseJsData, stringifyJsData } from '/github-cms.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  // --- Article Management ---
  const articleList = document.getElementById('articleList');

  async function loadArticles() {
    try {
      const fileData = await fetchGithubFile('articles.js');
      const articles = fileData ? parseJsData(fileData.content, 'articles') : [];
      window.currentArticlesFileSha = fileData ? fileData.sha : null;
      
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
          if (confirm('确定要彻底删除这篇文章吗？（操作不可逆，将直接同步至 GitHub）')) {
            await deleteArticle(id);
          }
        });
      });

    } catch (e) {
      console.error(e);
      articleList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 40px; color: red;">加载失败，请检查您的 GitHub Token 是否拥有 repo 权限。</td></tr>';
    }
  }

  async function deleteArticle(id) {
    try {
      // 1. Delete markdown file
      const mdFile = await fetchGithubFile(`public/articles/${id}.md`);
      if (mdFile) {
        await deleteGithubFile(`public/articles/${id}.md`, `Delete article ${id}`, mdFile.sha);
      }
      
      // 2. Remove from articles.js
      const fileData = await fetchGithubFile('articles.js');
      let articles = fileData ? parseJsData(fileData.content, 'articles') : [];
      articles = articles.filter(a => a.id.toString() !== id.toString());
      
      await saveGithubFile('articles.js', stringifyJsData(articles, 'articles'), `Remove article ${id} from list`, fileData ? fileData.sha : null);
      
      loadArticles(); // Reload list
    } catch (e) {
      console.error(e);
      alert('删除失败: ' + e.message);
    }
  }

  // --- Friend Management ---
  const friendList = document.getElementById('friendList');
  const friendModal = document.getElementById('friendModal');
  
  async function loadFriends() {
    try {
      const fileData = await fetchGithubFile('friends.js');
      const friends = fileData ? parseJsData(fileData.content, 'friends') : [];
      window.currentFriends = friends; // for easy edit lookup
      window.currentFriendsFileSha = fileData ? fileData.sha : null;
      
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
            let friends = window.currentFriends.filter(f => f.id.toString() !== id.toString());
            await saveGithubFile('friends.js', stringifyJsData(friends, 'friends'), `Delete friend ${id}`, window.currentFriendsFileSha);
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
    try {
      let friends = [...window.currentFriends];
      let friendId = fId.value;
      if (!friendId) {
        friendId = Date.now().toString();
        friends.push({
          id: friendId,
          name: fName.value,
          desc: fDesc.value,
          url: fUrl.value,
          avatar: fAvatar.value || 'https://picsum.photos/100/100'
        });
      } else {
        const index = friends.findIndex(f => f.id.toString() === friendId.toString());
        if (index !== -1) {
          friends[index] = { ...friends[index], name: fName.value, desc: fDesc.value, url: fUrl.value, avatar: fAvatar.value };
        }
      }
      
      await saveGithubFile('friends.js', stringifyJsData(friends, 'friends'), `Update friend ${friendId}`, window.currentFriendsFileSha);
      friendModal.style.display = 'none';
      loadFriends();
    } catch (e) {
      alert('保存失败: ' + e.message);
    } finally {
      document.getElementById('btnSaveFriend').textContent = originalText;
    }
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
      try {
        const base64Data = ev.target.result.split(',')[1];
        const filename = Date.now() + '_' + file.name;
        // Construct the body manually since saveGithubFile does the base64 encoding of text
        const token = localStorage.getItem('github_token');
        const res = await fetch(`https://api.github.com/repos/maki-cloud7/maki-s-blog-t/contents/public/images/${filename}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Upload avatar ${filename}`,
            content: base64Data, // Already base64 encoded by FileReader DataURL
            branch: 'main'
          })
        });
        if (!res.ok) throw new Error('Upload failed');
        fAvatar.value = `/images/${filename}`;
      } catch (err) {
        alert('上传失败: ' + err.message);
      }
      btnUploadAvatar.textContent = '📁';
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  // --- Social Links Management ---
  const socialGithub = document.getElementById('socialGithub');
  const socialBilibili = document.getElementById('socialBilibili');
  const socialQq = document.getElementById('socialQq');
  const socialTelegram = document.getElementById('socialTelegram');
  const btnSaveSocial = document.getElementById('btnSaveSocial');

  async function loadSocial() {
    try {
      const fileData = await fetchGithubFile('social.js');
      const social = fileData ? parseJsData(fileData.content, 'social') : null;
      window.currentSocialFileSha = fileData ? fileData.sha : null;
      if (social) {
        socialGithub.value = social.github || '';
        socialBilibili.value = social.bilibili || '';
        socialQq.value = social.qq || '';
        socialTelegram.value = social.telegram || '';
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (btnSaveSocial) {
    btnSaveSocial.addEventListener('click', async () => {
      const originalText = btnSaveSocial.textContent;
      btnSaveSocial.textContent = '保存中...';
      try {
        const data = {
          github: socialGithub.value,
          bilibili: socialBilibili.value,
          qq: socialQq.value,
          telegram: socialTelegram.value
        };
        await saveGithubFile('social.js', stringifyJsData(data, 'social'), 'Update social links', window.currentSocialFileSha);
        loadSocial();
      } catch (e) {
        alert('保存失败: ' + e.message);
      } finally {
        btnSaveSocial.textContent = originalText;
      }
    });
  }

  // --- Deploy Logic ---
  const btnDeploy = document.getElementById('btnDeploy');
  if (btnDeploy) {
    btnDeploy.addEventListener('click', async () => {
      alert('CMS 已经升级为 Serverless 架构，所有的保存操作均会自动同步到 GitHub 并触发 Vercel/Pages 的实时构建，不再需要手动“一键发布”啦！');
    });
  }

  // Init
  loadArticles();
  loadFriends();
  loadSocial();
});
