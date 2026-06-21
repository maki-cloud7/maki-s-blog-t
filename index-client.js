import { articles } from './articles.js';
import { gsap } from 'gsap';

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("recentArticlesContainer");
  if (container) {
    const recentArticles = articles.slice(0, 2);
    
    container.innerHTML = recentArticles.map(article => `
      <article class="card article-card gsap-fade-up dynamic-fade-up">
        <div class="card-img">
          <a href="${article.url}">
            <img src="${article.image}" alt="文章插图" onerror="this.src='https://picsum.photos/800/400?school'">
          </a>
        </div>
        <div class="card-content">
          <h3><a href="${article.url}" style="color: inherit; text-decoration: none;">${article.title}</a></h3>
          <p>${article.summary || '这是一段被隐藏在时光里的文字...'}</p>
          <span class="date">${article.date}</span>
        </div>
      </article>
    `).join('');

    // Trigger GSAP for dynamically added elements to ensure they animate properly
    setTimeout(() => {
      document.querySelectorAll(".dynamic-fade-up").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none"
          }
        });
      });
    }, 50);
  }
});
