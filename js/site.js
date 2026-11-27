// Thong Thai: site behaviour. Plain JS, no frameworks.
// Every feature checks for its element first, so each page only runs what it has.
document.documentElement.classList.add("js");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let reduce = motionPreference.matches;
const finePointer = matchMedia("(pointer: fine)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Keep navigation directional while leaving the header and shared phone independent.
(() => {
  const orders = { "index.html": 0, "about.html": 1, "projects.html": 2, "resume.html": 3, "golden-peace.html": 2.5 };
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const order = url => {
    if (url == null) return;
    try { return orders[new URL(url, location.href).pathname.split("/").pop() || "index.html"]; } catch {}
  };
  const direction = (e, from, to) => {
    if (!e.viewTransition || motion.matches || document.documentElement.classList.contains("motion-paused")) return;
    const a = order(from), b = order(to);
    if (typeof a === "number" && typeof b === "number" && a !== b) e.viewTransition?.types?.add(b > a ? "forward" : "back");
  };
  addEventListener("pageswap", e => {
    if (!e.viewTransition) return;
    const from = e.activation?.from?.url, to = e.activation?.entry?.url;
    direction(e, from, to);
    // Safari 18.2 has transition events before it has navigation.activation.
    try { sessionStorage.setItem("page-transition", JSON.stringify({ from, to })); } catch {}
  });
  addEventListener("pagereveal", e => {
    if (!e.viewTransition) return;
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem("page-transition")); sessionStorage.removeItem("page-transition"); } catch {}
    const activation = window.navigation?.activation;
    if (activation) direction(e, activation.from?.url, activation.entry?.url);
    else if (saved?.to === location.href) direction(e, saved.from, saved.to);
  });

  // A real element lets only the current-link dot glide between header snapshots.
  const current = $("header nav a[aria-current]");
  if (current) {
    const dot = document.createElement("span");
    dot.className = "nav-dot"; dot.setAttribute("aria-hidden", "true"); current.append(dot);
  }

  if (!("onpagereveal" in window) || !window.CSS?.supports("view-transition-name: none")) {
    const html = document.documentElement;
    html.classList.add("no-vt");
    let leaving = false, timer;
    document.addEventListener("click", e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || motion.matches || !motionOK()) return;
      const link = e.target.closest("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target.toLowerCase() !== "_self")) return;
      const url = new URL(link.href), here = new URL(location.href);
      if (url.origin !== here.origin || !/\.html$/i.test(url.pathname) || (url.pathname === here.pathname && url.search === here.search)) return;
      e.preventDefault();
      if (leaving) return;
      leaving = true; html.classList.add("page-leaving");
      timer = setTimeout(() => location.assign(url.href), 180);
    });
    // Restored history entries must never retain the outgoing fade.
    addEventListener("pageshow", e => {
      if (e.persisted) { clearTimeout(timer); leaving = false; html.classList.remove("page-leaving"); }
    });
  }
})();

const store = { // localStorage can be blocked; the site still works without it
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
/* ---------- Motion: controls ---------- */
let motionPaused = store.get("tt-motion", false) === true;
const hiddenAnimations = new Set();
function motionOK() { return !reduce && !motionPaused; }
const motionState = () => {
  document.documentElement.classList.toggle("motion-paused", motionPaused);
  document.documentElement.classList.toggle("motion-hidden", document.hidden);
  document.getAnimations().filter(a => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)).forEach(a => {
    if (!motionOK() && Number.isFinite(a.effect?.getComputedTiming().endTime)) { a.finish(); hiddenAnimations.delete(a); }
    else if (document.hidden && a.playState === "running") { a.pause(); hiddenAnimations.add(a); }
  });
  if (!document.hidden) { hiddenAnimations.forEach(a => { if (motionOK() && a.playState === "paused") a.play(); }); hiddenAnimations.clear(); }
  window.dispatchEvent(new Event("motionchange"));
};
motionState();
motionPreference.addEventListener("change", () => { reduce = motionPreference.matches; motionState(); });
document.addEventListener("visibilitychange", motionState);
const EMAIL = "thong11042008@gmail.com";
const GITHUB = "https://github.com/NotWutLit";

console.log(
  "%cHi, I'm Thong.%c\nThis site is hand-written HTML, CSS and JavaScript. No frameworks.\nThere are 5 keys hidden around the site. Press ` for a terminal.",
  "font: 400 22px 'Instrument Serif', Georgia, serif; color: #E8B651;", "font: 13px system-ui; color: inherit;"
);

/* ---------- Typed name (Home, once per visit) ---------- */
const typed = $("[data-type]");
let seen = false;
if (typed) try { seen = sessionStorage.getItem("typed") === "1"; sessionStorage.setItem("typed", "1"); } catch {}
if (seen && typed) typed.classList.add("typed-before");
if (typed && !seen && motionOK()) {
  const text = typed.textContent.trim(), start = 250, per = 75;
  typed.setAttribute("aria-label", text);
  const out = document.createElement("span"); out.setAttribute("aria-hidden", "true");
  typed.replaceChildren(out);
  typed.style.setProperty("--typed-at", `${start + text.length * per}ms`);
  let finished = false;
  [...text].forEach((ch, i) => setTimeout(() => { if (!finished) out.textContent = motionOK() ? text.slice(0, i + 1) : text; }, start + i * per));
  addEventListener("motionchange", () => { if (!motionOK()) { finished = true; out.textContent = text; } });
}

/* ---------- 3D titles ---------- */
(() => {
  const titles = $$("h1.title-3d"), mobile = matchMedia("(max-width: 599px)");
  titles.forEach(el => {
    const face = document.createElement("span"); face.className = "t3d-face";
    face.append(...el.childNodes); el.append(face);
    let layers = [], frame = 0;
    const mirror = () => {
      frame = 0;
      const content = face.cloneNode(true);
      // Clones paint depth without repeating identifiers or selectable content.
      $$("[id]", content).forEach(node => node.removeAttribute("id"));
      layers.forEach(layer => { layer.innerHTML = content.innerHTML; });
    };
    const build = () => {
      layers.forEach(layer => layer.remove());
      const count = mobile.matches ? 7 : 12;
      layers = Array.from({ length: count }, (_, i) => {
        const layer = document.createElement("span"); layer.className = "t3d-layer";
        layer.setAttribute("aria-hidden", "true"); layer.setAttribute("inert", "");
        layer.style.setProperty("--i", i + 1);
        layer.style.setProperty("--shade", `${i / (count - 1) * 100}%`);
        el.append(layer); return layer;
      });
      mirror();
    };
    build(); mobile.addEventListener("change", build);
    // Typing changes only the face; batch its depth copies into the same frame.
    new MutationObserver(() => { if (!frame) frame = requestAnimationFrame(mirror); })
      .observe(face, { childList: true, characterData: true, subtree: true });
  });
  if (!finePointer || reduce) return;
  const visible = new Set();
  let raf = 0, mx = 0, my = 0;
  const clamp = n => Math.max(-1, Math.min(1, n));
  const reset = el => ["--rx", "--ry"].forEach(p => el.style.removeProperty(p));
  const observer = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) visible.add(target);
    else { visible.delete(target); reset(target); }
  }));
  titles.forEach(el => observer.observe(el));
  addEventListener("pointermove", e => {
    mx = e.clientX; my = e.clientY;
    if (raf || !visible.size || !motionOK() || document.hidden) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      visible.forEach(el => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const px = clamp((mx - r.left - r.width / 2) / (r.width / 2));
        const py = clamp((my - r.top - r.height / 2) / (r.height / 2));
        el.style.setProperty("--rx", (-py * 10).toFixed(2) + "deg");
        el.style.setProperty("--ry", (px * 10).toFixed(2) + "deg");
      });
    });
  }, { passive: true });
  const resetAll = () => { cancelAnimationFrame(raf); raf = 0; titles.forEach(reset); };
  // The document root receives pointerleave when the pointer exits the window.
  document.documentElement.addEventListener("pointerleave", resetAll, { passive: true });
  addEventListener("blur", resetAll);
  addEventListener("motionchange", resetAll);
})();

/* ---------- Cursor spotlight + scroll progress ---------- */
const root = document.documentElement;
if (finePointer && !reduce) {
  let raf = 0, mx = 0, my = 0;
  addEventListener("pointermove", e => { if (!motionOK() || document.hidden) return; mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(() => { root.style.setProperty("--mx", mx + "px"); root.style.setProperty("--my", my + "px"); raf = 0; }); }, { passive: true });
}
const bar = document.createElement("div"); bar.className = "progress"; bar.setAttribute("aria-hidden", "true"); document.body.prepend(bar);
const onScroll = () => { const h = root.scrollHeight - innerHeight; bar.style.setProperty("--p", h > 0 ? (scrollY / h).toFixed(4) : 0); };
addEventListener("scroll", onScroll, { passive: true }); onScroll();

/* ---------- Clocks (Đà Nẵng and Athens, GA) ---------- */
const fmt = tz => new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit" });
const daNang = fmt("Asia/Ho_Chi_Minh"), athens = fmt("America/New_York");
function clocksHTML() { return `<span>Đà Nẵng <b data-tz="dn"></b></span><span>Athens, GA <b data-tz="ath"></b></span>`; }
const footWide = $("footer .wide");
if (footWide) { const c = document.createElement("p"); c.className = "clocks"; c.innerHTML = clocksHTML(); footWide.append(c); }
$$("[data-clocks]").forEach(el => { el.classList.add("clocks"); el.innerHTML = clocksHTML(); });
const tick = () => { const n = new Date(); $$("[data-tz=dn]").forEach(b => b.textContent = daNang.format(n)); $$("[data-tz=ath]").forEach(b => b.textContent = athens.format(n)); };
tick(); setInterval(tick, 1000);

/* ---------- Motion: reveals ---------- */
const revealSel = "[data-reveal], main h2, .card, .tile, .gallery figure, .resume-item, .timeline li, .photo-row, .reflection, .facts, .sec-head, .board, .outro > *, .about-head, .demo, .skill-groups > div, .awards > li, .resume-stats > li";
const revealEls = $$(revealSel).filter(el => !el.closest(".hero"));
revealEls.forEach(el => {
  if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "");
  const sibs = [...el.parentElement.children].filter(c => c.matches(revealSel));
  if (sibs.length > 1) el.style.setProperty("--d", Math.min(sibs.indexOf(el), 5) * 80 + "ms"); // stagger lists, capped
});
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); e.target.dispatchEvent(new Event("revealed")); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
revealEls.forEach(el => io.observe(el));

/* ---------- Spotlight cards + 3D tilt ---------- */
$$(".spot").forEach(el => el.addEventListener("pointermove", e => {
  if (!motionOK() || document.hidden) return;
  const r = el.getBoundingClientRect(); el.style.setProperty("--x", e.clientX - r.left + "px"); el.style.setProperty("--y", e.clientY - r.top + "px");
}));
if (finePointer && !reduce) {
  $$("[data-tilt]").forEach(el => {
    const max = +el.dataset.tilt || 6;
    el.addEventListener("pointermove", e => {
      if (!motionOK() || document.hidden || innerWidth < 600) return;
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    addEventListener("motionchange", () => { el.style.transform = ""; });
  });
  const hp = $(".hero-photo .polaroid");
  if (hp) addEventListener("pointermove", e => {
    if (!motionOK() || document.hidden) return;
    const px = e.clientX / innerWidth - .5, py = e.clientY / innerHeight - .5;
    hp.style.setProperty("--ty", (px * 16).toFixed(2) + "deg"); hp.style.setProperty("--tx", (-py * 12).toFixed(2) + "deg");
  }, { passive: true });
}

/* ---------- Golden Peace: CSS 3D phone turns as you scroll ---------- */
const p3 = $(".phone3d img");
if (p3 && !reduce) {
  const upd = () => { if (!motionOK() || document.hidden || p3.getBoundingClientRect().bottom < 0) return; const t = Math.min(scrollY / 600, 1); p3.style.setProperty("--ry", (-14 + t * 28).toFixed(2) + "deg"); p3.style.setProperty("--rx", (6 - t * 6).toFixed(2) + "deg"); };
  addEventListener("scroll", upd, { passive: true }); upd();
}

/* ---------- Parallax on the Đà Nẵng tile ---------- */
const par = $(".b-home img");
if (par && !reduce) addEventListener("scroll", () => {
  if (!motionOK() || document.hidden) return;
  const r = par.parentElement.getBoundingClientRect(); par.style.setProperty("--par", ((r.top - innerHeight / 2) * -.06).toFixed(1) + "px");
}, { passive: true });

/* ---------- Text scramble: "I build apps for ___" ---------- */
const scrambleGlyphs = "!<>-_\\/[]{}=+*^?#01";
const scr = $(".scramble");
if (scr) {
  const phrases = JSON.parse(scr.dataset.phrases || "[]"), glyphs = scrambleGlyphs;
  let idx = 0;
  const to = (next) => new Promise(done => {
    if (!motionOK()) { scr.textContent = next; return done(); }
    const from = scr.textContent, len = Math.max(from.length, next.length), q = [];
    for (let i = 0; i < len; i++) { const s = Math.floor(Math.random() * 18), e = s + 8 + Math.floor(Math.random() * 18); q.push({ from: from[i] || "", to: next[i] || "", s, e }); }
    let f = 0;
    const step = () => {
      if (!motionOK() || document.hidden || scr.getBoundingClientRect().bottom < 0) { scr.textContent = next; return done(); }
      let html = "", doneCount = 0;
      for (const c of q) {
        if (f >= c.e) { doneCount++; html += c.to; }
        else if (f >= c.s) html += `<span class="glyph">${glyphs[Math.floor(Math.random() * glyphs.length)]}</span>`;
        else html += c.from;
      }
      scr.innerHTML = html;
      if (doneCount === q.length) done(); else { f++; requestAnimationFrame(step); }
    };
    step();
  });
  const loop = async () => { if (motionOK() && !document.hidden && scr.getBoundingClientRect().bottom > 0) { idx = (idx + 1) % phrases.length; await to(phrases[idx]); } setTimeout(loop, 2600); };
  if (phrases.length > 1) setTimeout(loop, 2600);
}

/* ---------- Polaroid board: drag to rearrange (desktop) ---------- */
const board = $(".board");
if (board && matchMedia("(min-width: 900px)").matches) {
  let z = 10;
  $$(".polaroid", board).forEach(p => {
    const home = { left: p.style.left, top: p.style.top };
    p.addEventListener("pointerdown", e => {
      p.setPointerCapture(e.pointerId); p.classList.add("dragging"); p.style.zIndex = ++z;
      const b = board.getBoundingClientRect(), r = p.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
      const move = ev => {
        p.style.left = Math.max(-40, Math.min(ev.clientX - b.left - ox, b.width - r.width + 40)) + "px";
        p.style.top = Math.max(-40, Math.min(ev.clientY - b.top - oy, b.height - r.height + 40)) + "px";
      };
      const up = () => { p.classList.remove("dragging"); p.removeEventListener("pointermove", move); p.removeEventListener("pointerup", up); };
      p.addEventListener("pointermove", move); p.addEventListener("pointerup", up);
    });
    p.addEventListener("dblclick", () => { p.style.left = home.left; p.style.top = home.top; });
  });
}

/* ---------- Flip cards ---------- */
$$(".flip").forEach(f => {
  const toggle = () => { const on = f.classList.toggle("flipped"); f.setAttribute("aria-pressed", on); if (on) f.dispatchEvent(new Event("flipped")); };
  f.addEventListener("click", e => { if (!e.target.closest(".key")) toggle(); });
  f.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target === f) { e.preventDefault(); toggle(); } });
});

/* ---------- Toast ---------- */
const toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.append(toastEl);
let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 3200); }

/* =========================================================
   Escape room: 5 rooms (pages), 5 keys
   ========================================================= */
const ROOMS = [
  { id: "home", name: "Home", url: "index.html", hint: "Photos on a table can hide things. Try moving them around." },
  { id: "about", name: "About", url: "about.html", hint: "Some photos have something written on the back." },
  { id: "projects", name: "Projects", url: "projects.html", hint: "Remember Me entries are letters. Write one to someone you love and seal it." },
  { id: "resume", name: "Résumé", url: "resume.html", hint: "Read all the way to the end of my story." },
  { id: "gp", name: "Golden Peace", url: "golden-peace.html", hint: "Watch the demo. The key shows up when the app starts playing." },
];
const KEY_SVG = `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="10" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M16 16h13M24 16v5M28 16v4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
const page = document.body.dataset.page;
let found = new Set(store.get("tt-keys", []));

// key ring + palette buttons in the header
const nav = $("header nav");
const tools = document.createElement("div"); tools.className = "tools";
tools.innerHTML = `<button class="chip-btn keyring" type="button" aria-label="Escape room: keys found">${KEY_SVG.replace('aria-hidden="true"', 'aria-hidden="true" width="16" height="16"')}<span class="slots">${ROOMS.map(() => "<i></i>").join("")}</span><span class="count"></span></button>
  <button class="chip-btn cmdk" type="button" aria-label="Open command palette"><kbd>${/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"} K</kbd></button>`;
nav?.append(tools);
const motionButton = document.createElement("button");
motionButton.className = "chip-btn motion-toggle"; motionButton.type = "button";
tools.append(motionButton);
const paintMotion = () => {
  const label = motionPaused ? "Play motion" : "Pause motion";
  motionButton.setAttribute("aria-pressed", String(motionPaused));
  motionButton.setAttribute("aria-label", label); motionButton.title = label;
  motionButton.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">${motionPaused ? '<path d="m4 2 10 6-10 6Z"/>' : '<path d="M3 2h3v12H3zm7 0h3v12h-3z"/>'}</svg><span>${label}</span>`;
};
motionButton.addEventListener("click", () => { motionPaused = !motionPaused; store.set("tt-motion", motionPaused); motionState(); });
addEventListener("motionchange", paintMotion); paintMotion();
const ring = $(".keyring", tools);
const flyingKeys = new Set();
function paintRing() {
  $$(".slots i", ring).forEach((s, i) => s.classList.toggle("on", i < found.size && !flyingKeys.has(i)));
  $(".count", ring).textContent = `${found.size}/5`;
  ring.setAttribute("aria-label", `Escape room: ${found.size} of 5 keys found`);
}
paintRing();

// keys on this page
$$(".key[data-key]").forEach(k => {
  k.innerHTML = KEY_SVG + `<span class="sr-only">Hidden key. Select to collect it.</span>`;
  if (found.has(k.dataset.key)) { k.remove(); return; }
  k.addEventListener("click", () => collect(k.dataset.key, k));
});
function collect(id, el) {
  if (found.has(id)) return;
  found.add(id); store.set("tt-keys", [...found]);
  flyKey(el, found.size - 1);
  el?.classList.add("found"); setTimeout(() => el?.remove(), 700);
  paintRing();
  chibiCheer();
  if (found.size === 5) { toast("All 5 keys found. Mini me has something for you…"); setTimeout(giveCookie, 1300); }
  else toast(`Key found! ${found.size} of 5. ${5 - found.size} more hidden around the site.`);
}

/* ---------- Key collection flight ---------- */
function flyKey(el, index) {
  const slot = $$(".slots i", ring)[index], icon = el?.querySelector("svg");
  if (!motionOK() || document.hidden || !icon || !slot || !ring.isConnected) return;
  // Hold only the travelling slot so the accessible count can update immediately.
  flyingKeys.add(index);
  const a = icon.getBoundingClientRect(), b = slot.getBoundingClientRect();
  const x = a.left + a.width / 2, y = a.top + a.height / 2, dx = b.left + b.width / 2 - x, dy = b.top + b.height / 2 - y;
  const layer = document.createElement("div"); layer.className = "key-fx"; layer.setAttribute("aria-hidden", "true");
  const sprite = document.createElement("span"); sprite.className = "key-flight"; sprite.append(icon.cloneNode(true));
  Object.assign(sprite.style, { left: `${x}px`, top: `${y}px`, width: `${a.width}px`, height: `${a.height}px` });
  layer.append(sprite); document.body.append(layer);
  const burst = document.createElement("i"); burst.className = "key-shock"; burst.style.left = `${x}px`; burst.style.top = `${y}px`; layer.append(burst);
  burst.animate([{ transform: "translate(-50%,-50%) scale(.2)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(3)", opacity: 0 }], { duration: 550, fill: "forwards", easing: "ease-out" });
  for (let i = 0; i < 10; i++) {
    const p = document.createElement("i"), angle = i * Math.PI / 5, distance = 32 + (i % 3) * 12;
    p.className = "key-spark"; p.style.left = `${x}px`; p.style.top = `${y}px`; layer.append(p);
    p.animate([{ transform: "translate(-50%,-50%) scale(.4)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px),calc(-50% + ${Math.sin(angle) * distance}px)) rotate(100deg) scale(0)`, opacity: 0 }], { duration: 500 + i * 22, fill: "forwards", easing: "ease-out" });
  }
  // Sample a quadratic arc once; the compositor handles every animation frame.
  const bend = Math.min(160, Math.abs(dy) * .25 + 55), controlX = Math.min(innerWidth - 24, Math.max(24, x + dx * .35 + bend)) - x, controlY = Math.max(24, Math.min(y, y + dy) - bend) - y;
  const frames = Array.from({ length: 21 }, (_, i) => {
    const t = i / 20, u = 1 - t, px = 2 * u * t * controlX + t * t * dx, py = 2 * u * t * controlY + t * t * dy;
    return { transform: `translate(-50%,-50%) translate(${px}px,${py}px) rotate(${t * 150}deg) scale(${1 - t * .78})` };
  });
  const arrive = () => {
    flyingKeys.delete(index); paintRing(); layer.remove();
    if (!motionOK() || document.hidden) return;
    slot.animate([{ transform: "scale(.6)" }, { transform: "scale(1.6)", offset: .55 }, { transform: "scale(1)" }], { duration: 360, easing: "ease-out" });
    ring.classList.add("bump"); ring.addEventListener("animationend", () => ring.classList.remove("bump"), { once: true });
    const glint = document.createElement("i"); glint.className = "keyring-glint"; glint.setAttribute("aria-hidden", "true"); ring.append(glint);
    glint.animate([{ transform: "translateX(-160%) skewX(-20deg)", opacity: 0 }, { opacity: .9, offset: .3 }, { transform: "translateX(450%) skewX(-20deg)", opacity: 0 }], { duration: 500 }).finished.then(() => glint.remove());
  };
  sprite.animate(frames, { duration: 820, easing: "cubic-bezier(.3,0,.2,1)", fill: "forwards" }).finished.then(arrive);
}

function resetKeys() {
  found = new Set(); store.set("tt-keys", []);
  toast("Keys reset. All 5 are hidden again.");
  setTimeout(() => location.reload(), 900); // reload so this page's key goes back in its hiding spot
}

// page-specific reveal triggers
const keyFor = id => $(`.key[data-key="${id}"]`);
$(".flip")?.addEventListener("flipped", () => keyFor("about")?.removeAttribute("hidden"));
// both "Play demo" and the hero's "Watch demo" start the demo, so both reveal the key
$$("#demo-btn, a[href=\"#demo\"]").forEach(b => b.addEventListener("click", () => setTimeout(() => keyFor("gp")?.removeAttribute("hidden"), 1500)));
const lastItem = $$(".resume-item").at(-1);
lastItem?.addEventListener("revealed", () => keyFor("resume")?.removeAttribute("hidden"));
if (reduce && lastItem) keyFor("resume")?.removeAttribute("hidden");

/* ---------- Projects: write a letter, seal it, a key falls out ---------- */
const letterForm = $("#letter-form");
if (letterForm) {
  const body = $("#letter-body"), send = $("button[type=submit]", letterForm), count = $(".count", letterForm);
  const env = $(".envelope"), msg = $(".env-msg", env), MIN = 15;
  const otherWrap = $(".other-name", letterForm), otherInput = $("#letter-to");
  const recipient = () => { const v = letterForm.querySelector("input[name=to]:checked").value; return v === "other" ? otherInput.value.trim() : v; };
  const check = () => {
    const n = body.value.trim().length, named = recipient().length > 0, ok = n >= MIN && named;
    send.disabled = !ok; count.classList.toggle("ok", ok);
    count.textContent = !named ? "Who is it for? Type a name" : ok ? "Ready to seal" : `Write at least ${MIN} characters (${n}/${MIN})`;
  };
  $$("input[name=to]", letterForm).forEach(r => r.addEventListener("change", () => {
    const other = r.value === "other" && r.checked;
    otherWrap.hidden = !other; if (other) otherInput.focus();
    check();
  }));
  body.addEventListener("input", check); otherInput.addEventListener("input", check); check();
  letterForm.addEventListener("submit", e => {
    e.preventDefault(); if (send.disabled) return;
    const who = recipient();
    letterForm.classList.add("sealing");
    setTimeout(() => {
      letterForm.hidden = true; letterForm.classList.remove("sealing");
      env.hidden = false; env.classList.remove("closing"); void env.offsetWidth; env.classList.add("closing");
      msg.textContent = `Sealed and addressed to ${who}.`;
      setTimeout(() => {
        const k = keyFor("projects");
        if (k) { k.removeAttribute("hidden"); msg.textContent = "A key fell out of the envelope. Click the key to take it."; k.focus({ preventScroll: true }); }
        else msg.textContent = `Sealed and addressed to ${who}. You already have this room’s key.`;
      }, reduce ? 0 : 1400);
    }, reduce ? 0 : 900);
  });
  $("[data-act=again]", env).addEventListener("click", () => {
    env.hidden = true; letterForm.hidden = false; body.value = ""; otherInput.value = ""; check(); body.focus();
  });
}

/* ---------- Résumé: section menu follows your reading, print button ---------- */
const navLinks = $$(".resume-nav a");
if (navLinks.length) {
  const secs = navLinks.map(a => $(a.getAttribute("href"))).filter(Boolean);
  let raf = 0;
  const spy = () => {
    raf = 0; let cur = secs[0];
    secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .35) cur = s; }); // last section whose top passed 35% of the screen
    navLinks.forEach(a => a.getAttribute("href") === "#" + cur.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(spy); }, { passive: true }); spy();
}
$("[data-print]")?.addEventListener("click", () => window.print());

/* ---------- Dialog helper ---------- */
function makeDialog(cls, html, label) {
  const d = document.createElement("dialog"); d.className = cls; d.innerHTML = html; d.setAttribute("aria-label", label);
  d.addEventListener("click", e => { if (e.target === d) d.close(); }); // click backdrop to close
  document.body.append(d); return d;
}

/* ---------- Key ring opens the terminal ---------- */
ring.addEventListener("click", () => openTerminal("keys"));
function hintText(id = page) {
  const r = ROOMS.find(r => r.id === id);
  if (!r) return "Explore the pages. Each one hides a key.";
  if (found.has(r.id)) { const next = ROOMS.find(x => !found.has(x.id)); return next ? `${r.name} is done. Next, try ${next.name}.` : "You found every key. Type unlock!"; }
  return r.hint;
}

/* ---------- The reward: chibi me hands you a big cookie ---------- */
const BITES = [[170, 58], [26, 128], [138, 178], [52, 36], [100, 100]];
function giveCookie() {
  const d = makeDialog("cookie-scene", `
    <div class="cookie-stage">
      <button class="cookie" type="button" aria-label="Take a bite of the cookie">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <defs><mask id="bite-mask"><rect width="200" height="200" fill="#fff"/></mask></defs>
          <g mask="url(#bite-mask)">
            <circle cx="100" cy="100" r="92" fill="#B47035"/><circle cx="100" cy="100" r="84" fill="#D3924E"/>
            <circle cx="72" cy="80" r="30" fill="#DDA160" opacity=".5"/>
            <g fill="#4A2A16"><ellipse cx="70" cy="62" rx="9" ry="7"/><ellipse cx="126" cy="54" rx="8" ry="6"/><ellipse cx="140" cy="104" rx="10" ry="8"/>
              <ellipse cx="96" cy="112" rx="8" ry="7"/><ellipse cx="58" cy="120" rx="9" ry="7"/><ellipse cx="110" cy="150" rx="9" ry="7"/><ellipse cx="150" cy="146" rx="7" ry="6"/><ellipse cx="44" cy="88" rx="6" ry="5"/></g>
          </g>
        </svg>
      </button>
      <div class="big-chibi" aria-hidden="true">${CHIBI}</div>
    </div>
    <h2>You <em>escaped!</em></h2>
    <p class="cookie-msg" role="status">Mini me baked you a big cookie for finding all five keys. Click it to take a bite.</p>
    <div class="actions" style="justify-content:center"><a class="btn" href="mailto:${EMAIL}">Email Thong</a><button class="btn ghost" type="button" data-act="close">Close</button></div>`, "You escaped: a cookie from mini Thong");
  d.addEventListener("close", () => d.remove());
  $("[data-act=close]", d).onclick = () => d.close();
  const cookie = $(".cookie", d), mask = $("#bite-mask", d), msg = $(".cookie-msg", d);
  let bites = 0;
  cookie.addEventListener("click", e => {
    if (bites >= BITES.length) return;
    const [x, y] = BITES[bites++];
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", bites === BITES.length ? 120 : 30); c.setAttribute("fill", "#000");
    mask.append(c);
    crumbs(cookie);
    cookie.classList.remove("chomp"); void cookie.offsetWidth; cookie.classList.add("chomp");
    msg.textContent = bites < BITES.length ? ["Nom.", "Nom nom.", "Still good?", "One more bite…"][bites - 1] : "All gone. Thanks for exploring every room! Want to talk? Email me.";
    if (bites === BITES.length) { cookie.disabled = true; cookie.setAttribute("aria-label", "Cookie finished"); }
  });
  d.showModal(); confetti(); chibiCheer();
}
function crumbs(el) {
  if (!motionOK() || document.hidden) return;
  for (let i = 0; i < 10; i++) {
    const s = document.createElement("i"); s.className = "crumb";
    s.style.setProperty("--dx", (Math.random() - .5) * 160 + "px"); s.style.setProperty("--dy", 60 + Math.random() * 120 + "px");
    s.style.left = 30 + Math.random() * 40 + "%"; s.style.top = 30 + Math.random() * 40 + "%";
    el.append(s); setTimeout(() => s.remove(), 900);
  }
}
/* ---------- Motion: reward ---------- */
function confetti() {
  if (!motionOK() || document.hidden) return;
  // DOM sparks keep the reward within the one-canvas budget, including Home.
  const layer = document.createElement("div"); layer.className = "confetti"; layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < (finePointer ? 48 : 20); i++) {
    const spark = document.createElement("i");
    spark.style.setProperty("--dx", `${(Math.random() - .5) * innerWidth}px`);
    spark.style.setProperty("--dy", `${80 + Math.random() * innerHeight / 2}px`);
    spark.style.background = ["#E8B651", "#F4D58D", "#6FA8FF", "#ECE8DF"][i % 4]; layer.append(spark);
  }
  document.body.append(layer); setTimeout(() => layer.remove(), 1800);
}

/* ---------- Terminal ---------- */
const term = makeDialog("terminal", `<div class="term-bar"><i></i><i></i><i></i>thong@danang: ~<button class="term-x" type="button" aria-label="Close terminal">esc</button></div><div class="term-out" aria-live="polite"></div>
  <div class="term-chips" aria-label="Quick commands"></div>
  <form class="term-in"><span aria-hidden="true">$</span><label class="sr-only" for="term-input">Terminal command</label><input id="term-input" autocomplete="off" spellcheck="false" autocapitalize="off" placeholder="type a command, or tap one above"><kbd>Tab</kbd></form>`, "Terminal");
const tout = $(".term-out", term), tin = $("#term-input", term);
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const print = (html, cls = "") => { const d = document.createElement("div"); if (cls) d.className = cls; d.innerHTML = html; tout.append(d); tout.scrollTop = tout.scrollHeight; };
// a gold command you can click: runs it, or (fill) puts it in the input so you can finish typing
const c = (cmd, label = cmd, fill) => `<button type="button" class="p cmd" data-${fill ? "fill" : "cmd"}="${cmd}">${esc(label)}</button>`;
const ROOM_ARG = { home: "home", about: "about", projects: "projects", resume: "resume", gp: "golden peace" };
let resetArmed = false;
const CMDS = {
  help: () => print(`<b>escape room</b>   ${c("keys")}  ${c("hint")}  ${c("hint ", "hint <room>", 1)}  ${c("unlock")}  ${c("reset")}
<b>about me</b>      ${c("whoami")}  ${c("about")}  ${c("skills")}  ${c("projects")}  ${c("contact")}
<b>go somewhere</b>  ${c("open ", "open <page>", 1)}  ${c("ls")}
<b>terminal</b>      ${c("clear")}  ${c("exit")}
<span class="dim">${tapOnly ? "tip: tap any gold word." : "tip: click any gold word. Tab or → completes, ↑ ↓ brings back what you typed."}</span>`),
  whoami: () => print("Thong Thai. CS student at the University of Georgia, from Đà Nẵng, Vietnam. I build apps for the people around me."),
  about: () => print("Grew up in a three-generation home in Đà Nẵng. My grandmother wanted peace in the family; my father wanted to watch his children grow up. I build so I can be there for others."),
  projects: () => print(`golden-peace   wellness app for older adults in Vietnam (React Native, Expo, Supabase)\nremember-me    diary app for people living with Alzheimer’s (Flutter, Firebase)\n<span class="dim">try:</span> ${c("open golden-peace")}  ${c("open remember-me")}`),
  skills: () => print("languages   Python, C++, JavaScript, TypeScript, HTML, CSS\nframeworks  React Native (Expo), Flutter (FlutterFlow)\ndata+tools  MySQL, Supabase, Firebase, YOLOv5-tiny, Figma"),
  contact: () => print(`email   <a href="mailto:${EMAIL}">${EMAIL}</a>\ngithub  <a href="${GITHUB}">${GITHUB.replace("https://", "")}</a>`),
  ls: () => print(`${c("cat about.txt", "about.txt")}  ${c("open golden-peace", "golden-peace/")}  ${c("open remember-me", "remember-me/")}  ${c("open resume", "resume.pdf")}  ${c("cat vault.lock", "vault.lock")}`),
  "cat about.txt": () => CMDS.about(),
  "cat vault.lock": () => print(found.size === 5 ? `unlocked. type ${c("unlock")}` : `locked. keys: ${found.size}/5`, found.size === 5 ? "ok" : "dim"),
  keys: () => print(`<b>escape room</b>  ${found.size}/5 keys  <span class="bar" aria-hidden="true">${"■".repeat(found.size)}<span class="dim">${"□".repeat(5 - found.size)}</span></span>\n` +
    ROOMS.map(r => found.has(r.id) ? `<span class="ok">[x] ${r.name}</span>` : `[ ] ${r.name.padEnd(13)}${c("hint " + ROOM_ARG[r.id], "get a hint")}${r.id !== page ? "  " + c("open " + (r.id === "gp" ? "golden-peace" : r.id), "go there") : ' <span class="dim">(you are here)</span>'}`).join("\n") +
    `\n${found.size === 5 ? `<span class="ok">all keys found!</span> type ${c("unlock")}` : `<span class="dim">tip: click a room's hint, or type</span> ${c("hint")} <span class="dim">for this page</span>`}`),
  hint: () => print(hintText(), "p"),
  unlock: () => found.size === 5
    ? (print("ACCESS GRANTED. Mini me is on his way…", "ok"), setTimeout(() => { term.close(); giveCookie(); }, 700))
    : print(`ACCESS DENIED: ${found.size}/5 keys. Type ${c("keys")} to see which rooms are left.`, "dim"),
  "sudo hire thong": () => print(`[sudo] password for recruiter: ********\nPermission granted. Opening email...`, "ok") || setTimeout(() => location.href = `mailto:${EMAIL}`, 900),
  reset: () => {
    if (!found.size) return print("No keys to reset yet.", "dim");
    if (!resetArmed) { resetArmed = true; return print(`This puts all 5 keys back in hiding. Type ${c("reset")} again to confirm.`, "danger"); }
    print("Resetting keys...", "danger"); setTimeout(() => { term.close(); resetKeys(); }, 500);
  },
  clear: () => { tout.innerHTML = ""; },
  exit: () => term.close(),
};
const ALIAS = { "?": "help", h: "help", k: "keys", key: "keys", clue: "hint", quit: "exit", close: "exit", q: "exit", cls: "clear", me: "whoami", email: "contact", work: "projects" };
const PAGES = { home: "index.html", about: "about.html", projects: "projects.html", resume: "resume.html", "golden-peace": "golden-peace.html", "golden peace": "golden-peace.html", gp: "golden-peace.html", "remember-me": "https://github.com/NotWutLit/remember-me-app" };
const ROOM_FOR = { "golden peace": "gp", "golden-peace": "gp", gp: "gp", "résumé": "resume", resume: "resume", home: "home", about: "about", projects: "projects" };
// everything Tab can complete to
const COMPLETE = [...Object.keys(CMDS), ...Object.values(ROOM_ARG).map(r => "hint " + r), ...["home", "about", "projects", "resume", "golden-peace", "remember-me"].map(p => "open " + p)];
function edits(a, b) { // Levenshtein distance, for "did you mean"
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] !== b[j - 1]));
  return d[a.length][b.length];
}
const hist = []; let hpos = 0;
function run(raw) {
  raw = raw.trim(); if (!raw) return;
  hist.push(raw); hpos = hist.length;
  print(`<span class="p">$</span> ${esc(raw)}`);
  let cmd = raw.toLowerCase().replace(/\s+/g, " ").replace(/^\$ ?/, "");
  cmd = ALIAS[cmd] || cmd;
  if (cmd !== "reset") resetArmed = false; // confirmation only counts if typed twice in a row
  if (cmd === "open" || cmd === "cd") return print(`open where? ${["home", "about", "projects", "resume", "golden-peace"].map(p => c("open " + p, p)).join("  ")}`, "dim");
  if (cmd === "hint " || cmd === "hint") return CMDS.hint();
  const h = cmd.match(/^hint (.+)$/);
  if (h) { const id = ROOM_FOR[h[1]];
    return id ? print(hintText(id), "p") : print(`no room called "${esc(h[1])}". rooms: ${Object.values(ROOM_ARG).map(r => c("hint " + r, r)).join("  ")}`, "dim"); }
  if (CMDS[cmd]) return CMDS[cmd]();
  const m = cmd.match(/^(?:open|cd|go) (.+)$/), dest = m ? m[1] : PAGES[cmd] && cmd; // "about" is a command; "resume" alone just opens it
  if (dest && PAGES[dest]) { print(`opening ${esc(dest)}...`, "dim"); return setTimeout(() => location.href = PAGES[dest], 500); }
  if (cmd.startsWith("sudo")) return print("nice try.", "dim");
  const near = COMPLETE.map(x => [x, edits(cmd, x)]).sort((p, q) => p[1] - q[1])[0];
  print(`command not found: ${esc(raw)}. ${near[1] <= 2 ? `Did you mean ${c(near[0])}? ` : ""}Type ${c("help")} to see everything.`, "dim");
}
$(".term-in", term).addEventListener("submit", e => { e.preventDefault(); const v = tin.value; tin.value = ""; run(v); });
tin.addEventListener("keydown", e => {
  if ((e.key === "Tab" && !e.shiftKey) || (e.key === "ArrowRight" && tin.selectionStart === tin.value.length && tin.selectionEnd === tin.value.length)) {
    const v = tin.value.toLowerCase();
    if (!v.trim()) return;
    const opts = COMPLETE.filter(x => x.startsWith(v));
    if (!opts.length || (opts.length === 1 && opts[0] === v)) return;
    e.preventDefault();
    if (opts.length === 1) tin.value = opts[0];
    else if (opts.length > 1) { let pre = opts[0]; opts.forEach(o => { while (!o.startsWith(pre)) pre = pre.slice(0, -1); }); tin.value = pre; if (v) print(opts.map(o => c(o)).join("  "), "dim"); }
  } else if (e.key === "ArrowUp" && hist.length) { e.preventDefault(); hpos = Math.max(0, hpos - 1); tin.value = hist[hpos]; }
  else if (e.key === "ArrowDown" && hist.length) { e.preventDefault(); hpos = Math.min(hist.length, hpos + 1); tin.value = hist[hpos] || ""; }
});
// touch devices get a buttons-only terminal: no keyboard popping up, every command is a tap
const tapOnly = matchMedia("(pointer: coarse)").matches;
if (tapOnly) term.classList.add("tap-only");
term.addEventListener("click", e => {
  const b = e.target.closest("[data-cmd], [data-fill]");
  if (b && tapOnly && b.dataset.fill) { // no typing on phones: offer the choices as buttons instead
    return b.dataset.fill.startsWith("hint") ? print(`hint for which room? ${Object.values(ROOM_ARG).map(r => c("hint " + r, r)).join("  ")}`, "dim") : run("open");
  }
  if (b) { if (b.dataset.cmd) run(b.dataset.cmd); else tin.value = b.dataset.fill; if (!tapOnly) tin.focus(); }
  else if (e.target.closest(".term-x")) term.close();
  else if (!tapOnly && e.target.closest(".term-out") && !e.target.closest("a") && !getSelection().toString()) tin.focus(); // click the output to type
});
function renderChips() {
  const ks = found.size === 5 ? "unlock" : "keys";
  $(".term-chips", term).innerHTML = (tapOnly ? [ks, "hint", "help", "whoami", "about", "skills", "projects", "contact", "open", "reset", "clear", "exit"] : [ks, "hint", "help", "whoami", "projects", "contact", "clear"]).map(x => c(x)).join("");
}
function openTerminal(first) {
  renderChips();
  if (!tout.childElementCount) print(tapOnly ? `Welcome to thong@danang. Tap a command below.` : `Welcome to thong@danang. New here? Tap a command below, or type ${c("help")}.`, "dim");
  term.showModal(); if (!tapOnly) tin.focus();
  if (first) run(first);
}

/* ---------- Command palette (Ctrl/⌘ K) ---------- */
const pal = makeDialog("palette", `<label class="sr-only" for="pal-input">Search pages and actions</label><input id="pal-input" placeholder="Where to? Type a page or an action…" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="pal-list"><ul id="pal-list" role="listbox"></ul><div class="foot"><span>↑↓ move</span><span>↵ open</span><span>esc close</span></div>`, "Command palette");
const pin = $("#pal-input", pal), plist = $("#pal-list", pal);
const ITEMS = [
  ...ROOMS.map(r => ({ label: r.name, hint: "page", run: () => location.href = r.url })),
  ...$$("main h2[id], main section[id]").map(el => ({ label: (el.matches("h2") ? el : el.querySelector("h2") || el).textContent.trim().slice(0, 60), hint: "on this page", run: () => el.scrollIntoView() })),
  { label: "Download résumé (PDF)", hint: "file", run: () => location.href = "assets/resume.pdf" },
  { label: "Email Thong", hint: "action", run: () => location.href = `mailto:${EMAIL}` },
  { label: "Copy email address", hint: "action", run: () => navigator.clipboard?.writeText(EMAIL).then(() => toast("Email copied")) },
  { label: "GitHub", hint: "link", run: () => location.href = GITHUB },
  { label: "Open terminal", hint: "` key", run: () => openTerminal() },
  { label: "Escape room: keys and hints", hint: "game", run: () => openTerminal("keys") },
];
let sel = 0, shown = ITEMS;
function renderPal() {
  const q = pin.value.toLowerCase().trim();
  shown = ITEMS.filter(i => !q || q.split(" ").every(w => i.label.toLowerCase().includes(w)));
  sel = Math.min(sel, Math.max(shown.length - 1, 0));
  plist.innerHTML = shown.map((i, n) => `<li role="option" id="opt-${n}" aria-selected="${n === sel}"><span>${i.label}</span><small>${i.hint}</small></li>`).join("") || `<li aria-disabled="true"><span>No matches</span></li>`;
  pin.setAttribute("aria-activedescendant", shown.length ? `opt-${sel}` : "");
  $$("li[role=option]", plist).forEach((li, n) => li.onclick = () => runItem(n));
}
function runItem(n) { const it = shown[n]; if (!it) return; pal.close(); it.run(); }
pin.addEventListener("input", () => { sel = 0; renderPal(); });
pin.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") { sel = Math.min(sel + 1, shown.length - 1); renderPal(); e.preventDefault(); }
  if (e.key === "ArrowUp") { sel = Math.max(sel - 1, 0); renderPal(); e.preventDefault(); }
  if (e.key === "Enter") { runItem(sel); e.preventDefault(); }
});
function openPalette() { pin.value = ""; sel = 0; renderPal(); pal.showModal(); pin.focus(); }
$(".cmdk", tools)?.addEventListener("click", openPalette);
$$("[data-open=palette]").forEach(b => b.addEventListener("click", openPalette));
addEventListener("keydown", e => {
  const typing = /input|textarea/i.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.open ? pal.close() : openPalette(); }
  else if (e.key === "`" && !typing) { e.preventDefault(); openTerminal(); }
});

/* ---------- Lightbox for the gallery ---------- */
const shots = $$(".enlarge");
if (shots.length) {
  const lb = makeDialog("lightbox", `<img alt=""><p></p><div class="lb-nav"><button class="btn ghost" data-d="-1">← Previous</button><button class="btn ghost" data-d="close">Close</button><button class="btn ghost" data-d="1">Next →</button></div>`, "Screenshot viewer");
  let cur = 0;
  const show = n => {
    cur = (n + shots.length) % shots.length; const a = shots[cur], im = a.querySelector("img");
    $("img", lb).src = a.href; $("img", lb).alt = im.alt; $("p", lb).textContent = a.closest("figure")?.querySelector("figcaption")?.textContent || "";
  };
  shots.forEach((a, n) => a.addEventListener("click", e => { e.preventDefault(); show(n); lb.showModal(); }));
  $$("[data-d]", lb).forEach(b => b.onclick = () => b.dataset.d === "close" ? lb.close() : show(cur + +b.dataset.d));
  lb.addEventListener("keydown", e => { if (e.key === "ArrowRight") show(cur + 1); if (e.key === "ArrowLeft") show(cur - 1); });
}

/* =========================================================
   Chibi Thong: runs to a spot, stops, and does whatever the
   section on screen is about (data-chibi="wave|laptop|camera|racket").
   Click him for a hint about this page's key.
   ========================================================= */
const CHIBI = `<svg viewBox="0 0 64 84" aria-hidden="true"><g class="bodyg">
  <g class="leg-l"><rect x="23" y="58" width="8" height="17" rx="3.5" fill="#1C1D26"/><rect x="20" y="72" width="13" height="7" rx="3.5" fill="#F2F0EA"/></g>
  <g class="leg-r"><rect x="33" y="58" width="8" height="17" rx="3.5" fill="#1C1D26"/><rect x="31" y="72" width="13" height="7" rx="3.5" fill="#F2F0EA"/></g>
  <g class="arm-l"><rect x="13" y="43" width="7" height="15" rx="3.5" fill="#F4F1EA"/><circle cx="16.5" cy="58.5" r="3.4" fill="#F1CBA8"/></g>
  <g class="arm-r"><rect x="44" y="43" width="7" height="15" rx="3.5" fill="#F4F1EA"/><circle cx="47.5" cy="58.5" r="3.4" fill="#F1CBA8"/>
    <g class="p-racket"><line x1="47.5" y1="60" x2="49" y2="72" stroke="#ECE8DF" stroke-width="1.6"/><ellipse cx="49.5" cy="78" rx="4.5" ry="6" fill="rgba(232,182,81,.2)" stroke="#E8B651" stroke-width="1.6"/></g></g>
  <rect x="19" y="40" width="26" height="22" rx="8" fill="#F4F1EA"/>
  <path d="M19 48q0-8 8-8h2l3 9 3-9h2q8 0 8 8v10q0 4-4 4H23q-4 0-4-4z" fill="#28314F"/>
  <circle cx="32" cy="23" r="17" fill="#F3CFAE"/>
  <path d="M14.5 25q-1-19 17.5-19 18.5 0 17.5 19-2-7-7-9-4 5-11 4.5-6 .5-9.5 4-3 0-7.5.5z" fill="#141319"/>
  <circle cx="25.5" cy="26" r="4.6" fill="rgba(255,255,255,.25)" stroke="#141319" stroke-width="1.6"/><circle cx="38.5" cy="26" r="4.6" fill="rgba(255,255,255,.25)" stroke="#141319" stroke-width="1.6"/>
  <path d="M30 26h4" stroke="#141319" stroke-width="1.5"/>
  <circle cx="25.5" cy="26.5" r="1.7" fill="#141319"/><circle cx="38.5" cy="26.5" r="1.7" fill="#141319"/>
  <ellipse cx="21" cy="32" rx="2.6" ry="1.5" fill="#EFA59A" opacity=".55"/><ellipse cx="43" cy="32" rx="2.6" ry="1.5" fill="#EFA59A" opacity=".55"/>
  <path d="M29 33q3 2.6 6 0" fill="none" stroke="#141319" stroke-width="1.5" stroke-linecap="round"/>
  <g class="p-camera"><rect x="20" y="19" width="24" height="15" rx="3" fill="#1C1D26"/><rect x="23" y="16" width="7" height="4" rx="1" fill="#1C1D26"/><circle cx="32" cy="26.5" r="5" fill="#3A4466" stroke="#E8B651" stroke-width="1.4"/><path class="flash" d="M40 10l2-5 2 5 5 2-5 2-2 5-2-5-5-2z" fill="#fff"/></g>
  <g class="p-book"><path d="M14 52l18 3v14l-18-3z" fill="#F7F3EA" stroke="#8A6D2B" stroke-width="1"/><path d="M50 52l-18 3v14l18-3z" fill="#F7F3EA" stroke="#8A6D2B" stroke-width="1"/><path class="page" d="M32 55l14-2.3v12.5L32 67.5z" fill="#ECE4D2"/><path d="M18 57l10 1.6M18 60.5l10 1.6M36 58.6l10-1.6M36 62l10-1.6" stroke="#A4AABD" stroke-width=".8"/></g>
  <g class="p-laptop"><rect x="14" y="49" width="36" height="20" rx="2.5" fill="#2A3354" stroke="#3A4466" stroke-width="1"/><circle class="scr" cx="32" cy="59" r="2.6" fill="#E8B651"/><path d="M11 68h42l3 5H8z" fill="#9AA3BF"/></g>
</g></svg>`;
const chibi = document.createElement("button");
chibi.className = "chibi"; chibi.type = "button"; chibi.innerHTML = CHIBI; chibi.setAttribute("aria-label", "Mini Thong: get a hint for this room");
const bubble = document.createElement("div"); bubble.className = "bubble"; bubble.hidden = true; bubble.setAttribute("role", "status");
document.body.append(chibi, bubble);

let cx = -90, running = false, paused = false, act = document.body.dataset.chibi || "wave", bubbleT;
const phoneChibi = matchMedia("(max-width: 640px)");
let entering = motionOK() && finePointer && !phoneChibi.matches;
const setX = x => { cx = x; chibi.style.setProperty("--cx", x + "px"); };
const ACTS = ["wave", "laptop", "camera", "racket", "read"];
function showAct() { ACTS.forEach(a => chibi.classList.toggle("act-" + a, !entering && !running && a === act)); }

// which section is on screen decides what he does
const watched = $$("[data-chibi]"), ratios = new Map();
if (watched.length) {
  const so = new IntersectionObserver(es => {
    es.forEach(e => ratios.set(e.target, e.intersectionRatio));
    let best = null, r = 0; ratios.forEach((v, el) => { if (v > r) { r = v; best = el; } });
    if (best && best.dataset.chibi !== act) { act = best.dataset.chibi; showAct(); }
  }, { threshold: [0, .15, .3, .5, .75] });
  watched.forEach(el => so.observe(el));
}

function goTo(target) {
  if (!motionOK() || document.hidden || running || entering || phoneChibi.matches || !finePointer) return;
  running = true; showAct();
  const dir = Math.sign(target - cx) || 1;
  chibi.classList.add("running"); chibi.classList.toggle("flip", dir < 0);
  let last = performance.now();
  const frame = now => {
    if (!motionOK() || document.hidden) { running = false; chibi.classList.remove("running", "flip"); showAct(); return; }
    const dt = Math.min(now - last, 50); last = now;
    if (!paused) setX(cx + dir * dt * .17);
    if ((dir > 0 && cx >= target) || (dir < 0 && cx <= target)) {
      setX(target); running = false; chibi.classList.remove("running", "flip"); showAct(); return;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
const randomSpot = () => 16 + Math.random() * Math.max(innerWidth - 112, 40);
function say(text) {
  bubble.textContent = text; bubble.hidden = false;
  bubble.style.left = Math.min(Math.max(cx + 32, 140), innerWidth - 140) + "px";
  clearTimeout(bubbleT); bubbleT = setTimeout(() => { bubble.hidden = true; paused = false; chibi.classList.toggle("running", running); }, 5000);
}
chibi.addEventListener("click", () => { if (entering) return; paused = true; chibi.classList.remove("running"); say(hintText()); });
function chibiCheer() {
  if (!motionOK() || document.hidden || entering) return;
  chibi.classList.add("cheer"); setTimeout(() => chibi.classList.remove("cheer"), 1400);
}
if (!entering) { setX(reduce ? 12 : Math.min(innerWidth * .18, 220)); showAct(); }
else {
  chibi.disabled = true; chibi.style.opacity = "0";
  let transition = Promise.resolve();
  addEventListener("pagereveal", e => { if (e.viewTransition) transition = e.viewTransition.finished.catch(() => {}); });
  const start = () => setTimeout(() => transition.then(chibiEntrance), 500);
  if (document.readyState === "complete") start(); else addEventListener("load", start, { once: true });
}
if (!reduce) {
  setInterval(() => { if (!paused && !document.hidden) goTo(randomSpot()); }, 14000);
}

/* ---------- Chibi: six ways to arrive ---------- */
function chibiEntrance() {
  const target = innerWidth - 88;
  const land = () => { entering = false; chibi.disabled = false; chibi.style.opacity = ""; chibi.classList.remove("running", "flip"); setX(Math.min(target, innerWidth - 80)); showAct(); };
  if (phoneChibi.matches || !motionOK() || document.hidden) { land(); return; }
  // Only use clear space below visible text in the right-hand decoration margin.
  let textBottom = innerHeight - 245;
  const walker = document.createTreeWalker($("main"), NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim() || node.parentElement.closest('[aria-hidden="true"]')) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    for (const r of range.getClientRects()) if (r.right > innerWidth - 190 && r.top < innerHeight) textBottom = Math.max(textBottom, r.bottom);
  }
  const band = Math.min(245, innerHeight - textBottom - 12);
  if (band < 110) { land(); return; }
  const names = ["helicopter", "tsunami", "parachute", "rocket", "portal", "run"];
  let previous; try { previous = sessionStorage.getItem("chibi-entrance"); } catch {}
  const choices = names.filter(n => n !== previous), forced = new URLSearchParams(location.search).get("entrance");
  const name = names.includes(forced) ? forced : choices[Math.floor(Math.random() * choices.length)];
  try { sessionStorage.setItem("chibi-entrance", name); } catch {}
  const layer = document.createElement("div"); layer.className = `chibi-entrance entrance-${name}`; layer.setAttribute("aria-hidden", "true");
  // Flights stay in the bottom decoration band, below the hero reading area.
  layer.classList.add("entrance-bottom");
  layer.style.height = `${band}px`; layer.style.clipPath = "inset(0 0 0 calc(100% - 190px))";
  document.body.append(layer); layer.append(chibi); setX(target);
  const duration = name === "run" ? 1700 : 2400, animations = [];
  const animate = (el, frames) => { const a = el.animate(frames, { duration, fill: "both", easing: "linear" }); animations.push(a); return a; };
  const route = points => points.map(([offset, x, y, r = 0, s = 1]) => ({ offset, transform: `translate(${x}px,${y}px) rotate(${r}deg) scale(${s})` }));
  const move = points => route(points.map(([t, x, y, r, s]) => [t, target + x, y, r, s]));
  const prop = (kind, x, bottom, w, h, svg) => {
    const el = document.createElement("div"); el.className = `entrance-prop ${kind}`; el.setAttribute("aria-hidden", "true");
    Object.assign(el.style, { left: `${x}px`, bottom: `${bottom}px`, width: `${w}px`, height: `${h}px` });
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`; layer.append(el); return el;
  };
  let points;
  if (name === "helicopter") {
    const drop = 65, heli = prop("helicopter", target - 43, 145, 150, 82,
      '<path d="M73 8v17M19 8h112M42 67h63M50 57l-5 10m49-10 5 10" stroke="#F4D58D" stroke-width="4" stroke-linecap="round"/><path d="M27 39L5 25v28l28-5" fill="#1A2550" stroke="#E8B651" stroke-width="2"/><rect x="32" y="26" width="86" height="33" rx="16" fill="#111A38" stroke="#E8B651" stroke-width="2"/><path d="M80 29h19q14 2 15 16H80z" fill="#6FA8FF"/><circle cx="55" cy="42" r="6" fill="#F4D58D"/><path class="rotor" d="M12 8h126" stroke="#F3EAD6" stroke-width="3"/>');
    animate(heli, route([[0, 180, 0, -12], [.22, 0, 0], [.68, 0, -5], [.8, 12, -12], [1, 200, -10, 15]]));
    const rope = prop("rope", target + 31, 90, 2, drop, `<path d="M1 0v${drop}" stroke="#F4D58D" stroke-width="2" stroke-dasharray="4 3"/>`);
    animate(rope, [{ transform: "scaleY(0)", opacity: 0 }, { transform: "scaleY(0)", opacity: 1, offset: .22 }, { transform: "scaleY(1)", opacity: 1, offset: .72 }, { transform: "scaleY(0)", opacity: 0, offset: .88 }, { opacity: 0 }]);
    points = [[0, 150, -drop], [.22, 0, -drop], [.42, 7, -drop * .65, 8], [.72, 0, 0], [.79, 0, 0, 0, .88], [.86, 0, -10], [1, 0, 0]];
  } else if (name === "tsunami") {
    const wave = prop("wave", target - 130, 0, 300, 126,
      '<path d="M0 126V92q45-3 77-48C126-19 230 4 216 61q-9 29-43 15 31-5 19-26-17-25-41 12 28 44 149 45v19z" fill="#1A2550" stroke="#6FA8FF" stroke-width="3"/><path d="M5 94q47-4 82-48C126-5 222 7 211 55q-5 25-32 19 31-10 10-28-23-16-46 21" stroke="#F3EAD6" stroke-width="7" stroke-linecap="round"/><path d="M27 111q46-23 83-18t69 17 92 2" stroke="#6FA8FF" stroke-width="3"/>');
    animate(wave, route([[0, -target - 300, 16], [.4, -45, 0], [.65, 45, 8], [1, innerWidth - target + 300, 36]]));
    points = [[0, -target - 100, 30, -80], [.32, -65, -52, -35], [.48, -12, -68, 20], [.64, 10, -24, -12], [.76, 0, 0, 0, .85], [.86, 0, -9], [1, 0, 0]];
    for (let i = 0; i < 3; i++) {
      const drop = prop("droplet", target + i * 34 - 24, 60, 12, 20, '<path d="M6 1Q-5 14 6 19 17 14 6 1" fill="#6FA8FF"/>');
      animate(drop, [{ transform: "translate(-90px,0) scale(0)", opacity: 0 }, { transform: `translate(0,${-60 - i * 16}px) scale(1)`, opacity: 1, offset: .5 }, { transform: `translate(${60 + i * 16}px,30px) scale(.3)`, opacity: 0, offset: .85 }, { opacity: 0 }]);
    }
  } else if (name === "parachute") {
    points = [[0, 110, -90, -12], [.25, 12, -65, 12], [.48, 8, -35, -10], [.7, 0, -15, 6], [.8, 0, 0, 0, .88], [.88, 0, -8], [1, 0, 0]];
    const canopy = prop("parachute", target - 38, 80, 140, 140,
      '<path d="M3 55C9-16 131-16 137 55q-18-14-34 0-17-14-33 0-17-14-34 0-17-14-33 0" fill="#E8B651" stroke="#F4D58D" stroke-width="2"/><path d="M70 3Q40 18 36 55m34-52q30 15 33 52M3 55l67 82 67-82m-101 0 34 82 33-82" stroke="#F3EAD6" stroke-width="1.5"/>');
    animate(canopy, route([...points.slice(0, 5), [.9, 0, -25, 15, .3], [1, 18, -20, 25, 0]]).map((f, i) => ({ ...f, opacity: i < 5 ? 1 : i === 5 ? .5 : 0 })));
  } else if (name === "rocket") {
    points = [[0, 0, 170, -8], [.18, 0, 140, -8], [.42, -12, -145, 12], [.57, 10, -180, -8], [.75, 0, 0, 0, .85], [.84, 0, -22], [.92, 0, 0, 0, .95], [1, 0, 0]];
    const pack = prop("jetpack", target + 10, 0, 44, 76,
      '<rect x="2" y="5" width="13" height="37" rx="6" fill="#1A2550" stroke="#E8B651" stroke-width="2"/><rect x="29" y="5" width="13" height="37" rx="6" fill="#1A2550" stroke="#E8B651" stroke-width="2"/><g class="jet-flame"><path d="M3 43q-1 19 6 32 9-19 5-32M30 43q-1 19 6 32 9-19 5-32" fill="#E8B651"/><path d="M6 43l3 21 3-21m21 0 3 21 3-21" stroke="#F3EAD6" stroke-width="3"/></g>');
    animate(pack, route(points).map((f, i) => ({ ...f, opacity: i < 5 ? 1 : 0 })));
  } else if (name === "portal") {
    const portal = prop("portal", target - 25, 0, 114, 32,
      '<ellipse cx="57" cy="16" rx="50" ry="11" fill="#111A38" stroke="#E8B651" stroke-width="4"/><ellipse cx="57" cy="16" rx="41" ry="6" stroke="#F4D58D" stroke-width="2"/><path d="M3 9l5-5m98 18 5 4M24 2v5m67 18 3 5" stroke="#6FA8FF" stroke-width="2"/>');
    animate(portal, [{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1.1)", opacity: 1, offset: .2 }, { transform: "scale(1)", opacity: 1, offset: .7 }, { transform: "scale(0)", opacity: 0, offset: .94 }, { opacity: 0 }]);
    points = [[0, 0, 110, 0, .35], [.24, 0, 110, 0, .35], [.49, 0, -65, -12], [.65, 0, 0, 0, .85], [.76, 0, -16], [.86, 0, 0], [1, 0, 0]];
  } else {
    chibi.classList.add("running"); points = [[0, -target - 90, 0], [1, 0, 0]];
  }
  const arrival = animate(chibi, move(points)); chibi.style.opacity = "";
  let finished = false;
  const finish = () => {
    if (finished) return; finished = true;
    animations.forEach(a => a.cancel()); document.body.append(chibi); layer.remove(); land();
  };
  // Resizing into the phone header must cancel the desktop flight immediately.
  const resize = () => { if (phoneChibi.matches || !motionOK() || document.hidden) finish(); };
  phoneChibi.addEventListener("change", resize);
  addEventListener("motionchange", resize);
  addEventListener("scroll", finish, { once: true, passive: true }); addEventListener("resize", finish, { once: true });
  arrival.finished.then(finish, finish).finally(() => { phoneChibi.removeEventListener("change", resize); removeEventListener("motionchange", resize); removeEventListener("scroll", finish); removeEventListener("resize", finish); });
}

/* ---------- Hobby scenes play only while visible ---------- */
const scenes = $$('.hobby');
if (scenes.length && !reduce) {
  const so2 = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('playing', e.isIntersecting)), { rootMargin: '50px' });
  scenes.forEach(h => so2.observe(h));
}

/* ---------- Home: 3D city of lights (loaded only where it exists) ---------- */
if ($("#city")) {
  const go = () => import("./hero3d.js").catch(() => {});
  if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 400);
}

/* ---------- Motion: starfield ---------- */
(() => {
  if (!["about", "projects", "resume", "gp"].includes(page)) return;
  const canvas = document.createElement("canvas"); canvas.className = "starfield"; canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d"); if (!ctx) return;
  let stars = [], width = 0, height = 0, raf = 0, last = 0, time = 0, next = 8 + Math.random() * 7, shot = null, visible = true;
  const light = () => innerWidth < 600 || !finePointer;
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    stars.forEach(s => {
      const y = ((s.y - (motionOK() ? scrollY * s.depth : 0)) % height + height) % height;
      ctx.globalAlpha = s.alpha * (motionOK() ? .7 + .3 * Math.sin(time * s.speed + s.phase) : .85);
      ctx.fillStyle = s.gold ? "#F4D58D" : "#6FA8FF";
      ctx.beginPath(); ctx.arc(s.x, y, s.radius, 0, Math.PI * 2); ctx.fill();
    });
    if (shot && motionOK()) {
      const p = (time - shot.start) / .85;
      if (p > 1) shot = null;
      else {
        ctx.globalAlpha = Math.sin(p * Math.PI) * .65;
        const x = shot.x + p * 200, y = shot.y + p * 90;
        const trail = ctx.createLinearGradient(x - 65, y - 29, x, y); trail.addColorStop(0, "transparent"); trail.addColorStop(1, "#F4D58D");
        ctx.strokeStyle = trail; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 65, y - 29); ctx.lineTo(x, y); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };
  const frame = now => {
    raf = 0; if (!motionOK() || document.hidden || !visible) return;
    if (now - last >= (light() ? 65 : 32)) {
      time += Math.min((now - last) / 1000, .1); last = now;
      if (time > next) { shot = { x: Math.random() * width * .7, y: Math.random() * height * .35, start: time }; next = time + 8 + Math.random() * 7; }
      draw();
    }
    raf = requestAnimationFrame(frame);
  };
  const sync = () => {
    cancelAnimationFrame(raf); raf = 0; last = performance.now();
    if (!motionOK()) shot = null;
    draw(); if (motionOK() && !document.hidden && visible) raf = requestAnimationFrame(frame);
  };
  const resize = () => {
    width = innerWidth; height = innerHeight; const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(160, Math.round(width * height / (light() ? 18000 : 9500))) }, () => ({ x: Math.random() * width, y: Math.random() * height, radius: .4 + Math.random() * .8, alpha: .2 + Math.random() * .4, speed: .4 + Math.random(), phase: Math.random() * 6.28, depth: .008 + Math.random() * .018, gold: Math.random() > .65 }));
    sync();
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(canvas);
  addEventListener("motionchange", sync); addEventListener("resize", resize); resize();
})();

/* ---------- Motion: project cards ---------- */
(() => {
  if (page !== "projects") return;
  $$(".project-card").forEach(card => {
    const surface = $(".project-surface", card);
    aboutScene(card, light => [card.animate([
      { transform: `perspective(1000px) rotateY(${light ? -3 : -12}deg) translateY(${light ? 8 : 20}px)`, opacity: 0 },
      { transform: "perspective(1000px) rotateY(0deg) translateY(0)", opacity: 1 }
    ], { duration: light ? 420 : 850, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" })]);
    let visible = false;
    const reset = () => { surface.classList.remove("project-pointed"); surface.style.transform = ""; ["--glare-x", "--glare-y", "--shadow-x", "--shadow-y"].forEach(p => surface.style.removeProperty(p)); };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible) reset(); }).observe(card);
    surface.addEventListener("pointermove", e => {
      if (!visible || !finePointer || innerWidth < 600 || !motionOK() || document.hidden) return;
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      surface.classList.add("project-pointed");
      surface.style.setProperty("--glare-x", `${(x * 65).toFixed(2)}%`); surface.style.setProperty("--glare-y", `${(y * 45).toFixed(2)}%`);
      surface.style.setProperty("--shadow-x", `${(-x * 16).toFixed(2)}px`); surface.style.setProperty("--shadow-y", `${(8 - y * 10).toFixed(2)}px`);
    }, { passive: true });
    surface.addEventListener("pointerleave", reset); addEventListener("motionchange", reset); addEventListener("resize", reset);
  });
})();

/* ---------- Motion: project tags ---------- */
(() => {
  if (page !== "projects") return;
  $$(".showcase .tags li").forEach(tag => {
    aboutScene(tag, light => {
      // Keep the final label accessible while decorative glyph reels resolve one letter at a time.
      const final = tag.textContent, label = document.createElement("span"), copy = document.createElement("span");
      label.textContent = final; label.className = "tag-label";
      copy.className = "tag-scramble"; copy.setAttribute("aria-hidden", "true");
      tag.replaceChildren(label, copy); tag.classList.add("tag-scrambling");
      const animations = [...final].map((char, i) => {
        const cell = document.createElement("span"), reel = document.createElement("span");
        cell.className = "tag-cell"; reel.className = "tag-reel";
        const glyph = () => scrambleGlyphs[Math.floor(Math.random() * scrambleGlyphs.length)];
        [char === " " ? "\u00a0" : glyph(), char === " " ? "\u00a0" : glyph(), char === " " ? "\u00a0" : char].forEach(c => { const span = document.createElement("span"); span.textContent = c; reel.append(span); });
        cell.append(reel); copy.append(cell);
        return reel.animate([{ transform: "translateY(0)" }, { transform: "translateY(-66.6667%)" }], { duration: light ? 90 : 160, delay: i * (light ? 12 : 28), easing: "steps(2, end)", fill: "both" });
      });
      const finish = () => { tag.textContent = final; tag.classList.remove("tag-scrambling"); };
      Promise.all(animations.map(a => a.finished)).then(finish, finish);
      return animations;
    });
  });
})();

/* ---------- Motion: project terminal ---------- */
(() => {
  const code = $(".term-code"); if (!code) return;
  const source = $("pre", code);
  aboutScene(code, light => {
    // An invisible original reserves layout and supplies the complete text to assistive technology.
    const copy = source.cloneNode(true), walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT), nodes = [];
    copy.className = "term-typing"; copy.setAttribute("aria-hidden", "true"); $(".cursor", copy)?.remove();
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let index = 0;
    const animations = nodes.flatMap(node => {
      const fragment = document.createDocumentFragment();
      const chunks = light ? node.textContent.match(/\S+\s*|\s+/g) || [] : [...node.textContent];
      const result = chunks.map(text => {
        const char = document.createElement("span"); char.textContent = text; fragment.append(char);
        return char.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: index++ * (light ? 24 : 13), easing: "steps(1, end)", fill: "both" });
      });
      node.replaceWith(fragment); return result;
    });
    code.append(copy); code.classList.add("term-typing-active");
    const finish = () => { copy.remove(); code.classList.remove("term-typing-active"); };
    Promise.all(animations.map(a => a.finished)).then(finish, finish);
    return animations;
  });
})();

/* ---------- Motion: letter lab ---------- */
(() => {
  const ink = $(".letter-ink"); if (!ink) return;
  aboutScene(ink, light => [$("path", ink).animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: light ? 450 : 1100, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" })]);
})();

/* ---------- Motion: count-ups ---------- */
const countJobs = new WeakMap();
function countUp(el) {
  if (countJobs.has(el)) return;
  const final = el.textContent, match = final.match(/[\d,]+(?:\.\d+)?/);
  if (!match) return;
  const goal = Number(match[0].replaceAll(",", "")), from = Number(el.dataset.countFrom || 0), decimals = (match[0].split(".")[1] || "").length;
  const animated = document.createElement("span"), accessible = document.createElement("span");
  animated.setAttribute("aria-hidden", "true"); accessible.className = "sr-only"; accessible.textContent = final;
  el.replaceChildren(animated, accessible);
  let elapsed = 0, last = 0, raf = 0, visible = false, done = false;
  const finish = () => { done = true; cancelAnimationFrame(raf); el.textContent = final; observer.disconnect(); removeEventListener("motionchange", sync); };
  const frame = now => {
    raf = 0; if (!visible || document.hidden || done) return;
    if (!motionOK()) return finish();
    elapsed += last ? Math.min(now - last, 50) : 0; last = now;
    const p = Math.min(elapsed / (innerWidth < 600 || !finePointer ? 600 : 1100), 1);
    const value = from + (goal - from) * (1 - (1 - p) ** 3);
    const number = value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: match[0].includes(",") });
    animated.textContent = final.slice(0, match.index) + number + final.slice(match.index + match[0].length);
    if (p === 1) finish(); else raf = requestAnimationFrame(frame);
  };
  const sync = () => {
    cancelAnimationFrame(raf); raf = 0; last = 0;
    if (!motionOK()) return finish();
    if (visible && !document.hidden && !done) raf = requestAnimationFrame(frame);
  };
  const observer = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: .2 });
  countJobs.set(el, finish); addEventListener("motionchange", sync); animated.textContent = final; observer.observe(el); sync();
}
$$('[data-count]').forEach(el => {
  const parent = el.closest("[data-reveal]");
  if (!parent || parent.classList.contains("in") || !motionOK()) countUp(el);
  else parent.addEventListener("revealed", () => countUp(el), { once: true });
});
addEventListener("beforeprint", () => $$('[data-count]').forEach(el => countJobs.get(el)?.()));

/* ---------- Motion: résumé progress ---------- */
(() => {
  const items = $$(".resume-item"); if (!items.length) return;
  const visible = new Set(); let raf = 0;
  const update = () => {
    raf = 0; if (document.hidden) return;
    let current = null;
    items.forEach(el => { if (visible.has(el) && el.getBoundingClientRect().top < innerHeight * .6) current = el; });
    items.forEach(el => el.classList.toggle("timeline-current", el === current && motionOK()));
    visible.forEach(el => {
      const r = el.getBoundingClientRect(), p = motionOK() ? Math.max(0, Math.min(1, (innerHeight * .6 - r.top) / r.height)) : 1;
      el.style.setProperty("--drawn", p.toFixed(3));
    });
    navLinks.forEach(a => {
      const r = $(a.getAttribute("href")).getBoundingClientRect();
      a.style.setProperty("--section-progress", motionOK() ? Math.max(0, Math.min(1, (innerHeight * .35 - r.top) / r.height)).toFixed(3) : 1);
    });
  };
  const request = () => { if (!raf) raf = requestAnimationFrame(update); };
  const observer = new IntersectionObserver(entries => { entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)); request(); });
  items.forEach(el => observer.observe(el));
  addEventListener("scroll", request, { passive: true }); addEventListener("resize", request); addEventListener("motionchange", request); update();
})();

/* ---------- Motion: ambient visibility ---------- */
(() => {
  // Pause inherited loops as well as the new desk effect when their scene leaves view.
  const observer = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle("motion-offscreen", !e.isIntersecting)));
  $$(".illo, .hobby, .ticker, .clocks, .reflection, .phone3d, .scroll-cue, .chibi, .key, .env").forEach(el => observer.observe(el));
  $$(".skill-groups .tags li").forEach(el => el.style.setProperty("--chip-delay", `${[...el.parentElement.children].indexOf(el) * 55}ms`));
})();

/* ---------- Motion: about scenes ---------- */
function aboutScene(el, build, image) {
  let visible = false, started = false, settled = false, animations = [];
  // One-shot effects keep their place offscreen, but disabled motion shows the finished scene.
  const finish = () => {
    if (settled) return;
    settled = true; el.classList.remove("scene-pending"); el.classList.add("scene-settled");
    animations.forEach(a => a.cancel());
  };
  const sync = () => {
    if (!motionOK()) return finish();
    if (!started && !settled && visible && !document.hidden && (!image || image.complete)) {
      started = true; animations = build(innerWidth < 600 || !finePointer);
      Promise.all(animations.map(a => a.finished)).then(finish, () => {});
    }
    animations.forEach(a => { if (!settled) { if (visible && !document.hidden) a.play(); else a.pause(); } });
  };
  el.classList.toggle("scene-pending", motionOK());
  const observer = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting; el.classList.toggle("motion-offscreen", !visible); sync();
  }, { threshold: .12 });
  observer.observe(el); image?.addEventListener("load", sync, { once: true });
  addEventListener("motionchange", sync); addEventListener("beforeprint", finish); sync();
}

/* ---------- Motion: about route ---------- */
(() => {
  const scene = $(".about-route"); if (!scene) return;
  const arc = $(".route-arc", scene), plane = $(".route-plane", scene), length = arc.getTotalLength();
  aboutScene(scene, light => {
    const duration = light ? 1300 : 2400, frames = Array.from({ length: 65 }, (_, i) => {
      const d = length * i / 64, p = arc.getPointAtLength(d), q = arc.getPointAtLength(Math.min(length, d + 1));
      const prev = arc.getPointAtLength(Math.max(0, d - 1));
      return { transform: `translate(${p.x}px,${p.y}px) rotate(${Math.atan2(q.y - prev.y, q.x - prev.x) * 180 / Math.PI}deg)`, opacity: i === 64 ? 0 : 1 };
    });
    // A scaled SVG mask draws the arc using only transforms, alongside the travelling plane.
    return [$(".route-mask", scene).animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration, easing: "linear", fill: "both" }),
      plane.animate(frames, { duration, easing: "linear", fill: "both" })];
  });
})();

/* ---------- Motion: about film ---------- */
(() => {
  if (page !== "about") return;
  $$(".polaroid").forEach(photo => {
    const image = $("img", photo), frame = document.createElement("span"), wash = document.createElement("span");
    frame.className = "film-image"; wash.className = "film-wash"; wash.setAttribute("aria-hidden", "true");
    image.before(frame); frame.append(image, wash);
    if (/\/(danang-sunset|uga-arch)\.jpg$/.test(image.getAttribute("src"))) frame.classList.add("photo-drift");
    aboutScene(frame, light => {
      const duration = light ? 1000 : 1600, options = { duration, easing: "ease-out", fill: "both" };
      return [image.animate([{ filter: light ? "contrast(.55) saturate(.3)" : "contrast(.3) saturate(.15) blur(3px)" }, { filter: "none" }], options),
        wash.animate([{ opacity: .92 }, { opacity: 0 }], options)];
    }, image);
  });
})();

/* ---------- Motion: about timeline ---------- */
(() => {
  const timeline = $("body[data-page='about'] .timeline"); if (!timeline) return;
  const items = $$("li", timeline), visible = new Set(); let raf = 0, onScreen = false;
  const update = () => {
    raf = 0; if (document.hidden) return;
    const r = timeline.getBoundingClientRect(), lineStart = 10.8, height = Math.max(1, r.height - lineStart * 2);
    const drawn = motionOK() ? Math.max(0, Math.min(height, innerHeight * .72 - r.top - lineStart)) : height;
    timeline.style.setProperty("--drawn", (drawn / height).toFixed(4));
    items.forEach(item => {
      const reached = !motionOK() || item.offsetTop + 9 <= drawn + lineStart;
      if (reached && !item.classList.contains("timeline-reached") && visible.has(item) && motionOK()) {
        const tick = $("time", item).animate([{ transform: "translateX(-3px)", opacity: .5 }, { transform: "translateX(0)", opacity: 1 }], { duration: 350, easing: "ease-out" });
        item._yearTick = tick;
      }
      item.classList.toggle("timeline-reached", reached);
    });
  };
  const request = () => { if (!raf && (!motionOK() || onScreen) && !document.hidden) raf = requestAnimationFrame(update); };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.target === timeline) onScreen = e.isIntersecting;
      else if (e.isIntersecting) { visible.add(e.target); if (motionOK() && !document.hidden && e.target._yearTick?.playState === "paused") e.target._yearTick.play(); }
      else { visible.delete(e.target); itemPause(e.target); }
    }); request();
  });
  const itemPause = item => { if (item._yearTick?.playState === "running") item._yearTick.pause(); };
  observer.observe(timeline); items.forEach(item => observer.observe(item));
  addEventListener("scroll", request, { passive: true }); addEventListener("resize", request);
  addEventListener("motionchange", () => { items.forEach(item => { if (!motionOK()) item._yearTick?.cancel(); else if (visible.has(item) && !document.hidden && item._yearTick?.playState === "paused") item._yearTick.play(); }); request(); });
  update();
})();

/* ---------- Motion: about generations ---------- */
(() => {
  const scene = $(".family-scene"); if (!scene) return;
  aboutScene(scene, light => $$(".family-window", scene).map((window, i) =>
    window.animate([{ opacity: .16 }, { opacity: 1 }], { duration: light ? 300 : 550, delay: i * (light ? 220 : 450), fill: "both", easing: "ease-out" })));
})();

/* ---------- Motion: about photo parallax ---------- */
(() => {
  const frames = $$(".photo-drift"); if (!frames.length) return;
  const visible = new Set(); let raf = 0;
  const update = () => {
    raf = 0; if (document.hidden) return;
    frames.forEach(frame => {
      if (!motionOK()) frame.style.setProperty("--photo-y", "0px");
      else if (visible.has(frame)) {
        const r = frame.getBoundingClientRect(), light = innerWidth < 600 || !finePointer;
        const y = Math.max(-1, Math.min(1, (innerHeight / 2 - r.top - r.height / 2) / innerHeight)) * (light ? 3 : 9);
        frame.style.setProperty("--photo-y", `${y.toFixed(2)}px`);
      }
    });
  };
  const request = () => { if (!raf && !document.hidden && (visible.size || !motionOK())) raf = requestAnimationFrame(update); };
  const observer = new IntersectionObserver(entries => { entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)); request(); });
  frames.forEach(frame => observer.observe(frame));
  addEventListener("scroll", request, { passive: true }); addEventListener("resize", request); addEventListener("motionchange", request); update();
})();

/* ---------- Motion: golden sunrise ---------- */
// The existing phone visibility observer pauses these CSS particles without another canvas.

/* ---------- Motion: golden gallery ---------- */
(() => {
  if (page !== "gp") return;
  const screens = $$(".gp-screen"), visible = new Set(); let raf = 0;
  screens.forEach((screen, i) => aboutScene(screen, light => [screen.animate([
    { transform: `translateY(${light ? 8 : i % 2 ? 38 : 24}px)`, opacity: 0 },
    { transform: "translateY(0)", opacity: 1 }
  ], { duration: light ? 420 : 800, delay: i * (light ? 40 : 100), easing: "cubic-bezier(.16,1,.3,1)", fill: "both" })], $("img", screen)));
  const update = () => {
    raf = 0; if (document.hidden) return;
    screens.forEach((screen, i) => {
      if (!motionOK()) screen.style.setProperty("--gp-drift", "0px");
      else if (visible.has(screen)) {
        const r = screen.getBoundingClientRect(), light = innerWidth < 600 || !finePointer;
        const p = Math.max(-1, Math.min(1, (innerHeight / 2 - r.top - r.height / 2) / innerHeight));
        screen.style.setProperty("--gp-drift", `${(p * (light ? 2 : i % 2 ? 6 : 10)).toFixed(2)}px`);
      }
    });
  };
  const request = () => { if (!raf && !document.hidden && (visible.size || !motionOK())) raf = requestAnimationFrame(update); };
  const observer = new IntersectionObserver(entries => { entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)); request(); });
  screens.forEach(screen => observer.observe(screen));
  addEventListener("scroll", request, { passive: true }); addEventListener("resize", request); addEventListener("motionchange", request);
})();

/* ---------- Motion: golden design ---------- */
(() => {
  const scene = $(".gp-design-scene"); if (!scene) return;
  aboutScene(scene, light => {
    const options = { duration: light ? 500 : 1000, easing: "ease-out", fill: "both" };
    // The busy screen briefly compresses, then remains intact as the static before reference.
    const clutter = $$(".gp-clutter", scene).map((group, i) => group.animate([
      { transform: "none", opacity: 1 },
      { transform: `translate(${light ? 1 : i % 2 ? -3 : 3}px, 2px) scale(.94)`, opacity: .45, offset: .4 },
      { transform: "none", opacity: 1 }
    ], { ...options, delay: i * 70 }));
    const arrow = $(".gp-design-arrow", scene).animate([
      { transform: "scale(1)", opacity: .5 }, { transform: `scale(${light ? 1.03 : 1.1})`, opacity: 1 }, { transform: "scale(1)", opacity: 1 }
    ], { ...options, delay: light ? 150 : 350 });
    const choices = $$(".gp-choice", scene).map((button, i) => button.animate([
      { transform: `translateY(${light ? 3 : 8}px) scale(.94)`, opacity: 0 },
      { transform: "translateY(0) scale(1)", opacity: 1 }
    ], { ...options, duration: light ? 280 : 450, delay: (light ? 300 : 650) + i * (light ? 130 : 230) }));
    return [...clutter, arrow, ...choices];
  });
})();

/* ---------- Motion: golden elder ---------- */
(() => {
  const scene = $(".gp-elder-scene"); if (!scene) return;
  aboutScene(scene, light => {
    const lights = $$(".gp-button-light", scene).map((button, i) => button.animate([
      { opacity: 0 }, { opacity: .4 }, { opacity: 0 }
    ], { duration: light ? 400 : 650, delay: i * (light ? 200 : 350), easing: "ease-in-out", fill: "both" }));
    const glint = $(".gp-glasses-glint", scene).animate([
      { transform: "translate(-2px, 1px)", opacity: 0 }, { transform: "translate(0, 0)", opacity: .9 }, { transform: "translate(2px, -1px)", opacity: 0 }
    ], { duration: light ? 400 : 700, delay: light ? 650 : 1100, easing: "ease-in-out", fill: "both" });
    return [...lights, glint];
  });
})();

/* ---------- Motion: golden demo ---------- */
(() => {
  const img = $("#demo-img"), btn = $("#demo-btn"), status = $("#demo-status"), frame = $(".gp-demo-frame");
  if (!img || !btn || !frame) return;
  const still = { src: img.getAttribute("src"), alt: img.alt };
  const gif = { src: "assets/img/gp-demo.gif", alt: "Animated demo of Golden Peace: welcome, log in, sign up, profile setup, home, relax, health and playlist screens." };
  let requested = false, active = false, visible = false;
  const sync = () => {
    if (!motionOK()) requested = false;
    btn.textContent = requested ? "Stop demo" : "Play demo";
    const play = requested && visible && motionOK() && !document.hidden;
    if (play === active) return;
    active = play; img.onload = img.onerror = null; frame.classList.remove("gp-demo-playing");
    // GIFs cannot pause natively, so restore the still outside view and when motion is disabled.
    if (!play) { img.src = still.src; img.alt = still.alt; status.textContent = ""; return; }
    status.textContent = "Loading the demo…";
    img.onload = () => { status.textContent = ""; frame.classList.add("gp-demo-playing"); };
    img.onerror = () => { setDemo(false); status.innerHTML = 'The demo couldn’t load. Try again, or <a href="https://github.com/NotWutLit/golden-peace-app">watch it on GitHub</a>.'; };
    img.loading = "eager"; img.src = gif.src; img.alt = gif.alt;
  };
  const setDemo = play => { requested = play; status.textContent = ""; sync(); };
  btn.addEventListener("click", () => setDemo(!requested));
  $$('a[href="#demo"]').forEach(a => a.addEventListener("click", () => { setDemo(true); setTimeout(() => btn.focus(), 0); }));
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; frame.classList.toggle("motion-offscreen", !visible); sync(); }).observe(frame);
  addEventListener("motionchange", sync); addEventListener("beforeprint", () => setDemo(false));
})();
