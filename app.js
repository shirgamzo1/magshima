// מועדון מגשימה: מה שזז בדף. בלי ספריות חיצוניות. הדף עובד גם בלי הקובץ הזה, רק בלי התוספות.
(function () {
  'use strict';
  var TZ = 'Asia/Jerusalem';
  var doc = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  // ---------- אירועים לכרטיס "הדבר הבא". להוסיף כאן כל מפגש חדש (ואת קובץ היומן שלו בתיקייה events) ----------
  var EVENTS = [
    { title: 'מפגש שאלות ותשובות', start: '2026-10-20T20:30:00+03:00', end: '2026-10-20T21:30:00+03:00',
      where: 'זום', note: 'מפגש לייב בזום. הכיני מראש שאלות ממוקדות.', ics: 'events/qa-2026-10-20.ics' },
  ];

  // ---------- ברכה לפי השעה ----------
  var hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).format(new Date())) % 24;
  var greet = hour >= 5 && hour < 12 ? 'בוקר טוב' : hour >= 12 && hour < 17 ? 'צהריים טובים' : hour >= 17 && hour < 21 ? 'ערב טוב' : 'לילה טוב';
  if ($('greet')) $('greet').textContent = greet + ', כאן שיר 🤍';

  // ---------- גודל טקסט ----------
  var fs = Number(doc.getAttribute('data-fs') || 0);
  function applyFs() {
    if (fs) doc.setAttribute('data-fs', String(fs)); else doc.removeAttribute('data-fs');
    $('fs-down').disabled = fs === 0;
    $('fs-up').disabled = fs === 3;
    store.set('magshima-fs', fs ? String(fs) : '');
  }
  if ($('fs-bar')) {
    $('fs-bar').hidden = false;
    $('fs-up').addEventListener('click', function () { if (fs < 3) { fs++; applyFs(); } });
    $('fs-down').addEventListener('click', function () { if (fs > 0) { fs--; applyFs(); } });
    applyFs();
  }

  // ---------- קישורים שנפתחים בחלון חדש: אומרים את זה לתוכנות הקראה ----------
  Array.prototype.forEach.call(document.querySelectorAll('a[target="_blank"]'), function (a) {
    var s = document.createElement('span');
    s.className = 'sr-only';
    s.textContent = ' (נפתח בחלון חדש)';
    a.appendChild(s);
  });

  // ---------- קישור לחלון סגור (למשל "איך שומרים את הדף") פותח אותו ----------
  function openTarget(hash) {
    var el = hash && hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (el && el.tagName === 'DETAILS') el.open = true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) openTarget(a.getAttribute('href'));
  });
  openTarget(location.hash);

  // ---------- התחילי כאן: אפשר להסתיר ----------
  if ($('start')) {
    if (store.get('magshima-start-hidden') === '1') $('start').hidden = true;
    $('start-hide').hidden = false;
    $('start-hide').addEventListener('click', function () {
      $('start').hidden = true;
      store.set('magshima-start-hidden', '1');
      $('updates-title').setAttribute('tabindex', '-1');
      $('updates-title').focus();
    });
  }

  // ---------- עדכונים: "חדש" לשבועיים, ורק 3 גלויים ----------
  var NEW_DAYS = 14, SHOWN = 3;
  var list = $('updates-list');
  if (list) {
    var arts = Array.prototype.slice.call(list.querySelectorAll('.update[data-date]'));
    arts.forEach(function (art, i) {
      var age = (Date.now() - Date.parse(art.getAttribute('data-date') + 'T00:00:00+03:00')) / 864e5;
      if (age >= 0 && age < NEW_DAYS) {
        var pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = 'חדש';
        art.querySelector('.meta').insertBefore(pill, art.querySelector('.meta').firstChild);
      }
      if (i >= SHOWN) $('older-list').appendChild(art);
    });
    if (arts.length > SHOWN) {
      $('older').hidden = false;
      $('older').querySelector('summary').textContent = 'עדכונים קודמים (' + (arts.length - SHOWN) + ')';
    }
  }

  // ---------- הדבר הבא ----------
  function dayKey(d) { return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
  function utcStamp(iso) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  var now = Date.now();
  var next = EVENTS.filter(function (e) { return Date.parse(e.end) > now; }).sort(function (a, b) { return Date.parse(a.start) - Date.parse(b.start); })[0];
  if (next && $('next')) {
    var start = new Date(next.start);
    var days = Math.round((Date.parse(dayKey(start)) - Date.parse(dayKey(new Date()))) / 864e5);
    var count = now >= Date.parse(next.start) ? 'מתקיים עכשיו' : days === 0 ? 'היום' : days === 1 ? 'מחר' : days === 2 ? 'בעוד יומיים' : 'בעוד ' + days + ' ימים';
    var weekday = new Intl.DateTimeFormat('he-IL', { timeZone: TZ, weekday: 'long' }).format(start);
    var date = new Intl.DateTimeFormat('he-IL', { timeZone: TZ, day: 'numeric', month: 'numeric' }).format(start);
    var time = new Intl.DateTimeFormat('he-IL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(start);
    $('next-title').textContent = next.title;
    $('next-when').textContent = weekday + ', ' + date + ' בשעה ' + time;
    $('next-count').textContent = count;
    $('next-note').textContent = next.note || '';
    $('next-google').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(next.title + ' - מועדון מגשימה') +
      '&dates=' + utcStamp(next.start) + '/' + utcStamp(next.end) +
      '&details=' + encodeURIComponent(next.note || '') +
      '&location=' + encodeURIComponent(next.where || '') + '&ctz=' + TZ;
    if (next.ics) $('next-ics').href = next.ics; else $('next-ics').hidden = true;
    $('next').hidden = false;
  }

  // ---------- חיפוש ----------
  var box = $('search-box');
  if (box && window.fetch) {
    box.hidden = false;
    var q = $('q'), out = $('q-results'), status = $('q-status');
    var data = null, loading = null, timer = null;
    var KIND = { c: 'קורס בפורטל', l: 'שיעור בפורטל', d: 'תיקייה בכספת', p: 'בדף הזה' };
    var TYPES = { pdf: 'PDF', doc: 'וורד', docx: 'וורד', rtf: 'וורד', ppt: 'מצגת', pptx: 'מצגת', slides: 'מצגת', xls: 'גיליון', xlsx: 'גיליון', sheet: 'גיליון',
      jpg: 'תמונה', jpeg: 'תמונה', png: 'תמונה', gif: 'תמונה', bmp: 'תמונה', mp3: 'הקלטה', zip: 'קובץ דחוס' };
    var ICON = { c: 'i-play', l: 'i-play', d: 'i-folder', f: 'i-file', p: 'i-left' };
    // מה שבדף עצמו, כדי שגם "וואטסאפ" או "נגישות" ימצאו משהו
    var PAGE = [
      ['תוכנית החודש במועדון', 'p', 'בדף הזה', '#schedule'],
      ['מפגש שאלות ותשובות', 'p', 'בדף הזה', '#schedule'],
      ['ערכות למידה', 'p', 'בדף הזה', '#kits'],
      ['שאלות נפוצות ועזרה', 'p', 'בדף הזה', '#help'],
      ['שירות לקוחות בוואטסאפ', 'p', 'בדף הזה', 'https://wa.me/972557771325'],
      ['איך שומרים את הדף בטלפון', 'p', 'בדף הזה', '#save-page'],
      ['לא מצליחה להיכנס לפורטל: הסבר', 'p', 'בדף הזה', 'https://docs.google.com/document/d/1D9RWWdTpgFitQ6dRYPF421nI_laHAf1SZE3qS4vfQsI/edit?usp=sharing'],
      ['הצהרת נגישות', 'p', 'בדף הזה', 'accessibility.html'],
    ];
    var FINAL = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
    function norm(s) {
      return String(s).toLowerCase().replace(/[֑-ׇ]/g, '').replace(/[ךםןףץ]/g, function (c) { return FINAL[c]; })
        .replace(/[״"׳'`\-–_.,:;!?()\[\]{}+&/\\|·›]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function load() {
      if (!loading) {
        loading = fetch('data/search.json?v=' + dayKey(new Date())).then(function (r) { return r.json(); }).then(function (j) {
          var rows = PAGE.concat(j.items.map(function (it) { return [it[0], it[1], j.paths[it[2]], it[3], it[4] || '']; }));
          data = rows.map(function (r) { return { r: r, name: norm(r[0]), all: norm(r[0] + ' ' + r[2]) }; });
        }).catch(function () { loading = null; status.textContent = 'החיפוש לא נטען. בדקי שיש אינטרנט ונסי שוב.'; });
      }
      return loading;
    }
    function link(r) {
      if (r[1] === 'd') return 'https://drive.google.com/drive/folders/' + r[3];
      if (r[1] === 'f') return 'https://drive.google.com/open?id=' + r[3];
      return r[3];
    }
    function find(tokens) {
      var res = [];
      for (var i = 0; i < data.length; i++) {
        var d = data[i], ok = true;
        for (var t = 0; t < tokens.length; t++) if (d.all.indexOf(tokens[t]) < 0) { ok = false; break; }
        if (!ok) continue;
        var score = 0;
        var inName = tokens.every(function (t) { return d.name.indexOf(t) >= 0; });
        if (inName) score += 10;
        if (d.name.indexOf(tokens[0]) === 0) score += 4;
        score += { p: 6, c: 5, l: 4, d: 4, f: 0 }[d.r[1]] || 0;
        score -= Math.min(d.name.length, 80) / 40;
        res.push({ d: d, s: score });
      }
      return res.sort(function (a, b) { return b.s - a.s; });
    }
    function render() {
      var text = norm(q.value);
      out.innerHTML = '';
      if (!text) { status.textContent = ''; return; }
      var tokens = text.split(' ');
      var res = find(tokens);
      // בלי תוצאות? אולי הוקלדה אות שימוש בהתחלה ("בחנוכה", "והורים")
      if (!res.length) {
        var bare = tokens.map(function (t) { return t.length > 3 && /^[והבלמשכ]/.test(t) ? t.slice(1) : t; });
        if (bare.join(' ') !== tokens.join(' ')) res = find(bare);
      }
      var MAX = 40;
      status.textContent = !res.length ? 'לא מצאתי. נסי מילה אחרת, או מילה אחת בלבד.' :
        res.length === 1 ? 'נמצאה תוצאה אחת' : res.length > MAX ? 'נמצאו ' + res.length + ' תוצאות. מוצגות ' + MAX + ' הראשונות, הוסיפי מילה כדי לדייק.' : 'נמצאו ' + res.length + ' תוצאות';
      res.slice(0, MAX).forEach(function (x) {
        var r = x.d.r;
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = link(r);
        if (!/^#/.test(a.getAttribute('href')) && !/^accessibility/.test(a.getAttribute('href'))) { a.target = '_blank'; a.rel = 'noopener'; }
        var k = document.createElement('span');
        k.className = 'kind ' + r[1];
        k.innerHTML = '<svg class="ic" aria-hidden="true" focusable="false"><use href="#' + ICON[r[1]] + '"/></svg>';
        var body = document.createElement('span');
        var t = document.createElement('span'); t.className = 't'; t.textContent = r[0];
        var p = document.createElement('span'); p.className = 'p'; p.textContent = r[1] === 'f' ? r[2] : KIND[r[1]] + ' · ' + r[2];
        body.appendChild(t); body.appendChild(p);
        a.appendChild(k); a.appendChild(body);
        if (r[1] === 'f') { var ty = document.createElement('span'); ty.className = 'type'; ty.textContent = TYPES[r[4]] || 'קובץ'; a.appendChild(ty); }
        if (a.target) { var s = document.createElement('span'); s.className = 'sr-only'; s.textContent = ' (נפתח בחלון חדש)'; a.appendChild(s); }
        a.addEventListener('click', function () { if (/^#/.test(a.getAttribute('href'))) openTarget(a.getAttribute('href')); });
        li.appendChild(a);
        out.appendChild(li);
      });
    }
    q.addEventListener('focus', load);
    q.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (data) render();
        else { status.textContent = 'טוען את החיפוש...'; load().then(render); }
      }, 150);
    });
    q.addEventListener('keydown', function (e) { if (e.key === 'Escape') { q.value = ''; render(); } });
    // קישור עם חיפוש מוכן, למשל ...magshima/?q=חנוכה
    var pre = window.URLSearchParams ? new URLSearchParams(location.search).get('q') : '';
    if (pre) { q.value = pre; status.textContent = 'טוען את החיפוש...'; load().then(render); }
  }

  // ---------- תנועה עדינה בגלילה ----------
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!calm && 'IntersectionObserver' in window) {
    doc.classList.add('anim');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -40px 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) { io.observe(el); });
  }
})();
