(function () {
  "use strict";

  const TYPE_ICONS = {
    video: '<path d="M8 5v14l11-7z"/>',
    document: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2.5L17.5 8H14zM8 12h8v2H8zm0 4h8v2H8z"/>',
    article: '<path d="M4 4h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0 4h10v2H4z"/>',
    audio: '<path d="M12 3a4 4 0 0 1 4 4v5a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4zm-7 9h2a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.92V21h-2v-2.08A7 7 0 0 1 5 12z"/>',
    image: '<path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 12h14l-4.5-6-3.5 4.5-2.5-3z"/>'
  };

  const state = { q: "", topic: "", type: "", tag: "" };
  let data = { topics: [], types: [], resources: [] };

  const $ = (id) => document.getElementById(id);
  const els = {
    search: $("search"),
    topics: $("topic-filters"),
    types: $("type-filters"),
    grid: $("grid"),
    empty: $("empty"),
    count: $("result-count"),
    activeTag: $("active-tag"),
    clear: $("clear"),
    theme: $("theme-toggle")
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // Only allow http(s) links so a bad data entry can't inject script URLs.
  function safeUrl(u) {
    try {
      const url = new URL(u, location.href);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "#";
    } catch (e) {
      return "#";
    }
  }

  function youtubeId(u) {
    try {
      const url = new URL(u);
      const host = url.hostname.replace(/^www\.|^m\./, "");
      if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
      if (host === "youtube.com" || host === "youtube-nocookie.com") {
        if (url.searchParams.get("v")) return url.searchParams.get("v");
        const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
        if (m) return m[1];
      }
    } catch (e) { /* not a URL */ }
    return null;
  }

  function thumbnailFor(r) {
    if (r.thumbnail) return safeUrl(r.thumbnail);
    const yt = youtubeId(r.url);
    return yt ? "https://i.ytimg.com/vi/" + encodeURIComponent(yt) + "/hqdefault.jpg" : null;
  }

  const label = (list, id) => (list.find((x) => x.id === id) || {}).label || id;

  function matches(r, ignore) {
    if (ignore !== "topic" && state.topic && r.topic !== state.topic) return false;
    if (ignore !== "type" && state.type && r.type !== state.type) return false;
    if (state.tag && !(r.tags || []).some((t) => t.toLowerCase() === state.tag)) return false;
    if (state.q) {
      const hay = [r.title, r.description, label(data.topics, r.topic), label(data.types, r.type)]
        .concat(r.tags || []).join(" ").toLowerCase();
      if (!state.q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  }

  function renderChips(container, list, key) {
    // Counts reflect the other active filters, so chips show what you'd get.
    const pool = data.resources.filter((r) => matches(r, key));
    const total = pool.length;
    const chip = (id, text, n, dotVar) =>
      '<button type="button" class="chip" data-key="' + key + '" data-value="' + escapeHtml(id) +
      '" aria-pressed="' + (state[key] === id) + '">' +
      (dotVar ? '<span class="dot" style="background:var(' + dotVar + ')"></span>' : "") +
      escapeHtml(text) + ' <span class="count">' + n + "</span></button>";

    container.innerHTML = chip("", "All", total) + list.map((item) =>
      chip(item.id, item.label, pool.filter((r) => r[key] === item.id).length,
        key === "type" ? "--type-" + item.id : null)
    ).join("");
  }

  function card(r) {
    const url = safeUrl(r.url);
    const thumb = thumbnailFor(r);
    const tc = "--tc:var(--type-" + escapeHtml(r.type) + ", var(--accent))";
    const icon = TYPE_ICONS[r.type] || TYPE_ICONS.article;
    const thumbHtml = thumb
      ? '<img src="' + escapeHtml(thumb) + '" alt="" loading="lazy">'
      : '<div class="thumb-placeholder"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + icon + "</svg></div>";
    const tags = (r.tags || []).map((t) =>
      '<button type="button" class="tag" data-tag="' + escapeHtml(t.toLowerCase()) + '">#' + escapeHtml(t) + "</button>"
    ).join("");

    return '<article class="card" style="' + tc + '">' +
      '<a class="card-thumb" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">' +
        thumbHtml + '<span class="type-badge">' + escapeHtml(label(data.types, r.type)) + "</span></a>" +
      '<div class="card-body">' +
        '<span class="card-topic">' + escapeHtml(label(data.topics, r.topic)) + "</span>" +
        '<h2 class="card-title"><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(r.title) + "</a></h2>" +
        (r.description ? '<p class="card-desc">' + escapeHtml(r.description) + "</p>" : "") +
        (tags ? '<div class="card-tags">' + tags + "</div>" : "") +
      "</div></article>";
  }

  function render() {
    const results = data.resources.filter((r) => matches(r));
    els.grid.innerHTML = results.map(card).join("");
    els.empty.hidden = results.length > 0;
    els.count.textContent = results.length + " of " + data.resources.length + " resources";

    renderChips(els.topics, data.topics, "topic");
    renderChips(els.types, data.types, "type");

    els.activeTag.hidden = !state.tag;
    els.activeTag.innerHTML = state.tag
      ? "#" + escapeHtml(state.tag) + ' <button type="button" aria-label="Remove tag filter">×</button>'
      : "";
    els.clear.hidden = !(state.q || state.topic || state.type || state.tag);
    writeHash();
  }

  // Keep filters in the URL hash so filtered views can be bookmarked and shared.
  function writeHash() {
    const p = new URLSearchParams();
    Object.keys(state).forEach((k) => { if (state[k]) p.set(k, state[k]); });
    const h = p.toString();
    history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
  }

  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    state.q = (p.get("q") || "").toLowerCase();
    state.topic = p.get("topic") || "";
    state.type = p.get("type") || "";
    state.tag = (p.get("tag") || "").toLowerCase();
    els.search.value = p.get("q") || "";
  }

  function bind() {
    let t;
    els.search.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { state.q = els.search.value.trim().toLowerCase(); render(); }, 120);
    });

    [els.topics, els.types].forEach((c) => c.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      state[b.dataset.key] = b.dataset.value;
      render();
    }));

    els.grid.addEventListener("click", (e) => {
      const b = e.target.closest(".tag");
      if (!b) return;
      state.tag = b.dataset.tag;
      render();
      els.count.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    els.activeTag.addEventListener("click", (e) => {
      if (e.target.closest("button")) { state.tag = ""; render(); }
    });

    els.clear.addEventListener("click", () => {
      state.q = state.topic = state.type = state.tag = "";
      els.search.value = "";
      render();
    });

    window.addEventListener("hashchange", () => { readHash(); render(); });

    els.theme.addEventListener("click", () => {
      const root = document.documentElement;
      const dark = root.dataset.theme
        ? root.dataset.theme === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) { /* storage unavailable */ }
    });
  }

  function initTheme() {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) document.documentElement.dataset.theme = saved;
    } catch (e) { /* storage unavailable */ }
  }

  initTheme();
  bind();
  fetch("data/resources.json", { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then((json) => {
      data = json;
      // Newest first; entries without a date go last.
      data.resources.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      readHash();
      render();
    })
    .catch((err) => {
      els.count.textContent = "";
      els.empty.hidden = false;
      els.empty.textContent = "Could not load resources (" + err.message + "). Check data/resources.json for a syntax error.";
    });
})();
