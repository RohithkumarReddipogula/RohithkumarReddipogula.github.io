/* Knowledge-graph section: graph paths the GraphRAG system used as facts for 20 dev questions.
   Data: assets/graphrag-graph.json, built in github.com/RohithkumarReddipogula/graphrag-engine
   (scripts/build_portfolio_graph.py; layout precomputed, so no physics runs here).
   Nothing is fetched or drawn until the section comes near the viewport. No dependencies. */
(function () {
  "use strict";
  var section = document.getElementById("graph");
  if (!section) return;

  var NS = "http://www.w3.org/2000/svg";
  var TYPE_COLOUR = { PERSON: "#A78BFA", FILM: "#60A5FA", WORK: "#FBBF24", PLACE: "#34D399", ORG: "#F472B6", OTHER: "#9AA0BC" };
  var STATUS = {
    "correct": { text: "Correct", cls: "ok" },
    "correct, different wording": { text: "Correct (different wording)", cls: "ok" },
    "no answer": { text: "No answer (abstained)", cls: "na" },
    "wrong": { text: "Wrong", cls: "bad" }
  };
  var LABEL_PX = 12, LABEL_PX_NARROW = 10.5, NODE_PX = 5, PAGE_PX = 7, MAX_LABEL = 30, PAD_PX = 56;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var svg = document.getElementById("kg-svg");
  var select = document.getElementById("kg-q");
  var panel = document.getElementById("kg-panel");
  var tip = document.getElementById("kg-tip");
  var data, nodeEls = [], linkEls = [], labelEls = [], leaderEls = [], vb = null, current = -1, anim = 0;

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function short(s) { return s.length > MAX_LABEL ? s.slice(0, MAX_LABEL - 1) + "…" : s; }
  function labelPx() { return (svg.clientWidth || 0) < 480 ? LABEL_PX_NARROW : LABEL_PX; }
  function unitsPerPx() { var w = svg.clientWidth || 1; return vb.w / w; }

  function build() {
    var gLinks = el("g", { "class": "kg-links" }, svg);
    var gNodes = el("g", { "class": "kg-nodes" }, svg);
    var gLabels = el("g", { "class": "kg-labels" }, svg);
    data.links.forEach(function (l) {
      var a = data.nodes[l.s], b = data.nodes[l.t];
      linkEls.push(el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, "class": "kg-link" }, gLinks));
    });
    data.nodes.forEach(function (n, i) {
      var c = el("circle", { cx: n.x, cy: n.y, r: 4, fill: TYPE_COLOUR[n.type] || TYPE_COLOUR.OTHER, "class": "kg-node" }, gNodes);
      c.addEventListener("pointerenter", function (ev) { showTip(i, ev); });
      c.addEventListener("pointerleave", hideTip);
      c.addEventListener("click", function (ev) { showTip(i, ev); });
      nodeEls.push(c);
      var ld = el("line", { "class": "kg-leader" }, gLabels);
      ld.style.display = "none";
      leaderEls.push(ld);
      var t = el("text", { "class": "kg-label" }, gLabels);
      t.textContent = short(n.label);
      labelEls.push(t);
    });
    data.questions.forEach(function (q, i) {
      var o = document.createElement("option");
      o.value = i;
      o.textContent = STATUS[q.status].text + " · " + tidy(q.question);
      select.appendChild(o);
    });
    select.addEventListener("change", function () { show(+select.value); });
    var lastW = svg.clientWidth;
    window.addEventListener("resize", function () {    // mobile URL-bar scrolls change only the height
      if (current >= 0 && svg.clientWidth !== lastW) { lastW = svg.clientWidth; show(current, true); }
    });
  }

  function showTip(i, ev) {
    var n = data.nodes[i], box = svg.getBoundingClientRect();
    tip.textContent = n.label + " (" + n.type.toLowerCase() + (n.page ? ", has its own page" : "") + ")";
    tip.hidden = false;
    var x = Math.min(Math.max(ev.clientX - box.left + 10, 4), box.width - tip.offsetWidth - 4);
    tip.style.left = x + "px";
    tip.style.top = Math.max(ev.clientY - box.top - 34, 4) + "px";
  }
  function hideTip() { tip.hidden = true; }

  function targetBox(ids) {
    var xs = ids.map(function (i) { return data.nodes[i].x; }), ys = ids.map(function (i) { return data.nodes[i].y; });
    var aspect = (svg.clientWidth || 1) / (svg.clientHeight || 1);
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var w = Math.max(maxX - minX, 160), h = Math.max(maxY - minY, 160);
    var pad = PAD_PX * (Math.max(w, h * aspect) / (svg.clientWidth || 1)) * 2.2;
    w += 2 * pad; h += 2 * pad;
    if (w / h > aspect) h = w / aspect; else w = h * aspect;
    return { x: (minX + maxX) / 2 - w / 2, y: (minY + maxY) / 2 - h / 2, w: w, h: h };
  }

  function setViewBox(b) {
    vb = b;
    svg.setAttribute("viewBox", b.x + " " + b.y + " " + b.w + " " + b.h);
    var k = unitsPerPx();
    nodeEls.forEach(function (c, i) { c.setAttribute("r", (data.nodes[i].page ? PAGE_PX : NODE_PX) * k); });
    svg.style.setProperty("--kg-font", (labelPx() * k) + "px");
  }

  function animateTo(b, done) {
    cancelAnimationFrame(anim);
    if (reduceMotion || !vb) { setViewBox(b); done(); return; }
    var from = vb, t0 = performance.now(), dur = 520;
    function step(now) {
      var t = Math.min((now - t0) / dur, 1), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setViewBox({ x: from.x + (b.x - from.x) * e, y: from.y + (b.y - from.y) * e,
                   w: from.w + (b.w - from.w) * e, h: from.h + (b.h - from.h) * e });
      if (t < 1) anim = requestAnimationFrame(step); else done();
    }
    anim = requestAnimationFrame(step);
  }

  /* Labels only for highlighted nodes, greedily placed so their boxes do not overlap each other or the
     highlighted nodes. A label that fits nowhere is left out; the node still shows its name on hover. */
  function placeLabels(ids) {
    var k = unitsPerPx(), boxes = [], gap = 4 * k, fs = labelPx() * k;
    ids.forEach(function (i) {
      var n = data.nodes[i], r = (n.page ? PAGE_PX : NODE_PX) * k + 2 * k;
      boxes.push({ x: n.x - r, y: n.y - r, w: 2 * r, h: 2 * r });
    });
    function hit(b) {
      for (var j = 0; j < boxes.length; j++) {
        var o = boxes[j];
        if (b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y) return true;
      }
      return b.x < vb.x || b.y < vb.y || b.x + b.w > vb.x + vb.w || b.y + b.h > vb.y + vb.h;
    }
    // Hubs of the path first (most highlighted links), then page entities.
    var deg = {};
    data.questions[current].links.forEach(function (l) {
      var e = data.links[l]; deg[e.s] = (deg[e.s] || 0) + 1; deg[e.t] = (deg[e.t] || 0) + 1;
    });
    var order = ids.slice().sort(function (a, b) {
      return ((deg[b] || 0) - (deg[a] || 0)) || (data.nodes[b].page - data.nodes[a].page) || a - b;
    });
    order.forEach(function (i) {
      var n = data.nodes[i], t = labelEls[i], r = (n.page ? PAGE_PX : NODE_PX) * k;
      t.style.display = "";
      var w = t.getComputedTextLength() + 2 * k, h = fs * 1.4;      // padded for the text halo and descenders
      // Candidate spots: beside, above and below the node first, then further out; nearest free one wins.
      var cands = [];
      for (var row = -3; row <= 3; row++) {
        var dy = row === 0 ? h * 0.35 : (row < 0 ? -r - gap + (row + 1) * h : r + gap + h * 0.8 + (row - 1) * h);
        [r + gap, -r - gap - w, -w / 2].forEach(function (dx, side) {
          if (row === 0 && side === 2) return;                           // centred on the node itself
          if (Math.abs(row) >= 2 && side !== 2) return;                  // far spots only straight above or below
          cands.push([dx, dy, Math.abs(row) * 2 + side * 0.5]);
        });
      }
      cands.sort(function (a, b) { return a[2] - b[2]; });
      for (var c = 0; c < cands.length; c++) {
        var bx = { x: n.x + cands[c][0] - k, y: n.y + cands[c][1] - fs * 1.1, w: w, h: h };
        if (!hit(bx)) {
          t.setAttribute("x", n.x + cands[c][0]);
          t.setAttribute("y", n.y + cands[c][1]);
          boxes.push(bx);
          if (cands[c][2] >= 4) {                                          // far spot: leader line to the node
            var ly = cands[c][1] < 0 ? bx.y + bx.h : bx.y;
            leaderEls[i].setAttribute("x1", n.x); leaderEls[i].setAttribute("y1", n.y + (cands[c][1] < 0 ? -r : r));
            leaderEls[i].setAttribute("x2", n.x); leaderEls[i].setAttribute("y2", ly);
            leaderEls[i].style.display = "";
          }
          return;
        }
      }
      t.style.display = "none";
    });
  }

  function show(i, instant) {
    current = i;
    var q = data.questions[i];
    var twins = [];
    q.same_name_kept_apart.forEach(function (t) { twins = twins.concat(t.nodes); });
    var onNodes = {}, onLinks = {};
    q.nodes.concat(twins).forEach(function (n) { onNodes[n] = true; });
    q.links.forEach(function (l) { onLinks[l] = true; });
    nodeEls.forEach(function (c, n) {
      c.classList.toggle("on", !!onNodes[n]);
      c.classList.toggle("twin", twins.indexOf(n) >= 0);
    });
    linkEls.forEach(function (e, l) { e.classList.toggle("on", !!onLinks[l]); });
    labelEls.forEach(function (t, j) { t.style.display = "none"; leaderEls[j].style.display = "none"; });
    hideTip();
    var ids = Object.keys(onNodes).map(Number);
    var box = targetBox(ids);
    var finish = function () { placeLabels(ids); };
    if (instant) { setViewBox(box); finish(); } else animateTo(box, finish);
    renderPanel(q);
  }

  /* Display only (the data file keeps the dataset's text): the dataset title-cases every word. */
  function tidy(text) {
    return text.replace(/\b(Ii|Iii|Iv|Vi|Vii|Viii|Ix)\b/g, function (m) { return m.toUpperCase(); })
      .replace(/(\w)'S(?=[\s?,.]|$)/g, "$1's")
      .replace(/ Of /g, " of ")
      .replace(/\bFilm\)/g, "film)");
  }

  /* Display only: a fact is "main part; attribute; attribute". Facts that are just an entity name are left
     out, and an attribute (such as a date of birth) is shown the first time only. */
  function shownFacts(facts) {
    var seen = {}, out = [], hidden = 0;
    facts.forEach(function (f) {
      var keep = f.split("; ").filter(function (seg) {
        if (seg.indexOf("->") !== -1) return true;
        if (!/^.+: .+/.test(seg)) return false;                 // bare entity name, no relation
        if (seen[seg]) return false;
        seen[seg] = true;
        return true;
      });
      if (keep.length) out.push(keep.join("; ")); else hidden++;
    });
    return { facts: out, hidden: hidden };
  }

  function renderPanel(q) {
    var st = STATUS[q.status];
    var html = '<span class="kg-status ' + st.cls + '">' + st.text + "</span>" +
      '<p class="kg-qtext">' + esc(tidy(q.question)) + "</p>" +
      '<dl class="kg-ans"><div><dt>System answer</dt><dd>' + esc(q.answer) + "</dd></div>" +
      "<div><dt>Gold answer</dt><dd>" + esc(q.gold) + "</dd></div></dl>";
    if (q.status === "correct, different wording") {
      html += '<p class="kg-note">Not an exact string match; the evaluation judge accepted it as the same answer.</p>';
    }
    q.same_name_kept_apart.forEach(function (t) {
      html += '<p class="kg-note kg-twin-note"><strong>Same name, different entities.</strong> There are two different ' +
        "pages called “" + esc(t.name) + "” in the corpus (" +
        t.nodes.map(function (n) { return data.nodes[n].type.toLowerCase(); }).join(" and ") +
        "). Entity resolution kept them apart; both are outlined in the graph.</p>";
    });
    var sf = shownFacts(q.facts);
    html += '<p class="kg-facts-h">Facts the system cited from the graph</p><ol class="kg-facts" tabindex="0" aria-label="Cited facts">' +
      sf.facts.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ol>";
    if (sf.hidden) {
      html += '<p class="kg-note kg-hidden">' + sf.hidden + (sf.hidden === 1 ? " cited fact" : " cited facts") +
        " not listed: only an entity name, or only details already shown above.</p>";
    }
    panel.innerHTML = html;
  }

  function load() {
    fetch("assets/graphrag-graph.json").then(function (r) { return r.json(); }).then(function (d) {
      data = d;
      build();
      section.classList.add("kg-ready");
      select.value = d.default_question;
      setViewBox({ x: 0, y: 0, w: 1600, h: 1000 });
      show(d.default_question, true);
      // Label widths depend on the web font: place them again once it has loaded.
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { show(current, true); });
    }).catch(function () {
      panel.innerHTML = '<p class="kg-note">The graph could not be loaded. The data is in the ' +
        '<a href="https://github.com/RohithkumarReddipogula/graphrag-engine">graphrag-engine repository</a>.</p>';
    });
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); load(); }
    }, { rootMargin: "400px 0px" });
    io.observe(section);
  } else {
    load();
  }
})();
