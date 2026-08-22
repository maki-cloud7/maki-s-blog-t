import { articles } from './articles.js';
import { marked } from 'marked';
import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');

  // Find the article metadata
  const articleMeta = articles.find(a => a.id.toString() === articleId || a.slug === articleId);
  const isLoggedIn = !!localStorage.getItem('github_token');

  if (!articleMeta) {
    document.getElementById('postTitle').textContent = '未找到该文章';
    document.getElementById('postContainer').style.opacity = 1;
    return;
  }

  // Handle private article for non-logged-in visitors
  if (articleMeta.isPrivate && !isLoggedIn) {
    document.title = '私密文章 - 夏色绘卷';
    document.getElementById('postTitle').textContent = '🔒 私密文章';
    document.getElementById('postMeta').innerHTML = '';
    const tocWrapper = document.querySelector('.article-toc-wrapper');
    if (tocWrapper) tocWrapper.style.display = 'none';
    
    document.getElementById('postBody').innerHTML = `
      <div style="text-align: center; padding: 60px 20px; background: rgba(255, 255, 255, 0.7); border-radius: 12px; border: 1px dashed rgba(0,0,0,0.1); margin-top: 30px;">
        <div style="font-size: 3rem; margin-bottom: 15px;">🔒</div>
        <h3 style="font-family: var(--font-serif); color: #2c3e50; margin-bottom: 10px;">这是一篇私密文章</h3>
        <p style="color: #7f8c8d; font-size: 0.95rem; margin-bottom: 25px;">该文章已被作者设为私密状态，仅博主登录后方可阅读。</p>
        <a href="/admin.html" class="btn-primary" style="display: inline-block; padding: 10px 24px; border-radius: 20px; background: var(--primary-color); color: white; text-decoration: none; font-weight: 500;">前往管理后台验证身份</a>
      </div>
    `;
    gsap.to('#postContainer', { opacity: 1, duration: 0.8, ease: "power2.out" });
    return;
  }

  // Set meta data
  document.title = `${articleMeta.isPrivate ? '[私密] ' : ''}${articleMeta.title} - 夏色绘卷`;
  document.getElementById('postTitle').innerHTML = `${articleMeta.isPrivate ? '<span style="display: inline-block; padding: 2px 10px; font-size: 0.75em; border-radius: 6px; background: #fff3cd; color: #d63031; border: 1px solid #ffeeba; vertical-align: middle; margin-right: 10px;">🔒 私密</span>' : ''}${articleMeta.title}`;
  
  const dateParts = articleMeta.date.split('-');
  const formattedDate = `${dateParts[0]}年${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日`;
  const tagsText = articleMeta.tags.join(' ');
  
  document.getElementById('postMeta').innerHTML = `
    <span>${formattedDate} &nbsp;/&nbsp; ${tagsText}</span>
    ${articleMeta.isPrivate ? '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; font-size: 0.8rem; background: #fff3cd; color: #d63031; border: 1px solid #ffeeba; border-radius: 12px; font-weight: bold; margin-left: 8px;">🔒 仅博主可见</span>' : ''}
  `;
  document.getElementById('postImage').src = articleMeta.image;

  try {
    // Fetch Markdown content
    const response = await fetch(`/articles/${articleMeta.id}.md`);
    if (!response.ok) throw new Error('Markdown file not found');
    const markdownText = await response.text();

    // Render Markdown to HTML
    const htmlContent = marked.parse(markdownText);
    const postBody = document.getElementById('postBody');
    
    const privateBannerHtml = articleMeta.isPrivate ? `
      <div style="background: rgba(231, 76, 60, 0.06); border: 1px dashed rgba(231, 76, 60, 0.35); border-radius: 8px; padding: 12px 18px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <span style="color: #c0392b; font-size: 0.9rem; font-weight: 500;">🔒 <strong>私密模式</strong>：本文当前处于私密状态，仅您（博主）登录后可见。</span>
        <a href="/editor.html?id=${articleMeta.id}" style="color: var(--primary-color); font-size: 0.85rem; font-weight: 600; text-decoration: underline;">✏️ 编辑或设为公开</a>
      </div>
    ` : '';
    
    postBody.innerHTML = privateBannerHtml + htmlContent;

    // Generate TOC
    generateTOC(postBody);

    // Fade in
    gsap.to('#postContainer', { opacity: 1, duration: 0.8, ease: "power2.out" });

  } catch (error) {
    console.error('Error loading markdown:', error);
    document.getElementById('postBody').innerHTML = '<p>抱歉，文章内容加载失败。</p>';
    document.getElementById('postContainer').style.opacity = 1;
  }
});

function generateTOC(postBody) {
  const tocList = document.getElementById('tocList');
  const headings = postBody.querySelectorAll('h2, h3');
  const tocWrapper = document.querySelector('.article-toc-wrapper');
  
  if (headings.length === 0) {
    tocWrapper.style.display = 'none';
    return;
  }

  tocWrapper.style.display = 'block';
  const tocItems = [];

  headings.forEach((heading, index) => {
    // Assign ID to heading for anchoring
    const id = `heading-${index}`;
    heading.id = id;

    const li = document.createElement('li');
    li.className = `toc-item toc-${heading.tagName.toLowerCase()}`;
    
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.textContent = heading.textContent;
    a.className = 'toc-link';
    
    // Smooth scroll
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const yOffset = -120; // Account for fixed navbar
      const y = heading.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });

    li.appendChild(a);
    tocList.appendChild(li);
    tocItems.push({ element: heading, link: a });
  });

  // Setup ScrollSpy with IntersectionObserver
  setupScrollSpy(tocItems);
}

function setupScrollSpy(tocItems) {
  // Use IntersectionObserver with a specific rootMargin
  // The negative top and bottom margins mean the intersection occurs in the center of the viewport
  const observerOptions = {
    root: null,
    rootMargin: '-100px 0px -60% 0px', 
    threshold: 0
  };

  let activeLink = null;

  const observer = new IntersectionObserver((entries) => {
    // Handle entries that are intersecting
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const match = tocItems.find(item => item.element === entry.target);
        if (match) {
          if (activeLink) activeLink.classList.remove('active');
          match.link.classList.add('active');
          activeLink = match.link;
        }
      }
    });
  }, observerOptions);

  tocItems.forEach(item => {
    observer.observe(item.element);
  });
  
  // Highlight the first item initially if it's visible or above fold
  if (tocItems.length > 0) {
      activeLink = tocItems[0].link;
      activeLink.classList.add('active');
  }
}
