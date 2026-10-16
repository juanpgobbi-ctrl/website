/* Juan Gobbi — Medical Aesthetics Berlin */
/* Claude can do it better — Main JS */

'use strict';

/* ─── Navigation ──────────────────────────────────────────────────── */
class Nav {
  constructor() {
    this.nav        = document.querySelector('.nav');
    this.hamburger  = document.querySelector('.nav__hamburger');
    this.overlay    = document.querySelector('.nav__mobile-overlay');
    this.lastY      = 0;
    this.ticking    = false;

    if (!this.nav) return;
    this.init();
  }

  init() {
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });

    if (this.hamburger && this.overlay) {
      this.hamburger.addEventListener('click', () => this.toggleMenu());

      // Close overlay when a link inside is clicked
      this.overlay.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => this.closeMenu())
      );
    }
  }

  onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y > this.lastY && y > 80) {
        this.nav.classList.add('nav--hidden');
      } else {
        this.nav.classList.remove('nav--hidden');
      }
      this.lastY = y;
      this.ticking = false;
    });
  }

  toggleMenu() {
    const open = this.overlay.classList.toggle('is-open');
    this.hamburger.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  closeMenu() {
    this.overlay.classList.remove('is-open');
    this.hamburger.classList.remove('is-open');
    document.body.style.overflow = '';
  }
}

/* ─── FAQ Accordion ───────────────────────────────────────────────── */
class Accordion {
  constructor(selector) {
    this.triggers = Array.from(document.querySelectorAll(selector));
    if (!this.triggers.length) return;
    this.init();
  }

  init() {
    this.triggers.forEach(trigger => {
      trigger.addEventListener('click', () => this.toggle(trigger));
      trigger.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle(trigger);
        }
      });
    });
  }

  toggle(trigger) {
    const isOpen   = trigger.getAttribute('aria-expanded') === 'true';
    const body     = trigger.nextElementSibling;

    // Close all
    this.triggers.forEach(t => {
      if (t !== trigger) {
        t.setAttribute('aria-expanded', 'false');
        const b = t.nextElementSibling;
        if (b) this.close(b);
      }
    });

    if (isOpen) {
      trigger.setAttribute('aria-expanded', 'false');
      this.close(body);
    } else {
      trigger.setAttribute('aria-expanded', 'true');
      this.open(body);
    }
  }

  open(body) {
    const inner  = body.querySelector('.faq-body__inner');
    const height = inner ? inner.scrollHeight : body.scrollHeight;
    body.style.height = height + 'px';
    body.classList.add('is-open');
    body.addEventListener('transitionend', () => {
      if (body.classList.contains('is-open')) body.style.height = 'auto';
    }, { once: true });
  }

  close(body) {
    if (!body) return;
    body.style.height = body.scrollHeight + 'px';
    body.offsetHeight; // force reflow
    body.style.height = '0';
    body.classList.remove('is-open');
  }
}

/* ─── Reveal on scroll ────────────────────────────────────────────── */
class Reveal {
  constructor() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger siblings in the same section
          const section = entry.target.closest('section, .reveal-group');
          const siblings = section
            ? Array.from(section.querySelectorAll('.reveal:not(.is-visible)'))
            : [];
          const delay = siblings.indexOf(entry.target);

          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, Math.max(0, delay * 80));

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => observer.observe(el));
  }
}

/* ─── Smooth scrolling for anchor links ───────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ─── Mark active nav link ────────────────────────────────────────── */
function markActiveNavLink() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    // Strip trailing slash and filename for comparison
    const linkFile = href.split('/').pop().replace('.html', '');
    const pathFile = path.split('/').pop().replace('.html', '');
    if (
      (linkFile === pathFile && linkFile !== '') ||
      (linkFile === 'index' && (pathFile === '' || pathFile === 'index'))
    ) {
      link.classList.add('nav__link--active');
    }
  });
}

/* ─── Treatment Carousel ──────────────────────────────────────────── */
// On phones one card is shown with the next one peeking in, plus position dots,
// so it is obvious that the row can be swiped.
const DOT_LABEL = { de: 'Karte', en: 'Card', es: 'Tarjeta' };

class Carousel {
  constructor(trackId) {
    this.track   = document.getElementById(trackId);
    if (!this.track) return;
    this.wrap    = this.track.parentElement;
    this.section = this.track.closest('.treatment-carousel');
    this.btnPrev = this.section && this.section.querySelector('.carousel-btn--prev');
    this.btnNext = this.section && this.section.querySelector('.carousel-btn--next');
    this.cards   = Array.from(this.track.children);
    this.current = 0;
    this.dots    = document.createElement('div');
    this.dots.className = 'carousel-dots';
    if (this.section) this.section.after(this.dots);
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
    if (this.btnPrev) this.btnPrev.addEventListener('click', () => this.prev());
    if (this.btnNext) this.btnNext.addEventListener('click', () => this.next());
    // Touch / swipe
    let startX = 0;
    this.track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    this.track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 35) diff > 0 ? this.next() : this.prev();
    });
  }

  isPhone() { return window.innerWidth < 600; }

  visible() {
    return window.innerWidth >= 992 ? 3 : window.innerWidth >= 600 ? 2 : 1;
  }

  cardWidth() {
    // Phones: 84 % so the next card peeks in from the right
    return this.isPhone() ? this.wrap.offsetWidth * 0.84 : this.wrap.offsetWidth / this.visible();
  }

  maxSlide() {
    return Math.max(0, this.cards.length - this.visible());
  }

  buildDots() {
    const count = this.maxSlide() + 1;
    if (this.dots.children.length === count) return;
    const label = DOT_LABEL[document.documentElement.lang] || DOT_LABEL.en;
    this.dots.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `${label} ${i + 1} / ${count}`);
      dot.addEventListener('click', () => this.goTo(i));
      this.dots.appendChild(dot);
    }
  }

  resize() {
    const cardW = this.cardWidth();
    this.cards.forEach(c => { c.style.width = cardW + 'px'; c.style.flexBasis = cardW + 'px'; });
    this.buildDots();
    this.goTo(Math.min(this.current, this.maxSlide()));
  }

  goTo(idx) {
    this.current = Math.max(0, Math.min(idx, this.maxSlide()));
    const cardW  = this.cardWidth();
    const maxOffset = Math.max(0, cardW * this.cards.length - this.wrap.offsetWidth);
    this.track.style.transform = `translateX(${-Math.min(this.current * cardW, maxOffset)}px)`;

    // Update active cards
    const visibleCount = this.visible();
    this.cards.forEach((card, i) => {
      card.classList.toggle('is-active', i >= this.current && i < this.current + visibleCount);
    });
    Array.from(this.dots.children).forEach((dot, i) => {
      dot.classList.toggle('is-active', i === this.current);
      if (i === this.current) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
    });

    if (this.btnPrev) this.btnPrev.disabled = (this.current === 0);
    if (this.btnNext) this.btnNext.disabled = (this.current === this.maxSlide());
  }

  prev() { this.goTo(this.current - 1); }
  next() { this.goTo(this.current + 1); }
}

/* ─── FAQ Group Accordion (two-level) ────────────────────────────── */
class GroupAccordion {
  constructor() {
    this.triggers = Array.from(document.querySelectorAll('.faq-group__trigger'));
    if (!this.triggers.length) return;
    // Open the group named in the URL hash (links from treatment modals), else the first
    const target = location.hash && document.getElementById(location.hash.slice(1));
    const fromHash = target && target.querySelector('.faq-group__trigger');
    const first = fromHash || this.triggers[0];
    if (first) {
      first.setAttribute('aria-expanded', 'true');
      const body = first.nextElementSibling;
      if (body) { body.style.height = 'auto'; body.classList.add('is-open'); }
    }
    this.init();
  }

  init() {
    this.triggers.forEach(trigger => {
      trigger.addEventListener('click', () => this.toggle(trigger));
      trigger.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggle(trigger); }
      });
    });
  }

  toggle(trigger) {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    // Close all groups first
    this.triggers.forEach(t => {
      if (t !== trigger) {
        t.setAttribute('aria-expanded', 'false');
        const b = t.nextElementSibling;
        if (b) this.close(b);
      }
    });
    if (isOpen) {
      trigger.setAttribute('aria-expanded', 'false');
      this.close(trigger.nextElementSibling);
    } else {
      trigger.setAttribute('aria-expanded', 'true');
      this.open(trigger.nextElementSibling);
    }
  }

  open(body) {
    if (!body) return;
    const inner  = body.querySelector('.faq-list');
    const height = inner ? inner.scrollHeight : body.scrollHeight;
    body.style.height = height + 'px';
    body.classList.add('is-open');
    body.addEventListener('transitionend', () => {
      if (body.classList.contains('is-open')) body.style.height = 'auto';
    }, { once: true });
  }

  close(body) {
    if (!body) return;
    body.style.height = body.scrollHeight + 'px';
    body.offsetHeight; // force reflow
    body.style.height = '0';
    body.classList.remove('is-open');
  }
}

/* ─── Modal (treatment detail popups) ─────────────────────────────── */
class Modals {
  constructor() {
    this.triggers = Array.from(document.querySelectorAll('[data-modal]'));
    this.modals   = Array.from(document.querySelectorAll('.modal'));
    if (!this.triggers.length) return;
    this.lastFocus = null;
    this.init();
  }

  init() {
    this.triggers.forEach(t =>
      t.addEventListener('click', () => this.open(t.getAttribute('data-modal'), t))
    );
    this.modals.forEach(m => {
      m.addEventListener('click', e => {
        if (e.target === m || e.target.closest('[data-close]')) this.close(m);
      });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const open = this.modals.find(m => m.classList.contains('is-open'));
        if (open) this.close(open);
      }
    });
  }

  open(id, trigger) {
    const modal = document.getElementById(id);
    if (!modal) return;
    this.lastFocus = trigger || document.activeElement;
    modal.inert = false;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const close = modal.querySelector('.modal__close');
    if (close) close.focus();
  }

  close(modal) {
    modal.classList.remove('is-open');
    modal.inert = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (this.lastFocus) this.lastFocus.focus();
  }
}

/* ─── Facial treatment map (link points ↔ list) ──────────────────── */
class FaceMap {
  constructor() {
    this.root = document.querySelector('.face-map');
    if (!this.root) return;
    this.points = Array.from(this.root.querySelectorAll('.face-point'));
    this.items  = Array.from(this.root.querySelectorAll('.face-map__item'));
    this.init();
  }

  init() {
    const bind = (el) => {
      const zone = el.getAttribute('data-zone');
      el.addEventListener('mouseenter', () => this.activate(zone));
      el.addEventListener('mouseleave', () => this.activate(null));
      el.addEventListener('focus', () => this.activate(zone));
      el.addEventListener('click', () => this.activate(zone));
    };
    this.points.forEach(bind);
    this.items.forEach(bind);
  }

  activate(zone) {
    [...this.points, ...this.items].forEach(el => {
      el.classList.toggle('is-active', zone !== null && el.getAttribute('data-zone') === zone);
    });
  }
}

/* ─── Init ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  new Nav();
  new Accordion('.faq-trigger');
  new GroupAccordion();
  new Carousel('treatmentTrack');
  new Reveal();
  new Modals();
  new FaceMap();
  initSmoothScroll();
  markActiveNavLink();
});
