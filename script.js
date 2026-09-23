/*
  Общий скрипт для страниц кейсов: тема, появление блоков при прокрутке и модалка
  резюме. Логика продублирована из index.html (там она инлайн — см. CLAUDE.md),
  здесь вынесена в файл, потому что кейсов несколько и дублировать
  script в каждом — хуже, чем в одном месте синхронизировать с index.html.
*/
(function () {
  var root = document.documentElement;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  var STORAGE_KEY = 'portfolio.state';
  function readState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { version: 1 };
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return { version: 1 };
      if (data.version !== 1) return { version: 1 };
      return data;
    } catch (e) {
      return { version: 1 };
    }
  }
  function writeState(patch) {
    try {
      var data = readState();
      for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) data[k] = patch[k];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  var btn = document.querySelector('[data-theme-toggle]');
  var label = document.querySelector('[data-theme-label]');
  function current() { return root.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light'); }
  function syncTheme() {
    var dark = current() === 'dark';
    if (label) label.textContent = dark ? 'Светлая' : 'Тёмная';
    if (btn) btn.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', dark ? '#0B0B0C' : '#FFFFFF');
  }
  if (btn) {
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      writeState({ theme: next });
      syncTheme();
    });
  }
  if (mq.addEventListener) mq.addEventListener('change', syncTheme);
  syncTheme();

  var items = [].slice.call(document.querySelectorAll('[data-reveal]'));
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  items.forEach(function (el) { io.observe(el); });
})();

(function () {
  /* Модалка резюме: разметка уже в DOM (продублирована в каждом кейсе — см. CLAUDE.md),
     никакого fetch, чтобы CV работал и при открытии файла напрямую (file://). */
  var backdrop = document.querySelector('[data-cv-backdrop]');
  var openBtn = document.querySelector('[data-cv-open]');
  var closeEls = [].slice.call(document.querySelectorAll('[data-cv-close]'));
  if (!backdrop || !openBtn) return;
  var lastFocus = null;

  function onKeydown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var focusable = [].slice.call(backdrop.querySelectorAll('button, a[href]'));
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open() {
    lastFocus = document.activeElement;
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cv-open');
    document.addEventListener('keydown', onKeydown);
    var closeBtn = backdrop.querySelector('.cv-close');
    if (closeBtn) closeBtn.focus();
  }
  function close() {
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cv-open');
    document.removeEventListener('keydown', onKeydown);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  openBtn.addEventListener('click', open);
  closeEls.forEach(function (el) { el.addEventListener('click', close); });
  backdrop.addEventListener('click', function (e) { if (e.target === backdrop) close(); });

  /* Копирование email по клику вместо открытия почтового клиента */
  var announcer = backdrop.querySelector('[data-copy-announcer]');
  var links = [].slice.call(backdrop.querySelectorAll('[data-copy-email]'));
  links.forEach(function (link) {
    var toast = link.querySelector('.copy-toast');
    var hideTimer = null;
    link.addEventListener('click', function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      e.preventDefault();
      var email = link.getAttribute('data-copy-email');
      navigator.clipboard.writeText(email).then(function () {
        if (toast) {
          clearTimeout(hideTimer);
          toast.classList.add('is-visible');
          hideTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 1600);
        }
        if (announcer) {
          announcer.textContent = '';
          window.requestAnimationFrame(function () { announcer.textContent = 'Email скопирован в буфер обмена'; });
        }
      }).catch(function () {
        window.location.href = link.href;
      });
    });
  });
})();
