import { articles } from './articles.js';
import { marked } from 'marked';
import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');

  // Find the article metadata
  const articleMeta = articles.find(a => a.id.toString() === articleId || a.slug === articleId);

  if (!articleMeta) {
    document.getElementById('postTitle').textContent = '未找到该文章';
    document.getElementById('postContainer').style.opacity = 1;
    return;
  }

  // Set meta data
  document.title = `${articleMeta.title} - 夏色绘卷`;
  document.getElementById('postTitle').textContent = articleMeta.title;
  
  const dateParts = articleMeta.date.split('-');
  const formattedDate = `${dateParts[0]}年${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日`;
  const tagsText = articleMeta.tags.join(' ');
  
  document.getElementById('postMeta').innerHTML = `<span>${formattedDate} &nbsp;/&nbsp; ${tagsText}</span>`;
  document.getElementById('postImage').src = articleMeta.image;

  try {
    // Fetch Markdown content
    const response = await fetch(`/articles/${articleMeta.id}.md`);
    if (!response.ok) throw new Error('Markdown file not found');
    const markdownText = await response.text();

    // Render Markdown to HTML
    const htmlContent = marked.parse(markdownText);
    const postBody = document.getElementById('postBody');
    postBody.innerHTML = htmlContent;

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
