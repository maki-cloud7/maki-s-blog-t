import { marked } from 'marked';
import { requireAuth, fetchGithubFile, saveGithubFile, parseJsData, stringifyJsData } from '/github-cms.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const urlParams = new URLSearchParams(window.location.search);
  let articleId = urlParams.get('id'); // null if new article
  
  let currentArticlesFileSha = null;
  let currentMdFileSha = null;

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
  const btnUploadContentFile = document.getElementById('btnUploadContentFile');
  const attachmentFileInput = document.getElementById('attachmentFileInput');

  // Generic upload logic
  async function uploadFileToGithub(file, isImage = true) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          showToast(`正在上传 ${file.name}...`);
          const base64Data = e.target.result.split(',')[1];
          const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
          const filename = Date.now() + '_' + (cleanName || 'file');
          const folder = isImage ? 'images' : 'files';
          const token = localStorage.getItem('github_token');
          
          const res = await fetch(`https://api.github.com/repos/maki-cloud7/maki-s-blog-t/contents/public/${folder}/${filename}`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `Upload ${isImage ? 'image' : 'file'} ${filename}`,
              content: base64Data,
              branch: 'main'
            })
          });
          
          if (!res.ok) throw new Error('Upload failed');
          resolve(`/${folder}/${filename}`);
        } catch (err) {
          reject(err.message);
        }
      };
      reader.onerror = () => reject('文件读取失败');
      reader.readAsDataURL(file);
    });
  }

  function insertToMdInput(markdown) {
    const startPos = mdInput.selectionStart;
    const endPos = mdInput.selectionEnd;
    mdInput.value = mdInput.value.substring(0, startPos) + markdown + mdInput.value.substring(endPos, mdInput.value.length);
    mdInput.selectionStart = mdInput.selectionEnd = startPos + markdown.length;
    mdInput.dispatchEvent(new Event('input')); // update preview
  }

  // Cover image upload
  btnUploadCover.addEventListener('click', () => coverFileInput.click());
  coverFileInput.addEventListener('change', async (e) => {
    if (!e.target.files.length) return;
    try {
      const url = await uploadFileToGithub(e.target.files[0], true);
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
      const url = await uploadFileToGithub(e.target.files[0], true);
      insertToMdInput(`\n![图片描述](${url})\n`);
      showToast('图片插入成功');
    } catch(err) {
      alert('上传失败: ' + err);
    }
    e.target.value = '';
  });

  // Content attachment file upload
  if (btnUploadContentFile) {
    btnUploadContentFile.addEventListener('click', () => attachmentFileInput.click());
    attachmentFileInput.addEventListener('change', async (e) => {
      if (!e.target.files.length) return;
      try {
        const file = e.target.files[0];
        const isImage = file.type.startsWith('image/');
        const url = await uploadFileToGithub(file, isImage);
        const markdown = isImage ? `\n![${file.name}](${url})\n` : `\n[下载文件：${file.name}](${url})\n`;
        insertToMdInput(markdown);
        showToast('附件插入成功');
      } catch(err) {
        alert('上传失败: ' + err);
      }
      e.target.value = '';
    });
  }

  // Handle paste events for cover image
  imageInput.addEventListener('paste', async (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
      const item = items[index];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        try {
          const url = await uploadFileToGithub(file, true);
          imageInput.value = url;
          showToast('封面粘贴上传成功');
        } catch(err) {
          alert('上传失败: ' + err);
        }
        break;
      }
    }
  });

  // Handle paste events for markdown content (images and files)
  mdInput.addEventListener('paste', async (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
      const item = items[index];
      if (item.kind === 'file') {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        try {
          const isImage = file.type.startsWith('image/');
          const url = await uploadFileToGithub(file, isImage);
          const markdown = isImage ? `\n![粘贴的图片](${url})\n` : `\n[下载文件：${file.name}](${url})\n`;
          insertToMdInput(markdown);
          showToast(isImage ? '图片粘贴插入成功' : '文件粘贴插入成功');
        } catch(err) {
          alert('上传失败: ' + err);
        }
        break; // Process one file per paste
      }
    }
  });

  // Handle Drag and Drop for Markdown Editor
  mdInput.addEventListener('dragover', (e) => {
    e.preventDefault();
    mdInput.style.backgroundColor = 'rgba(0,0,0,0.02)';
  });
  mdInput.addEventListener('dragleave', (e) => {
    e.preventDefault();
    mdInput.style.backgroundColor = '';
  });
  mdInput.addEventListener('drop', async (e) => {
    e.preventDefault();
    mdInput.style.backgroundColor = '';
    const files = e.dataTransfer.files;
    if (!files.length) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const isImage = file.type.startsWith('image/');
        const url = await uploadFileToGithub(file, isImage);
        const markdown = isImage ? `\n![${file.name}](${url})\n` : `\n[下载文件：${file.name}](${url})\n`;
        insertToMdInput(markdown);
        showToast(isImage ? '图片拖拽插入成功' : '文件拖拽插入成功');
      } catch(err) {
        alert('上传失败: ' + err);
      }
    }
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
  async function loadExistingArticle() {
    if (!articleId) return;
    try {
      showToast('正在从 GitHub 加载文章...');
      // 1. Fetch meta
      const fileData = await fetchGithubFile('articles.js');
      const articles = fileData ? parseJsData(fileData.content, 'articles') : [];
      currentArticlesFileSha = fileData ? fileData.sha : null;
      
      const meta = articles.find(a => a.id.toString() === articleId);
      
      if (meta) {
        titleInput.value = meta.title;
        dateInput.value = meta.date;
        tagsInput.value = meta.tags.join(', ');
        summaryInput.value = meta.summary || '';
        imageInput.value = meta.image || '';
      }

      // 2. Fetch markdown content
      const mdFile = await fetchGithubFile(`public/articles/${articleId}.md`);
      if (mdFile) {
        currentMdFileSha = mdFile.sha;
        mdInput.value = mdFile.content;
        mdInput.dispatchEvent(new Event('input')); // trigger preview
      }
      showToast('文章加载成功');
    } catch (e) {
      console.error("Failed to load article", e);
      alert('加载文章失败: ' + e.message);
    }
  }

  loadExistingArticle();

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
    
    const originalBtnText = btnSave.textContent;
    btnSave.textContent = '保存并同步至 GitHub...';
    btnSave.disabled = true;

    try {
      const isNew = !articleId;
      if (isNew) {
        articleId = Date.now().toString();
      }

      // 1. Save Markdown File
      await saveGithubFile(`public/articles/${articleId}.md`, mdInput.value, `Save article content ${articleId}`, currentMdFileSha);
      
      // Update sha for subsequent saves
      const newMdFile = await fetchGithubFile(`public/articles/${articleId}.md`);
      if (newMdFile) currentMdFileSha = newMdFile.sha;

      // 2. Update articles.js
      const fileData = await fetchGithubFile('articles.js');
      let articles = fileData ? parseJsData(fileData.content, 'articles') : [];
      
      if (isNew) {
        articles.unshift({
          id: articleId,
          title,
          date: dateInput.value,
          tags: tags.length > 0 ? tags : ['随笔'],
          summary: summaryInput.value.trim(),
          url: `/post.html?id=${articleId}`,
          image: imageInput.value.trim() || '/article1.jpg'
        });
      } else {
        const index = articles.findIndex(a => a.id.toString() === articleId.toString());
        if (index !== -1) {
          articles[index] = {
            ...articles[index],
            title,
            date: dateInput.value,
            tags: tags.length > 0 ? tags : ['随笔'],
            summary: summaryInput.value.trim(),
            image: imageInput.value.trim() || articles[index].image
          };
        }
      }

      await saveGithubFile('articles.js', stringifyJsData(articles, 'articles'), `Update article meta ${articleId}`, fileData ? fileData.sha : null);

      showToast('保存并发布成功！网页将在几分钟后自动更新。');
      
      if (isNew) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', articleId);
        window.history.replaceState({}, '', newUrl);
      }
    } catch (e) {
      alert('保存失败: ' + e.message);
    } finally {
      btnSave.textContent = originalBtnText;
      btnSave.disabled = false;
    }
  });
});
