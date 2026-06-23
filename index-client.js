import { articles } from './articles.js';
import { gsap } from 'gsap';

// --- Galgame Logic ---
const galgameNodes = {
  intro: {
    text: "欢迎来到我的网站，我会在这里分享各种东西，以文字为载体。",
    characterImg: "/images/mascot_base.png",
    nextNode: "next1",
    options: []
  },
  next1: {
    text: "往下拉可以看到最近三篇文章以及我的联系方式",
    characterImg: "/images/mascot_explaining.png",
    options: [
      { label: "了解更多我的信息", targetNode: "menu" },
      { label: "离开", targetNode: "leave" }
    ]
  },
  menu: {
    text: "你想了解什么呢？",
    characterImg: "/images/mascot_curious.png",
    options: [
      { label: "我的梦想", targetNode: "dream" },
      { label: "我平时喜欢做的事情", targetNode: "hobbies" },
      { label: "离开", targetNode: "leave" }
    ]
  },
  hobbies: {
    text: "发呆，音乐，独立游戏，编曲，玄学，很多都还是刚刚开始。",
    characterImg: "/images/mascot_shy.png",
    options: [
      { label: "了解更多我的信息", targetNode: "menu" },
      { label: "离开", targetNode: "leave" }
    ]
  },
  dream: {
    text: "在未来开一家唱片店",
    characterImg: "/images/mascot_shy.png",
    options: [
      { label: "了解更多我的信息", targetNode: "menu" },
      { label: "离开", targetNode: "leave" }
    ]
  },
  leave: {
    text: "期待下次再见~",
    characterImg: "/images/mascot_farewell.png",
    options: []
  }
};

let typewriterTimeout;
let isTyping = false;
let currentText = "";
let currentIndex = 0;
let targetText = "";
let currentNodeData = null;
let galgameHistory = [];
let currentGalgameNodeId = null;

function renderGalgameNode(nodeId, isBack = false) {
  const node = galgameNodes[nodeId];
  if (!node) return;
  
  if (!isBack && currentGalgameNodeId) {
    galgameHistory.push(currentGalgameNodeId);
  }
  currentGalgameNodeId = nodeId;
  currentNodeData = node;
  
  const backBtn = document.getElementById("dialogueBackBtn");
  if (backBtn) {
    backBtn.style.display = galgameHistory.length > 0 ? "block" : "none";
  }
  
  // Update Character Image with Fade
  const charImg = document.getElementById("heroCharacter");
  
  if (charImg && charImg.src.indexOf(node.characterImg) === -1) {
    charImg.style.opacity = 0;
    setTimeout(() => {
      charImg.src = node.characterImg;
      charImg.onload = () => { charImg.style.opacity = 1; };
    }, 400); // Wait for fade out
  }
  
  // Clear options
  const optionsContainer = document.getElementById("galgameOptions");
  if (optionsContainer) {
    optionsContainer.innerHTML = "";
  }
  
  // Start Typewriter
  const textElement = document.getElementById("typewriterText");
  const indicator = document.getElementById("dialogueIndicator");
  if (textElement) {
    clearTimeout(typewriterTimeout);
    targetText = node.text;
    textElement.textContent = "";
    currentIndex = 0;
    isTyping = true;
    if (indicator) indicator.style.display = 'none';
    
    function typeWriter() {
      if (currentIndex < targetText.length) {
        textElement.textContent += targetText.charAt(currentIndex);
        currentIndex++;
        typewriterTimeout = setTimeout(typeWriter, 50);
      } else {
        isTyping = false;
        if (indicator) indicator.style.display = 'block';
        showOptions(node.options);
      }
    }
    typeWriter();
  }
}

function finishTypingInstantly() {
  if (isTyping && currentNodeData) {
    clearTimeout(typewriterTimeout);
    const textElement = document.getElementById("typewriterText");
    const indicator = document.getElementById("dialogueIndicator");
    if (textElement) {
      textElement.textContent = targetText;
    }
    isTyping = false;
    if (indicator) indicator.style.display = 'block';
    showOptions(currentNodeData.options);
  }
}

function showOptions(options) {
  const optionsContainer = document.getElementById("galgameOptions");
  if (!optionsContainer || !options || options.length === 0) return;
  
  optionsContainer.innerHTML = ""; // Ensure empty
  
  options.forEach((opt, index) => {
    const btn = document.createElement("button");
    btn.className = "galgame-option-inline-btn";
    btn.textContent = "▶ " + opt.label;
    btn.style.animationDelay = `${index * 0.15}s`;
    btn.onclick = (e) => {
      e.stopPropagation(); // prevent triggering the dialogue box click
      renderGalgameNode(opt.targetNode);
    };
    optionsContainer.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Init Galgame
  const dialogueBox = document.getElementById("dialogueBox");
  const backBtn = document.getElementById("dialogueBackBtn");
  
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent clicking dialogue box
      if (galgameHistory.length > 0) {
        clearTimeout(typewriterTimeout);
        isTyping = false;
        const prevNodeId = galgameHistory.pop();
        renderGalgameNode(prevNodeId, true);
      }
    });
  }

  if (dialogueBox) {
    dialogueBox.addEventListener("click", () => {
      if (isTyping) {
        finishTypingInstantly();
      } else if (currentNodeData && currentNodeData.nextNode) {
        renderGalgameNode(currentNodeData.nextNode);
      }
    });
    // Start first node
    setTimeout(() => {
      renderGalgameNode("intro");
    }, 800);
  }


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
