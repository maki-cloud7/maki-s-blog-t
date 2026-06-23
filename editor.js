import { marked } from 'marked';

// Security Check: Local access is free, external access requires a simple password
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.startsWith('192.168.') && !window.location.hostname.startsWith('10.')) {
  const pwd = prompt("🌍 检测到外部公网访问。为了保护您的博客数据，请输入创世访问密码：");
  if (pwd !== "maki") {
    document.documentElement.innerHTML = `
      <div style="height: 100vh; width: 100vw; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #0f172a; font-family: 'Noto Serif SC', serif; margin: 0; position: fixed; top: 0; left: 0; z-index: 99999;">
        <div style="text-align: center; animation: fadeUp 0.8s ease-out;">
          <div style="font-size: 5rem; margin-bottom: 20px;">🛡️</div>
          <h1 style="color: #f87171; font-size: 3.5rem; letter-spacing: 0.1em; margin: 0 0 15px 0; text-shadow: 0 0 20px rgba(248,113,113,0.3);">ACCESS DENIED</h1>
          <p style="color: #94a3b8; font-size: 1.2rem; letter-spacing: 0.05em; margin-bottom: 40px;">密码错误或取消输入。创世权限已锁定。</p>
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
    throw new Error("Invalid password for external CMS access.");
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id'); // null if new article

  const titleInput = document.getElementById('titleInput');
  const dateInput = document.getElementById('dateInput');
  const tagsInput = document.getElementById('tagsInput');
  const summaryInput = document.getElementById('summaryInput');
  const imageInput = document.getElementById('imageInput');
  const mdInput = document.getElementById('mdInput');
  const previewPane = document.getElementById('previewPane');
  const btnSave = document.getElementById('btnSave');
  const toast = document.getElementById('toast');

  // Upload elements
  const btnUploadCover = document.getElementById('btnUploadCover');
  const coverFileInput = document.getElementById('coverFileInput');
  const btnUploadContentImage = document.getElementById('btnUploadContentImage');
  const contentFileInput = document.getElementById('contentFileInput');

  // Upload logic using Base64
  async function uploadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        try {
          showToast('上传中...');
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, dataUrl })
          });
          const result = await res.json();
          if (result.success) {
            resolve(result.url);
          } else {
            reject(result.error);
          }
        } catch (err) {
          reject(err.message);
        }
      };
      reader.onerror = () => reject('文件读取失败');
      reader.readAsDataURL(file);
    });
  }

  // Cover image upload
  btnUploadCover.addEventListener('click', () => coverFileInput.click());
  coverFileInput.addEventListener('change', async (e) => {
    if (!e.target.files.length) return;
    try {
      const url = await uploadImage(e.target.files[0]);
      imageInput.value = url;
      showToast('封面上传成功');
    } catch(err) {
      alert('上传失败: ' + err);
    }
    e.target.value = '';
  });

  // Content image upload
  btnUploadContentImage.addEventListener('click', () => contentFileInput.click());
  contentFileInput.addEventListener('change', async (e) => {
    if (!e.target.files.length) return;
    try {
      const url = await uploadImage(e.target.files[0]);
      const imgMarkdown = `\n![图片描述](${url})\n`;
      // Insert at cursor
      const startPos = mdInput.selectionStart;
      const endPos = mdInput.selectionEnd;
      mdInput.value = mdInput.value.substring(0, startPos) + imgMarkdown + mdInput.value.substring(endPos, mdInput.value.length);
      mdInput.dispatchEvent(new Event('input')); // update preview
      showToast('图片插入成功');
    } catch(err) {
      alert('上传失败: ' + err);
    }
    e.target.value = '';
  });

  // Default to today
  if (!dateInput.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  // Live Preview functionality
  mdInput.addEventListener('input', () => {
    const mdText = mdInput.value;
    if (mdText.trim() === '') {
      previewPane.innerHTML = '<h2 style="color: #ccc; text-align: center; margin-top: 100px; font-weight: normal;">实时预览区域</h2>';
    } else {
      previewPane.innerHTML = marked.parse(mdText);
    }
  });

  // Scroll sync (simple)
  mdInput.addEventListener('scroll', () => {
    const percentage = mdInput.scrollTop / (mdInput.scrollHeight - mdInput.clientHeight);
    const rightPane = document.querySelector('.pane-right');
    rightPane.scrollTop = percentage * (rightPane.scrollHeight - rightPane.clientHeight);
  });

  // Load existing article if editing
  if (articleId) {
    try {
      // 1. Fetch meta
      const res = await fetch('/api/articles');
      const articles = await res.json();
      const meta = articles.find(a => a.id.toString() === articleId);
      
      if (meta) {
        titleInput.value = meta.title;
        dateInput.value = meta.date;
        tagsInput.value = meta.tags.join(', ');
        summaryInput.value = meta.summary || '';
        imageInput.value = meta.image || '';
      }

      // 2. Fetch markdown content
      const mdRes = await fetch(`/articles/${articleId}.md`);
      if (mdRes.ok) {
        mdInput.value = await mdRes.text();
        mdInput.dispatchEvent(new Event('input')); // trigger preview
      }
    } catch (e) {
      console.error("Failed to load article", e);
    }
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Save functionality
  btnSave.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    if (!title) return alert('标题不能为空！');

    const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
    
    const payload = {
      id: articleId, // Will be null for new, and auto-generated by backend
      title,
      date: dateInput.value,
      tags: tags.length > 0 ? tags : ['随笔'],
      summary: summaryInput.value.trim(),
      image: imageInput.value.trim(),
      content: mdInput.value
    };

    const originalBtnText = btnSave.textContent;
    btnSave.textContent = '保存中...';
    btnSave.disabled = true;

    try {
      const res = await fetch('/api/save-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (result.success) {
        showToast('保存成功！');
        // If it was a new article, update URL so subsequent saves overwrite it
        if (!articleId) {
          const newUrl = new URL(window.location);
          newUrl.searchParams.set('id', result.id);
          window.history.replaceState({}, '', newUrl);
          // Update local variable
          window.location.search = `?id=${result.id}`; 
        }
      } else {
        alert('保存失败: ' + result.error);
      }
    } catch (e) {
      alert('网络错误: ' + e.message);
    } finally {
      btnSave.textContent = originalBtnText;
      btnSave.disabled = false;
    }
  });
});
