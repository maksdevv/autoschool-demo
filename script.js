/* ==========================================================
   DRIVE SCHOOL — скрипти
   ========================================================== */

(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Шапка та мобільне меню ---------- */
  var header = $('#header');
  var burger = $('#burger');
  var nav = $('#nav');

  function onScrollHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  function setMenu(open) {
    burger.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    document.body.classList.toggle('no-scroll', open);
  }

  burger.addEventListener('click', function () {
    setMenu(!nav.classList.contains('is-open'));
  });

  $$('.nav a, .nav button').forEach(function (el) {
    el.addEventListener('click', function () { setMenu(false); });
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && nav.classList.contains('is-open')) setMenu(false);
  });

  /* ---------- Плавна прокрутка та активний пункт меню ---------- */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  var sections = $$('main section[id]');
  var navLinks = $$('.nav__link');

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- Анімації появи при прокрутці ---------- */
  var revealItems = $$('.reveal');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  /* ---------- Резервні заглушки для зображень ---------- */
  function createPlaceholder(label) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560">' +
        '<defs>' +
          '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#0a1f44"/><stop offset="1" stop-color="#2f80ed"/>' +
          '</linearGradient>' +
          '<linearGradient id="car" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#e0f2fe"/><stop offset="1" stop-color="#7dd3fc"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<rect width="800" height="560" fill="url(#bg)"/>' +
        '<circle cx="640" cy="120" r="120" fill="#38bdf8" opacity=".18"/>' +
        '<rect x="0" y="410" width="800" height="150" fill="#061330" opacity=".55"/>' +
        '<g stroke="#ffffff" stroke-opacity=".35" stroke-width="6" stroke-dasharray="40 30">' +
          '<line x1="0" y1="490" x2="800" y2="490"/>' +
        '</g>' +
        '<path d="M150 360 L205 255 Q222 225 258 225 H500 Q534 225 556 252 L612 330 Q650 340 650 378 V405 H150 Z" fill="url(#car)"/>' +
        '<path d="M232 262 H342 V328 H196 Z M368 262 H500 Q516 262 528 278 L560 328 H368 Z" fill="#0a1f44" opacity=".78"/>' +
        '<circle cx="258" cy="405" r="48" fill="#061330"/><circle cx="258" cy="405" r="22" fill="#cbd5e1"/>' +
        '<circle cx="540" cy="405" r="48" fill="#061330"/><circle cx="540" cy="405" r="22" fill="#cbd5e1"/>' +
        '<rect x="606" y="352" width="30" height="14" rx="6" fill="#fde68a"/>' +
        '<text x="400" y="86" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff" opacity=".92">' +
          label.replace(/&/g, '&amp;').replace(/</g, '&lt;') +
        '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  $$('img[data-fallback]').forEach(function (img) {
    var applied = false;
    function useFallback() {
      if (applied) return;
      applied = true;
      img.src = createPlaceholder(img.getAttribute('data-fallback') || 'DRIVE SCHOOL');
    }
    img.addEventListener('error', useFallback);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) useFallback();
  });

  /* ---------- Модальне вікно та форма заявки ---------- */
  var modal = $('#modal');
  var formView = $('#form-view');
  var successView = $('#success-view');
  var form = $('#lead-form');
  var nameInput = $('#name');
  var phoneInput = $('#phone');
  var categorySelect = $('#category');
  var successName = $('#success-name');
  var lastFocused = null;

  function openModal(category) {
    lastFocused = document.activeElement;
    resetForm();
    if (category) {
      var exists = $$('option', categorySelect).some(function (opt) { return opt.value === category; });
      if (exists) categorySelect.value = category;
    }
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    setTimeout(function () { nameInput.focus(); }, 60);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function resetForm() {
    form.reset();
    formView.hidden = false;
    successView.hidden = true;
    clearError(nameInput, 'name-error');
    clearError(phoneInput, 'phone-error');
  }

  $$('[data-open-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(btn.getAttribute('data-category'));
    });
  });

  $$('[data-close-modal]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function (event) {
    if (modal.hidden) return;
    if (event.key === 'Escape') {
      closeModal();
    } else if (event.key === 'Tab') {
      trapFocus(event);
    }
  });

  function trapFocus(event) {
    var focusable = $$('button, input, select, a[href]', modal).filter(function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* --- Валідація --- */
  function setError(input, errorId, message) {
    input.closest('.field').classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
    document.getElementById(errorId).textContent = message;
  }

  function clearError(input, errorId) {
    input.closest('.field').classList.remove('has-error');
    input.removeAttribute('aria-invalid');
    document.getElementById(errorId).textContent = '';
  }

  function validateName() {
    var value = nameInput.value.trim();
    if (value.length < 2) {
      setError(nameInput, 'name-error', 'Вкажіть ваше ім’я (щонайменше 2 символи).');
      return false;
    }
    if (!/^[A-Za-zА-Яа-яІіЇїЄєҐґ'’ʼ\-\s]+$/.test(value)) {
      setError(nameInput, 'name-error', 'Ім’я має містити лише літери.');
      return false;
    }
    clearError(nameInput, 'name-error');
    return true;
  }

  function validatePhone() {
    var raw = phoneInput.value.trim();
    var digits = raw.replace(/\D/g, '');
    var onlyAllowedChars = /^[+\d\s()\-]+$/.test(raw);
    var valid = onlyAllowedChars && (
      (digits.length === 12 && digits.indexOf('380') === 0) ||
      (digits.length === 10 && digits.charAt(0) === '0')
    );

    if (!raw) {
      setError(phoneInput, 'phone-error', 'Вкажіть номер телефону.');
      return false;
    }
    if (!valid) {
      setError(phoneInput, 'phone-error', 'Введіть коректний номер, наприклад +380 67 123 45 67.');
      return false;
    }
    clearError(phoneInput, 'phone-error');
    return true;
  }

  nameInput.addEventListener('input', function () { if (nameInput.closest('.field').classList.contains('has-error')) validateName(); });
  phoneInput.addEventListener('input', function () { if (phoneInput.closest('.field').classList.contains('has-error')) validatePhone(); });
  nameInput.addEventListener('blur', function () { if (nameInput.value) validateName(); });
  phoneInput.addEventListener('blur', function () { if (phoneInput.value) validatePhone(); });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var nameOk = validateName();
    var phoneOk = validatePhone();

    if (!nameOk) { nameInput.focus(); return; }
    if (!phoneOk) { phoneInput.focus(); return; }

    // Демонстраційна відправка: дані нікуди не передаються і не зберігаються.
    successName.textContent = nameInput.value.trim();
    formView.hidden = true;
    successView.hidden = false;
    $('.btn', successView).focus();
  });
})();