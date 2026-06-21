import { articles } from './articles.js';
import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const tagsContainer = document.getElementById('tagsContainer');
  const archiveTimeline = document.getElementById('archiveTimeline');
  const backToTop = document.getElementById('backToTop');

  let currentTag = 'all';
  let currentSearch = '';

  // Extract all unique tags
  const allTags = new Set();
  articles.forEach(article => {
    article.tags.forEach(tag => allTags.add(tag));
  });

  // Render Tags
  Array.from(allTags).sort().forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'tag-btn';
    btn.dataset.tag = tag;
    btn.textContent = tag;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTag = tag;
      renderTimeline();
    });
    tagsContainer.appendChild(btn);
  });

  // Default "All" button
  const allBtn = document.querySelector('.tag-btn[data-tag="all"]');
  allBtn.addEventListener('click', () => {
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    allBtn.classList.add('active');
    currentTag = 'all';
    renderTimeline();
  });

  // Search input
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    renderTimeline();
  });

  // Render Logic
  function renderTimeline() {
    archiveTimeline.innerHTML = '';

    const filteredArticles = articles.filter(article => {
      const matchTag = currentTag === 'all' || article.tags.includes(currentTag);
      const matchSearch = currentSearch === '' || 
                          article.title.toLowerCase().includes(currentSearch) || 
                          article.summary.toLowerCase().includes(currentSearch);
      return matchTag && matchSearch;
    });

    if (filteredArticles.length === 0) {
      archiveTimeline.innerHTML = '<div class="no-results">没有找到符合条件的记忆碎片...</div>';
      return;
    }

    // Sort by date descending
    filteredArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group by Year only
    const grouped = {};
    filteredArticles.forEach(article => {
      const dateObj = new Date(article.date);
      const yearGroup = `${dateObj.getFullYear()}年`;
      if (!grouped[yearGroup]) { grouped[yearGroup] = []; }
      grouped[yearGroup].push(article);
    });

    for (const [yearGroup, items] of Object.entries(grouped)) {
      const groupId = `group-${yearGroup.replace(/\s+/g, '')}`;
      
      const groupDiv = document.createElement('div');
      groupDiv.className = 'timeline-group';
      groupDiv.id = groupId;

      const title = document.createElement('h2');
      title.className = 'group-title';
      title.innerHTML = `${yearGroup} <span style="font-size: 0.9rem; margin-left: 10px; color: #95a5a6; font-family: var(--font-sans);">(${items.length} 篇)</span>`;
      groupDiv.appendChild(title);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'group-content';

      items.forEach(article => {
        const a = document.createElement('a');
        a.href = article.url;
        a.className = 'timeline-item';
        const tagsHtml = article.tags.map(t => `<span class="item-tag">${t}</span>`).join('');
        a.innerHTML = `
          <div class="item-img"><img src="${article.image}" alt="封面" onerror="this.src='https://picsum.photos/400/300?anime'"></div>
          <div class="item-content">
            <div class="item-date">${article.date}</div>
            <h3 class="item-title">${article.title}</h3>
            <p class="item-summary">${article.summary}</p>
            <div class="item-tags">${tagsHtml}</div>
          </div>
        `;
        contentDiv.appendChild(a);
      });

      groupDiv.appendChild(contentDiv);
      archiveTimeline.appendChild(groupDiv);
    }
    
    initAccordions();
  }

  function initAccordions() {
    const groups = document.querySelectorAll('.timeline-group');
    groups.forEach((group, index) => {
      const title = group.querySelector('.group-title');
      const content = group.querySelector('.group-content');
      
      // 默认：第一组展开，其余组折叠
      if (index !== 0) {
        group.classList.add('collapsed');
        gsap.set(content, { height: 0, opacity: 0 });
      }

      title.addEventListener('click', () => {
        const isCollapsed = group.classList.contains('collapsed');
        if (isCollapsed) {
          group.classList.remove('collapsed');
          gsap.to(content, { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' });
        } else {
          group.classList.add('collapsed');
          gsap.to(content, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.inOut' });
        }
      });
    });
  }

  // Back to Top Logic
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Initial render
  renderTimeline();
});
