/*
  Общий скрипт для страниц кейсов: тема + появление блоков при прокрутке.
  Логика продублирована из index.html (там она инлайн — см. CLAUDE.md),
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
