/* ============================================
   LEBAS FASHION — Firebase Configuration
   ============================================ */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9dNkzUlRsH0QA60vDJi0b1jCftMP7yP4",
  authDomain: "lebas-fashion.firebaseapp.com",
  databaseURL: "https://lebas-fashion-default-rtdb.firebaseio.com",
  projectId: "lebas-fashion",
  storageBucket: "lebas-fashion.firebasestorage.app",
  messagingSenderId: "176030609820",
  appId: "1:176030609820:web:a3274fb1d0472168d89859",
  measurementId: "G-CEFDLZP6V0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase Services
const db = firebase.database();
let auth = null;
try {
  auth = firebase.auth();
} catch (e) {
  // Auth SDK not loaded (e.g. on client dashboard)
}

// ============================================
// SHARED UTILITIES
// ============================================

/**
 * Generate a unique ID (push-key style)
 */
function generateId() {
  return db.ref().push().key;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 3000);
}

/**
 * Play a synthesized notification "ding" sound
 */
function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08); // A6
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

/**
 * Lazy load images using IntersectionObserver
 */
function initLazyLoad() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
        }
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '100px' });

  document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
  return observer;
}

/**
 * Initialize scroll reveal animations
 */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  return observer;
}

/**
 * Apply theme colors from database
 */
function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  if (theme.primary) {
    root.style.setProperty('--primary', theme.primary);
    // Generate lighter/darker variants
    root.style.setProperty('--admin-primary', theme.primary);
  }
  if (theme.secondary) {
    root.style.setProperty('--secondary', theme.secondary);
  }
}

/**
 * Format price with currency
 */
function formatPrice(price) {
  return `Rs. ${Number(price).toLocaleString('en-IN')}`;
}

/**
 * Debounce helper
 */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Create element helper
 */
function createElement(tag, className, innerHTML) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

