/* MOTIVA — routing, filtering, favourites, theme, keyboard.
   Plain browser JS, no build step, works when index.html is opened from disk. */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const els = {
    viewList: $("view-list"),
    viewDetail: $("view-detail"),
    grid: $("grid"),
    chips: $("chips"),
    count: $("count"),
    empty: $("empty"),
    search: $("search"),
    legend: $("legendList"),
    favToggle: $("favToggle"),
    themeToggle: $("themeToggle"),
    themeLabel: $("themeLabel"),
    heroQuote: $("heroQuote"),
    heroAuthor: $("heroAuthor"),
    heroSource: $("heroSource"),
    heroLink: $("heroLink"),
    heroCount: $("heroCount"),
    heroPortrait: $("heroPortraitWrap"),
    randomBtn: $("randomBtn")
  };

  const KEY_FAV = "motiva.favourites";
  const KEY_THEME = "motiva.theme";
  const STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5l2.3 4.9 5.2.6-3.9 3.6 1 5.2L10 14.3 5.4 16.8l1-5.2L2.5 8l5.2-.6z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
    }
  };

  const byId = {};
  QUOTES.forEach((q) => { byId[q.id] = q; });

  const authorByName = {};
  QUOTES.forEach((q) => { authorByName[q.author.name] = q.author; });

  const state = {
    theme: "Все",
    query: "",
    onlyFavs: false,
    favourites: Array.isArray(store.get(KEY_FAV, [])) ? store.get(KEY_FAV, []).filter((id) => typeof id === "string" && byId[id]) : [],
    listScroll: 0
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- helpers ---------------- */

  function esc(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function isFav(id) { return state.favourites.indexOf(id) !== -1; }

  function rel(q) { return RELIABILITY[q.reliability] || { label: q.reliability, hint: "" }; }

  function filtered() {
    const needle = state.query.trim().toLowerCase();
    return QUOTES.filter((q) => {
      if (state.theme !== "Все" && q.theme !== state.theme) return false;
      if (state.onlyFavs && !isFav(q.id)) return false;
      if (!needle) return true;
      const hay = [q.text, q.ru, q.theme, q.type, q.source, q.place, q.origin,
        q.author.name, q.author.ru, q.author.role, q.author.life].join(" ").toLowerCase();
      return hay.indexOf(needle) !== -1;
    });
  }

  function toast(message) {
    let box = $("toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "toast";
      box.className = "toast";
      box.setAttribute("role", "status");
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.classList.add("show");
    clearTimeout(box._t);
    box._t = setTimeout(() => box.classList.remove("show"), 2200);
  }

  /* ---------------- theme ---------------- */

  function applyTheme(mode) {
    document.documentElement.dataset.theme = mode;
    els.themeLabel.textContent = mode === "dark" ? "Светлая" : "Тёмная";
    els.themeToggle.title = mode === "dark" ? "Включить светлую тему" : "Включить тёмную тему";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "dark" ? "#121315" : "#F4F1EA");
    store.set(KEY_THEME, mode);
  }

  function initTheme() {
    const savedValue = store.get(KEY_THEME, null);
    const saved = savedValue === "dark" || savedValue === "light" ? savedValue : null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
  }

  /* ---------------- list rendering ---------------- */

  function renderLegend() {
    els.legend.innerHTML = Object.keys(RELIABILITY).map((key) => {
      const r = RELIABILITY[key];
      return `<li><span class="badge badge--${key}">${esc(r.label)}</span><span>${esc(r.hint)}</span></li>`;
    }).join("");
  }

  function renderChips() {
    els.chips.innerHTML = THEMES.map((t) =>
      `<button class="chip" type="button" role="tab" data-theme="${esc(t)}" aria-selected="${t === state.theme}">${esc(t)}</button>`
    ).join("");
  }

  function cardHTML(q, index) {
    const src = portraitSrc(q.author);
    const delay = reduced ? 0 : Math.min(index * 40, 320);
    const sameText = q.text === q.ru;
    return `<article class="card fade-in" style="animation-delay:${delay}ms">
      <button class="star" type="button" data-fav="${esc(q.id)}" aria-pressed="${isFav(q.id)}"
        title="${isFav(q.id) ? "Убрать из избранного" : "Добавить в избранное"}"
        aria-label="${isFav(q.id) ? "Убрать из избранного" : "Добавить в избранное"}">${STAR}</button>
      <div class="card__top">
        <img class="card__portrait" src="${src}" alt="Портрет: ${esc(q.author.ru)}" data-author-key="${esc(q.author.name)}" loading="lazy" decoding="async">
        <div class="card__who">
          <p class="card__author">${esc(q.author.ru)}</p>
          <p class="card__role">${esc(q.author.role)}</p>
          <p class="card__years">${esc(q.author.life)}</p>
        </div>
      </div>
      <a class="card__link" href="#/quote/${esc(q.id)}">
        <h3 class="card__quote">${sameText ? esc(q.ru) : "&laquo;" + esc(q.ru) + "&raquo;"}</h3>
        ${sameText ? "" : `<p class="card__ru">${esc(q.text)}</p>`}
      </a>
      <div class="card__foot">
        <span class="card__theme">${esc(q.theme)} · ${esc(q.date)}</span>
        <span class="badge badge--${esc(q.reliability)}">${esc(rel(q).label)}</span>
      </div>
    </article>`;
  }

  function renderList() {
    const items = filtered();
    els.grid.innerHTML = items.map(cardHTML).join("");
    els.empty.hidden = items.length !== 0;
    const total = items.length;
    const favNote = state.onlyFavs ? " в избранном" : "";
    els.count.textContent = `${total} ${plural(total, ["фраза", "фразы", "фраз"])}${favNote}`;
  }

  function plural(n, forms) {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
    return forms[2];
  }

  /* ---------------- hero ---------------- */

  function dailyQuoteIndex() {
    const now = new Date();
    const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    return ((dayNumber % QUOTES.length) + QUOTES.length) % QUOTES.length;
  }

  let heroIndex = dailyQuoteIndex();

  function renderHero() {
    const q = QUOTES[heroIndex];
    els.heroQuote.innerHTML = q.text === q.ru ? esc(q.text) : `&laquo;${esc(q.ru)}&raquo;`;
    els.heroAuthor.innerHTML = `<strong>${esc(q.author.ru)}</strong>`;
    els.heroSource.textContent = `${q.type}, ${q.date}`;
    els.heroLink.setAttribute("href", "#/quote/" + q.id);
    els.heroLink.dataset.id = q.id;
    els.heroPortrait.innerHTML =
      `<img src="${portraitSrc(q.author)}" alt="Портрет: ${esc(q.author.ru)}" data-author-key="${esc(q.author.name)}" decoding="async">` +
      `<span class="hero__label">${esc(q.author.name)}</span>`;
    const wrap = els.heroPortrait.firstElementChild;
    if (!reduced) {
      wrap.classList.remove("fade-in");
      void wrap.offsetWidth;
      wrap.classList.add("fade-in");
    }
  }

  // Цитата дня остаётся стабильной в течение календарного дня.

  /* ---------------- detail rendering ---------------- */

  function row(label, value, note) {
    return `<div class="dossier-row"><dt>${esc(label)}</dt><dd>${esc(value)}${note ? `<small>${esc(note)}</small>` : ""}</dd></div>`;
  }

  function detailHTML(q) {
    const idx = QUOTES.indexOf(q);
    const prev = QUOTES[(idx - 1 + QUOTES.length) % QUOTES.length];
    const next = QUOTES[(idx + 1) % QUOTES.length];
    const r = rel(q);
    const sameText = q.text === q.ru;
    const related = QUOTES
      .filter((o) => o.id !== q.id && (o.theme === q.theme || o.author.name === q.author.name))
      .slice(0, 3);

    return `
      <a class="back" href="#/">← Вся коллекция</a>

      <header class="detail__head fade-in">
        <p class="eyebrow">${esc(q.theme)} · ${esc(q.type)}</p>
        <h1 class="detail__quote">${sameText ? esc(q.ru) : "&laquo;" + esc(q.ru) + "&raquo;"}</h1>
        ${sameText ? "" : `<p class="detail__ru">Оригинал: ${esc(q.text)}</p>`}
        <p class="detail__by">
          <b>${esc(q.author.ru)}</b>
          <span>${esc(q.author.role)}, ${esc(q.author.life)}</span>
          <span class="badge badge--${esc(q.reliability)}">${esc(r.label)}</span>
        </p>
      </header>

      <div class="detail__body">
        <div class="aside">
          <figure class="aside__portrait">
            <img src="${portraitSrc(q.author)}" alt="${q.author.photo ? "Фото" : "Минималистичный портрет"}: ${esc(q.author.ru)}" data-author-key="${esc(q.author.name)}" decoding="async">
            <figcaption><span>${q.author.photo ? "Фото: Wikimedia Commons" : "Портрет автора"}</span><span>${esc((q.author.portrait && q.author.portrait.initials) || "")}</span></figcaption>
          </figure>

          <div class="aside__bio"><b>${esc(q.author.ru)}</b>${esc(q.author.bio)}</div>

          <div class="actions">
            <button class="btn" type="button" data-copy="${esc(q.id)}">Скопировать</button>
            <button class="btn" type="button" data-share="${esc(q.id)}">Поделиться ↗</button>
            <button class="btn" type="button" data-fav="${esc(q.id)}" aria-pressed="${isFav(q.id)}">
              ${isFav(q.id) ? "В избранном ★" : "В избранное"}
            </button>
            <a class="btn" href="${esc(q.link.url)}" target="_blank" rel="noopener noreferrer">Источник ↗</a>
          </div>
        </div>

        <div>
          <dl class="dossier">
            ${row("Автор", `${q.author.ru} (${q.author.name})`, q.author.role + ", " + q.author.life)}
            ${row("Источник", q.source)}
            ${row("Дата", q.date)}
            ${row("Место", q.place)}
            ${row("Язык оригинала", q.language)}
            ${row("Происхождение", q.origin)}
            ${row("Тема", q.theme)}
            ${row("Тип текста", q.type)}
            ${row("Атрибуция", r.label, r.hint)}
          </dl>

          <section class="block">
            <h2>Откуда эта фраза</h2>
            <div class="origin"><p>${esc(q.story)}</p></div>
            <p class="rel-note"><span class="badge badge--${esc(q.reliability)}">${esc(r.label)}</span><span>${esc(r.hint)}</span></p>
          </section>

          <section class="block">
            <h2>Три факта</h2>
            <ol class="facts">${q.facts.map((f) => `<li><span>${esc(f)}</span></li>`).join("")}</ol>
          </section>

          ${related.length ? `<section class="block">
            <h2>Близко по теме</h2>
            <div class="related">${related.map((o) =>
              `<a href="#/quote/${esc(o.id)}"><i>${esc(o.author.ru)}</i>${esc(o.ru)}</a>`).join("")}</div>
          </section>` : ""}

          <nav class="pager" aria-label="Соседние фразы">
            <a href="#/quote/${esc(prev.id)}"><span>← ${esc(prev.author.ru)}</span><b>${esc(prev.ru)}</b></a>
            <a href="#/quote/${esc(next.id)}"><span>${esc(next.author.ru)} →</span><b>${esc(next.ru)}</b></a>
          </nav>
        </div>
      </div>`;
  }

  /* ---------------- routing ---------------- */

  function showList() {
    els.viewDetail.hidden = true;
    els.viewList.hidden = false;
    document.title = "MOTIVA — мотивирующие фразы с пропиской";
    renderList();
    window.scrollTo(0, state.listScroll);
  }

  function showDetail(id) {
    const q = byId[id];
    if (!q) { location.hash = "#/"; return false; }
    state.listScroll = els.viewList.hidden ? state.listScroll : window.scrollY;
    els.viewList.hidden = true;
    els.viewDetail.hidden = false;
    els.viewDetail.innerHTML = detailHTML(q);
    document.title = `${q.author.ru} — ${q.ru}`;
    window.scrollTo(0, 0);
    const heading = els.viewDetail.querySelector(".detail__quote");
    if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
    return true;
  }

  function route() {
    const hash = location.hash || "#/";
    const match = hash.match(/^#\/quote\/(.+)$/);
    if (match) showDetail(decodeURIComponent(match[1]));
    else showList();
  }

  /* ---------------- actions ---------------- */

  function toggleFav(id) {
    const i = state.favourites.indexOf(id);
    const added = i === -1;
    if (added) state.favourites.push(id);
    else state.favourites.splice(i, 1);
    store.set(KEY_FAV, state.favourites);
    toast(added ? "Добавлено в избранное" : "Убрано из избранного");

    // update whatever is on screen, without rebuilding the whole view
    if (!els.viewDetail.hidden) {
      const btn = els.viewDetail.querySelector("[data-fav]");
      if (btn) {
        btn.setAttribute("aria-pressed", String(isFav(id)));
        btn.textContent = isFav(id) ? "В избранном ★" : "В избранное";
      }
    }
    if (!els.viewList.hidden) {
      if (state.onlyFavs) { renderList(); return; }
      els.grid.querySelectorAll("[data-fav]").forEach((star) => {
        if (star.dataset.fav !== id) return;
        const on = isFav(id);
        star.setAttribute("aria-pressed", String(on));
        const label = on ? "Убрать из избранного" : "Добавить в избранное";
        star.title = label;
        star.setAttribute("aria-label", label);
      });
    }
  }

  function copyQuote(id) {
    const q = byId[id];
    if (!q) return;
    const text = `${q.text}\n${q.ru}\n— ${q.author.ru}, ${q.source} (${q.date})`;
    const done = () => toast("Фраза скопирована");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => legacyCopy(text, done));
    } else legacyCopy(text, done);
  }

  async function shareQuote(id) {
    const q = byId[id];
    if (!q) return;
    const shareData = { title: `MOTIVA — ${q.author.ru}`, text: `«${q.ru}»\n— ${q.author.ru}`, url: `${location.href.split("#")[0]}#/quote/${encodeURIComponent(id)}` };
    if (navigator.share) {
      try { await navigator.share(shareData); }
      catch (error) { if (error.name !== "AbortError") toast("Не удалось открыть меню отправки"); }
    } else {
      const text = `${shareData.text}\n${shareData.url}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => toast("Ссылка и цитата скопированы"), () => legacyCopy(text, () => toast("Ссылка и цитата скопированы")));
      } else legacyCopy(text, () => toast("Ссылка и цитата скопированы"));
    }
  }

  function legacyCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;left:-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); }
    catch (e) { toast("Не удалось скопировать — выделите текст вручную"); }
    document.body.removeChild(ta);
  }

  /* ---------------- events ---------------- */

  document.addEventListener("click", (e) => {
    const fav = e.target.closest("[data-fav]");
    if (fav) { e.preventDefault(); toggleFav(fav.dataset.fav); return; }

    const copy = e.target.closest("[data-copy]");
    if (copy) { e.preventDefault(); copyQuote(copy.dataset.copy); return; }

    const share = e.target.closest("[data-share]");
    if (share) { e.preventDefault(); shareQuote(share.dataset.share); return; }

    // note: <html> also carries data-theme, so match the chip by class
    const chip = e.target.closest(".chip, .mood__button");
    if (chip) {
      state.theme = chip.dataset.theme;
      renderChips();
      renderList();
      if (!els.viewList.hidden) document.querySelector(".filters").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  });

  const resetFilters = $("resetFilters");
  if (resetFilters) resetFilters.addEventListener("click", () => {
    state.theme = "Все"; state.query = ""; state.onlyFavs = false;
    els.search.value = ""; els.favToggle.setAttribute("aria-pressed", "false");
    renderChips(); renderList();
  });

  els.randomBtn.addEventListener("click", () => {
    let pick;
    do { pick = QUOTES[Math.floor(Math.random() * QUOTES.length)]; }
    while (QUOTES.length > 1 && pick.id === els.heroLink.dataset.id);
    location.hash = "#/quote/" + pick.id;
  });

  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    if (!els.viewDetail.hidden) {
      // leaving the detail page: hashchange will render the list
      location.hash = "#/";
    } else {
      renderList();
    }
  });

  els.favToggle.addEventListener("click", () => {
    state.onlyFavs = !state.onlyFavs;
    els.favToggle.setAttribute("aria-pressed", String(state.onlyFavs));
    if (els.viewDetail.hidden === false) location.hash = "#/";
    else renderList();
  });

  els.themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== els.search) {
      e.preventDefault();
      els.search.focus();
      els.search.select();
      return;
    }
    if (e.key === "Escape") {
      if (document.activeElement === els.search && els.search.value) {
        els.search.value = ""; state.query = ""; renderList();
      } else if (!els.viewDetail.hidden) {
        location.hash = "#/";
      }
      return;
    }
    const onDetail = !els.viewDetail.hidden;
    if (onDetail && (e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.metaKey && !e.ctrlKey) {
      const current = (location.hash.match(/^#\/quote\/(.+)$/) || [])[1];
      const idx = QUOTES.findIndex((q) => q.id === current);
      if (idx === -1) return;
      const step = e.key === "ArrowLeft" ? -1 : 1;
      const target = QUOTES[(idx + step + QUOTES.length) % QUOTES.length];
      location.hash = "#/quote/" + target.id;
    }
  });

  window.addEventListener("hashchange", route);

  /* ---------------- photo fallback ---------------- */

  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!img || img.tagName !== "IMG" || !img.dataset.authorKey || img.dataset.fbApplied) return;
    const author = authorByName[img.dataset.authorKey];
    if (!author) return;
    img.dataset.fbApplied = "1";
    img.src = svgPortraitSrc(author);
    // Fix alt text and figcaption when falling back
    img.alt = img.alt.replace(/^Фото/, "Портрет");
    const cap = img.parentElement && img.parentElement.querySelector("figcaption span");
    if (cap && cap.textContent.indexOf("Фото") === 0) cap.textContent = "Портрет автора";
  }, true);

  /* ---------------- boot ---------------- */

  initTheme();
  renderLegend();
  renderChips();
  els.heroCount.textContent = String(QUOTES.length);
  renderHero();
  route();
})();
