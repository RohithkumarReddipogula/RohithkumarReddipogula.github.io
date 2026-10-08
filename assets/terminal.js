/* Developer terminal. Loaded on first open. Everything it prints is read from the page itself,
 * and `ask` uses the same index as the Ask box (window.PORTFOLIO). */
(function () {
  var css = [
    '.term{width:min(820px,calc(100% - 32px));height:min(560px,calc(100% - 64px));max-width:none;max-height:none;margin:auto;padding:0;',
    'border:1px solid var(--border-strong);border-radius:14px;background:#070B18;color:var(--text);box-shadow:0 30px 80px rgba(0,0,0,.5);overflow:hidden}',
    '.term[open]{display:flex;flex-direction:column}',
    '.term::backdrop{background:rgba(5,8,18,.72)}',
    '.term-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border-bottom:1px solid var(--border);background:var(--bg2)}',
    '.term-title{font-family:var(--mono);font-size:12px;color:var(--muted)}',
    '.term-close{font-family:var(--mono);font-size:12px;color:var(--muted);background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;cursor:pointer}',
    '.term-close:hover{color:var(--text);border-color:var(--border-strong)}',
    '.term-log{flex:1;overflow-y:auto;padding:14px 16px;font-family:var(--mono);font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word}',
    '.term-log .cmd{color:var(--text)}.term-log .cmd b{color:var(--lavender);font-weight:500}',
    '.term-log .dim{color:var(--dim)}.term-log .hi{color:#DDD6FE}.term-log .ok{color:var(--green)}.term-log .warn{color:var(--amber)}',
    '.term-log a{color:var(--lavender);text-decoration:underline;text-underline-offset:3px}',
    '.term-log .out{color:var(--muted);margin-bottom:10px}',
    '.trow{display:grid;grid-template-columns:16ch 1fr;gap:0 8px}.trow .k{color:#DDD6FE}.trow.dimk .k{color:var(--dim)}.trow .m{display:block;color:var(--dim)}',
    '.term-form{display:flex;align-items:center;gap:8px;padding:10px 16px;border-top:1px solid var(--border);font-family:var(--mono);font-size:13px}',
    '.term-ps{color:var(--lavender);white-space:nowrap}',
    '.term-in{flex:1;min-width:0;background:none;border:none;color:var(--text);font:inherit;font-size:16px;padding:4px 0}',
    '.term-in:focus{outline:none}',
    '.term-form:focus-within{box-shadow:inset 0 2px 0 rgba(167,139,250,.35)}',
    '@media (max-width:760px){.term{width:calc(100% - 16px);height:calc(100% - 32px)}.term-log{font-size:12px;padding:12px}.trow{grid-template-columns:1fr;margin-bottom:6px}}'
  ].join('');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var PS = 'guest@rohith:~$';
  var dlg = document.createElement('dialog');
  dlg.className = 'term';
  dlg.setAttribute('aria-labelledby', 'term-title');
  dlg.innerHTML =
    '<div class="term-bar"><span class="term-title" id="term-title">Developer terminal</span>' +
    '<button class="term-close" type="button">Close (Esc)</button></div>' +
    '<div class="term-log" id="term-log" role="log" aria-live="polite" tabindex="-1"></div>' +
    '<form class="term-form"><span class="term-ps" aria-hidden="true">' + PS + '</span>' +
    '<label for="term-in" class="sr-only">Terminal command. Type help for a list of commands.</label>' +
    '<input class="term-in" id="term-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="300"></form>';
  document.body.appendChild(dlg);

  var log = dlg.querySelector('.term-log'), form = dlg.querySelector('.term-form'), input = dlg.querySelector('.term-in');
  var opener = null, hist = [], hpos = 0;

  /* ---------- page data ---------- */
  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function projects(sel) {
    return Array.prototype.map.call(document.querySelectorAll(sel || 'article[id^="p-"]'), function (el) {
      return {
        id: el.id, slug: el.id.slice(2), el: el,
        title: txt(el.querySelector('.card-title')),
        badges: Array.prototype.map.call(el.querySelectorAll('.badge'), txt),
        metric: txt(el.querySelector('.metric')),
        links: Array.prototype.map.call(el.querySelectorAll('.links a'), function (a) { return { text: txt(a), href: a.href }; })
      };
    });
  }
  var SECTIONS = { ask: 'Ask', results: 'Results', projects: 'Projects', thesis: 'MSc thesis', diary: 'Engineering diary', engineering: 'How I engineer', skills: 'Skills', background: 'Background', contact: 'Contact' };

  /* ---------- output ---------- */
  function line(parts, cls) {
    var d = document.createElement('div');
    if (cls) d.className = cls;
    (Array.isArray(parts) ? parts : [parts]).forEach(function (p) {
      if (p == null) return;
      if (typeof p === 'string') d.appendChild(document.createTextNode(p));
      else d.appendChild(p);
    });
    log.appendChild(d);
    return d;
  }
  function span(t, cls) { var s = document.createElement('span'); s.className = cls; s.textContent = t; return s; }
  function link(t, href) {
    var a = document.createElement('a'); a.textContent = t; a.href = href;
    if (!/^#|^mailto:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }
  /* key / value row: two columns on wide screens, stacked on phones */
  function row(out, key, parts, dimKey) {
    var r = document.createElement('div'); r.className = 'trow' + (dimKey ? ' dimk' : '');
    r.appendChild(span(key, 'k'));
    if (key) r.appendChild(span(': ', 'sr-only'));
    var v = document.createElement('span');
    parts.forEach(function (p) { if (p != null) v.appendChild(typeof p === 'string' ? document.createTextNode(p) : p); });
    r.appendChild(v); out.appendChild(r);
  }
  function scroll() { log.scrollTop = log.scrollHeight; }

  /* ---------- commands ---------- */
  var CMDS = {
    help: { desc: 'list commands', run: function () {
      var rows = [
        ['help', 'list commands'], ['about', 'who Rohith is'], ['projects', 'all projects with key results'],
        ['projects --best', 'featured projects, in page order'], ['ask "<question>"', 'answer from this page, e.g. ask "does he know RAG?"'],
        ['open <project>', 'jump to a project or section, e.g. open graphrag'], ['contact', 'email and profiles'],
        ['clear', 'clear the screen'], ['exit', 'close the terminal (or press Esc)']
      ];
      var out = line(null, 'out');
      rows.forEach(function (r) { row(out, r[0], [r[1]]); });
      out.appendChild(span('\nTab completes commands and project names. Up and down arrows recall history.', 'dim'));
    } },
    about: { desc: 'who Rohith is', run: function () {
      var out = line(null, 'out');
      out.appendChild(span(document.querySelector('.hero h1').innerText.replace(/\s+/g, ' ').trim() + '\n', 'hi'));
      out.appendChild(document.createTextNode(txt(document.querySelector('.hero-role')) + '\n'));
      out.appendChild(document.createTextNode(txt(document.querySelector('.hero-line')) + '\n\n'));
      Array.prototype.forEach.call(document.querySelectorAll('.glance > div'), function (g) {
        var k = txt(g.querySelector('span')), v = txt(g).slice(k.length).trim();
        row(out, k.toLowerCase(), [v], true);
      });
      Array.prototype.forEach.call(document.querySelectorAll('#background .tl'), function (tl, i) {
        row(out, i ? '' : 'path', [txt(tl.querySelector('h3')) + ', ' + txt(tl.querySelector('.tl-org')).split(' · ')[0] + ' (' + txt(tl.querySelector('.tl-date')) + ')'], true);
      });
      out.appendChild(span('\nTry: projects --best', 'dim'));
    } },
    projects: { desc: 'all projects', run: function (args) {
      var best = args.indexOf('--best') !== -1;
      var list = projects(best ? '#projects .cards:not(.cards-sm) article' : null);
      var out = line(null, 'out');
      out.appendChild(span(best ? 'Featured projects, in the order shown on this page:\n\n' : 'All projects (open <name> to jump to one):\n\n', 'dim'));
      list.forEach(function (p, i) {
        row(out, best ? (i + 1) + '. ' + p.slug : p.slug, [p.title + (p.badges.length ? ' [' + p.badges.join(', ').toLowerCase() + ']' : ''), p.metric ? span(p.metric, 'm') : null]);
      });
      if (!best) out.appendChild(span('\nprojects --best lists the featured ones.', 'dim'));
    } },
    ask: { desc: 'answer a question', run: function (args, raw) {
      var q = raw.replace(/^\s*ask\s*/i, '').trim().replace(/^["']|["']$/g, '').trim();
      if (!q) { line('usage: ask "<question>"   e.g. ask "what is his best project?"', 'out warn'); return; }
      if (!window.PORTFOLIO) { line('The Ask index is not available.', 'out warn'); return; }
      var r = window.PORTFOLIO.answer(q), out = line(null, 'out');
      out.appendChild(document.createTextNode(r.text));
      if (r.links.length) {
        out.appendChild(span('\n\nSee: ', 'dim'));
        r.links.forEach(function (id, i) {
          var cmd = 'open ' + (id.indexOf('p-') === 0 ? id.slice(2) : id);
          var a = link(window.PORTFOLIO.label(id), '#' + id);
          a.addEventListener('click', function (e) { e.preventDefault(); exec(cmd); });
          if (i) out.appendChild(document.createTextNode('  '));
          out.appendChild(a);
        });
        out.appendChild(span('\n(or type open <name>)', 'dim'));
      }
    } },
    open: { desc: 'jump to a project', run: function (args) {
      var q = args.join(' ').toLowerCase().trim();
      if (!q) { line('usage: open <project>   e.g. open graphrag. Type projects for names.', 'out warn'); return; }
      var list = projects(), hit = list.filter(function (p) { return p.slug === q; })[0] ||
        list.filter(function (p) { return p.slug.indexOf(q) === 0; })[0] ||
        list.filter(function (p) { return p.title.toLowerCase().indexOf(q) !== -1; })[0];
      var id = hit ? hit.id : (SECTIONS[q] ? q : null);
      if (!id) { line('open: no project or section named "' + q + '". Type projects for names.', 'out warn'); return; }
      if (hit) {
        var out = line(null, 'out');
        out.appendChild(span('Opening ' + hit.title + '\n', 'ok'));
        hit.links.forEach(function (l, i) { if (i) out.appendChild(document.createTextNode('  ')); out.appendChild(link(l.text, l.href)); });
      } else line('Opening ' + SECTIONS[id], 'out ok');
      close();
      var el = window.PORTFOLIO ? window.PORTFOLIO.goTo(id) : document.getElementById(id);
      var target = el && (el.querySelector('.card-title a') || el.querySelector('h2'));
      if (target) { if (!target.matches('a')) target.tabIndex = -1; target.focus({ preventScroll: true }); }
    } },
    contact: { desc: 'email and profiles', run: function () {
      var out = line(null, 'out');
      Array.prototype.forEach.call(document.querySelectorAll('#contact .ctas a'), function (a) {
        var label = txt(a).replace(/\s*→$/, '');
        var shown = a.href.indexOf('mailto:') === 0 ? a.href.slice(7) : a.href.replace(/^https?:\/\/(www\.)?/, '');
        row(out, label.replace(/^Email me$/, 'Email').toLowerCase(), [link(shown, a.href)], true);
      });
      var cv = document.getElementById('nav-resume');
      if (cv && !cv.hidden) row(out, 'resume', [link(txt(cv), cv.href)], true);
    } },
    clear: { desc: 'clear the screen', run: function () { log.textContent = ''; } },
    exit: { desc: 'close', run: function () { close(); } }
  };
  var NAMES = ['help', 'about', 'projects', 'projects --best', 'ask', 'open', 'contact', 'clear', 'exit'];

  function exec(raw) {
    raw = raw.trim();
    var echo = line(null, 'cmd'); echo.appendChild(span(PS + ' ', 'dim')); echo.appendChild(document.createTextNode(raw));
    if (raw) {
      hist.push(raw); hpos = hist.length;
      var parts = raw.split(/\s+/), name = parts[0].toLowerCase(), c = CMDS[name];
      if (c) c.run(parts.slice(1), raw);
      else line('command not found: ' + parts[0] + '. Type help.', 'out warn');
    }
    scroll();
  }

  function complete() {
    var v = input.value, m = v.match(/^open\s+(\S*)$/i), opts, base;
    if (m) {
      opts = projects().map(function (p) { return p.slug; }).concat(Object.keys(SECTIONS))
        .filter(function (s) { return s.indexOf(m[1].toLowerCase()) === 0; });
      base = 'open ';
    } else if (!/\s/.test(v.trim()) || /^projects\s+-*$/i.test(v)) {
      opts = NAMES.filter(function (n) { return n.indexOf(v.toLowerCase()) === 0; });
      base = '';
    } else return;
    if (opts.length === 1) input.value = base + opts[0] + (base || opts[0] === 'ask' || opts[0] === 'open' ? ' ' : '');
    else if (opts.length > 1) {
      var pre = opts.reduce(function (a, b) { var i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(0, i); });
      if ((base + pre).length > v.length) input.value = base + pre;
      line(opts.join('   '), 'out dim'); scroll();
    }
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; exec(v); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Tab' && input.value) { e.preventDefault(); complete(); }
    else if (e.key === 'ArrowUp' && hist.length) { e.preventDefault(); hpos = Math.max(0, hpos - 1); input.value = hist[hpos]; }
    else if (e.key === 'ArrowDown' && hist.length) { e.preventDefault(); hpos = Math.min(hist.length, hpos + 1); input.value = hist[hpos] || ''; }
    else if (e.key === '~' && !input.value) { e.preventDefault(); close(); }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); log.textContent = ''; }
  });
  dlg.querySelector('.term-close').addEventListener('click', close);
  dlg.addEventListener('close', function () {
    if (opener && document.contains(opener) && !dlg.dataset.keepFocus) opener.focus();
    delete dlg.dataset.keepFocus;
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });

  function open(from) {
    if (dlg.open) return;
    opener = from || document.activeElement;
    if (!log.childNodes.length) {
      line([span('Welcome to Rohith\'s portfolio terminal.', 'hi')]);
      line('Type help to see commands, or try: projects --best   ask "does he know RAG?"   open graphrag', 'out dim');
    }
    dlg.showModal();
    input.focus();
    scroll();
  }
  function close() {
    if (!dlg.open) return;
    if (/^open /.test(hist[hist.length - 1] || '')) dlg.dataset.keepFocus = '1';
    dlg.close();
  }

  window.TERMINAL = { open: open, close: close, exec: exec, isOpen: function () { return dlg.open; } };
})();
