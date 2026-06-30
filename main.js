import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { social } from './social.js';

gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// Integrate Lenis with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// --- Animations ---

document.addEventListener("DOMContentLoaded", () => {
  // Hero Parallax Effect
  if (document.querySelector(".hero") && document.querySelector("#heroBg")) {
    gsap.to("#heroBg", {
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      } 
    });
  }

  // Typewriter effect moved to index-client.js for Galgame system
  // Fade Up Elements with ScrollTrigger
  const fadeUpElements = document.querySelectorAll(".gsap-fade-up");
  
  fadeUpElements.forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%", // Trigger when element is 85% from top of viewport
        toggleActions: "play none none none"
      }
    });
  });
  
  // Navbar blur effect on scroll
  const navbar = document.querySelector('.navbar');
  ScrollTrigger.create({
    start: 'top -50',
    end: 99999,
    toggleClass: {className: 'scrolled', targets: navbar}
  });

  // Mobile Hamburger Menu Injection
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelector('.nav-links');
  if (navbar && navLinks && window.innerWidth <= 768) {
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    navbar.appendChild(hamburger);
    
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // Inject Social Links
  const githubLink = document.querySelector('a[aria-label="GitHub"]');
  if (githubLink && social.github !== "#") {
    githubLink.href = social.github;
    githubLink.target = "_blank";
  }
  
  const bilibiliLink = document.querySelector('a[aria-label="Bilibili"]');
  if (bilibiliLink && social.bilibili !== "#") {
    bilibiliLink.href = social.bilibili;
    bilibiliLink.target = "_blank";
  }
  
  const qqLink = document.querySelector('a[aria-label="QQ"]');
  if (qqLink && social.qq !== "#") {
    qqLink.href = social.qq;
    qqLink.target = "_blank";
  }
  
  const telegramLink = document.querySelector('a[aria-label="Telegram"]');
  if (telegramLink && social.telegram !== "#") {
    telegramLink.href = social.telegram;
    telegramLink.target = "_blank";
  }
});
