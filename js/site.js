// Thong Thai: site behaviour. Plain JS, no frameworks.
// Every feature checks for its element first, so each page only runs what it has.
document.documentElement.classList.add("js");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = { // localStorage can be blocked; the site still works without it
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
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
if (typed && !seen && !reduce) {
  const text = typed.textContent.trim(), start = 250, per = 75;
  typed.setAttribute("aria-label", text);
  const out = document.createElement("span"); out.setAttribute("aria-hidden", "true");
  typed.replaceChildren(out);
  typed.style.setProperty("--typed-at", `${start + text.length * per}ms`);
  [...text].forEach((ch, i) => setTimeout(() => { out.textContent += ch; }, start + i * per));
}

/* ---------- Cursor spotlight + scroll progress ---------- */
const root = document.documentElement;
if (finePointer && !reduce) {
  let raf = 0, mx = 0, my = 0;
  addEventListener("pointermove", e => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(() => { root.style.setProperty("--mx", mx + "px"); root.style.setProperty("--my", my + "px"); raf = 0; }); }, { passive: true });
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

/* ---------- Scroll reveal ---------- */
const revealSel = "main h2, .card, .tile, .gallery figure, .resume-item, .timeline li, .photo-row, .reflection, .facts, .sec-head, .board, .outro > *, .about-head, .demo";
const revealEls = $$(revealSel).filter(el => !el.closest(".hero"));
revealEls.forEach(el => {
  el.setAttribute("data-reveal", "");
  const sibs = [...el.parentElement.children].filter(c => c.matches(revealSel));
  if (sibs.length > 1) el.style.setProperty("--d", Math.min(sibs.indexOf(el), 5) * 80 + "ms"); // stagger lists, capped
});
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); e.target.dispatchEvent(new Event("revealed")); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
revealEls.forEach(el => io.observe(el));

/* ---------- Spotlight cards + 3D tilt ---------- */
$$(".spot").forEach(el => el.addEventListener("pointermove", e => {
  const r = el.getBoundingClientRect(); el.style.setProperty("--x", e.clientX - r.left + "px"); el.style.setProperty("--y", e.clientY - r.top + "px");
}));
if (finePointer && !reduce) {
  $$("[data-tilt]").forEach(el => {
    const max = +el.dataset.tilt || 6;
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
  const hp = $(".hero-photo .polaroid");
  if (hp) addEventListener("pointermove", e => {
    const px = e.clientX / innerWidth - .5, py = e.clientY / innerHeight - .5;
    hp.style.setProperty("--ty", (px * 16).toFixed(2) + "deg"); hp.style.setProperty("--tx", (-py * 12).toFixed(2) + "deg");
  }, { passive: true });
}

/* ---------- Golden Peace: CSS 3D phone turns as you scroll ---------- */
const p3 = $(".phone3d img");
if (p3 && !reduce) {
  const upd = () => { const t = Math.min(scrollY / 600, 1); p3.style.setProperty("--ry", (-14 + t * 28).toFixed(2) + "deg"); p3.style.setProperty("--rx", (6 - t * 6).toFixed(2) + "deg"); };
  addEventListener("scroll", upd, { passive: true }); upd();
}

/* ---------- Parallax on the Đà Nẵng tile ---------- */
const par = $(".b-home img");
if (par && !reduce) addEventListener("scroll", () => {
  const r = par.parentElement.getBoundingClientRect(); par.style.setProperty("--par", ((r.top - innerHeight / 2) * -.06).toFixed(1) + "px");
}, { passive: true });

/* ---------- Text scramble: "I build apps for ___" ---------- */
const scr = $(".scramble");
if (scr) {
  const phrases = JSON.parse(scr.dataset.phrases || "[]"), glyphs = "!<>-_\\/[]{}=+*^?#01";
  let idx = 0;
  const to = (next) => new Promise(done => {
    if (reduce) { scr.textContent = next; return done(); }
    const from = scr.textContent, len = Math.max(from.length, next.length), q = [];
    for (let i = 0; i < len; i++) { const s = Math.floor(Math.random() * 18), e = s + 8 + Math.floor(Math.random() * 18); q.push({ from: from[i] || "", to: next[i] || "", s, e }); }
    let f = 0;
    const step = () => {
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
  const loop = async () => { idx = (idx + 1) % phrases.length; await to(phrases[idx]); setTimeout(loop, 2600); };
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

/* ---------- Timeline draws itself ---------- */
$$(".timeline").forEach(t => {
  if (reduce) return;
  const upd = () => { const r = t.getBoundingClientRect(); const p = Math.min(Math.max((innerHeight * .8 - r.top) / r.height, 0), 1); t.style.setProperty("--drawn", p.toFixed(3)); };
  addEventListener("scroll", upd, { passive: true }); upd();
});
if (!reduce) $$(".resume-item").forEach(it => { it.style.setProperty("--drawn", 0); it.addEventListener("revealed", () => it.style.setProperty("--drawn", 1)); });

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
  { id: "projects", name: "Projects", url: "projects.html", hint: "Something small glints on one of the project images. Look closely." },
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
const ring = $(".keyring", tools);
function paintRing() {
  $$(".slots i", ring).forEach((s, i) => s.classList.toggle("on", i < found.size));
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
  el?.classList.add("found"); setTimeout(() => el?.remove(), 700);
  paintRing(); ring.classList.remove("bump"); void ring.offsetWidth; ring.classList.add("bump");
  chibiCheer();
  if (found.size === 5) { toast("All 5 keys found. The vault is open!"); setTimeout(openVault, 1200); }
  else toast(`Key found! ${found.size} of 5. ${5 - found.size} more hidden around the site.`);
}

function resetKeys() {
  found = new Set(); store.set("tt-keys", []);
  toast("Keys reset. All 5 are hidden again.");
  setTimeout(() => location.reload(), 900); // reload so this page's key goes back in its hiding spot
}

// page-specific reveal triggers
const keyFor = id => $(`.key[data-key="${id}"]`);
$(".flip")?.addEventListener("flipped", () => keyFor("about")?.removeAttribute("hidden"));
$("#demo-btn")?.addEventListener("click", () => setTimeout(() => keyFor("gp")?.removeAttribute("hidden"), 1500));
const lastItem = $$(".resume-item").at(-1);
lastItem?.addEventListener("revealed", () => keyFor("resume")?.removeAttribute("hidden"));
if (reduce && lastItem) keyFor("resume")?.removeAttribute("hidden");

/* ---------- Dialog helper ---------- */
function makeDialog(cls, html, label) {
  const d = document.createElement("dialog"); d.className = cls; d.innerHTML = html; d.setAttribute("aria-label", label);
  d.addEventListener("click", e => { if (e.target === d) d.close(); }); // click backdrop to close
  document.body.append(d); return d;
}

/* ---------- Rooms dialog (key ring) ---------- */
const rooms = makeDialog("rooms", "", "Escape room progress");
function openRooms() {
  rooms.innerHTML = `<h2>Escape the portfolio</h2><p class="hint">Each page is a room with one hidden key. Find all five to open the vault.</p>
    <ol>${ROOMS.map(r => `<li class="${found.has(r.id) ? "on" : ""}"><a href="${r.url}">${r.name}</a><span class="state">${found.has(r.id) ? "key found" : "locked"}</span></li>`).join("")}</ol>
    <div class="actions">${found.size === 5 ? `<button class="btn" data-act="vault">Open the vault</button>` : `<button class="btn ghost" data-act="hint">Hint for this room</button>`}<button class="btn ghost" data-act="close">Close</button>${found.size ? `<button class="btn ghost" data-act="reset">Reset keys</button>` : ""}</div><p class="hint" data-hint></p>`;
  rooms.querySelector("[data-act=close]").onclick = () => rooms.close();
  rooms.querySelector("[data-act=hint]")?.addEventListener("click", () => { rooms.querySelector("[data-hint]").textContent = hintText(); });
  rooms.querySelector("[data-act=vault]")?.addEventListener("click", () => { rooms.close(); openVault(); });
  const rb = rooms.querySelector("[data-act=reset]");
  rb?.addEventListener("click", () => {
    if (rb.dataset.sure) { rooms.close(); resetKeys(); return; }
    rb.dataset.sure = "1"; rb.classList.add("danger"); rb.textContent = "Sure? Click again to reset"; // two clicks, so nobody loses progress by accident
  });
  rooms.showModal();
}
ring.addEventListener("click", openRooms);
function hintText() {
  const r = ROOMS.find(r => r.id === page);
  if (!r) return "Explore the pages. Each one hides a key.";
  if (found.has(r.id)) { const next = ROOMS.find(x => !found.has(x.id)); return next ? `This room is done. Next, try ${next.name}.` : "You found every key. Open the vault!"; }
  return r.hint;
}

/* ---------- Vault ---------- */
const vault = makeDialog("vault", "", "Vault unlocked");
function openVault() {
  vault.innerHTML = `<div class="door" aria-hidden="true"></div><h2>You escaped!</h2>
    <p>Thanks for exploring every room. You clearly pay attention to detail, so let’s talk.</p>
    <div class="actions" style="justify-content:center"><a class="btn" href="mailto:${EMAIL}">Email Thong</a><button class="btn ghost" data-act="term">Open the terminal</button></div>
    <p class="hint">In the terminal, try <span class="mono">unlock</span>.</p>`;
  vault.querySelector("[data-act=term]").onclick = () => { vault.close(); openTerminal(); };
  vault.showModal(); confetti(); chibiCheer();
}
function confetti() {
  if (reduce) return;
  const c = document.createElement("canvas"); c.className = "confetti"; document.body.append(c);
  const ctx = c.getContext("2d"), dpr = devicePixelRatio || 1; c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const cols = ["#E8B651", "#F4D58D", "#6FA8FF", "#ECE8DF"];
  const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 4, s: 4 + Math.random() * 6, r: Math.random() * 6, c: cols[Math.floor(Math.random() * 4)] }));
  let t = 0;
  (function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += .1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
    if (++t < 160) requestAnimationFrame(frame); else c.remove();
  })();
}

/* ---------- Terminal ---------- */
const term = makeDialog("terminal", `<div class="term-bar"><i></i><i></i><i></i>thong@danang: ~</div><div class="term-out" aria-live="polite"></div>
  <form class="term-in"><span aria-hidden="true">$</span><label class="sr-only" for="term-input">Terminal command</label><input id="term-input" autocomplete="off" spellcheck="false"></form>`, "Terminal");
const tout = $(".term-out", term), tin = $("#term-input", term);
const print = (html, cls = "") => { const d = document.createElement("div"); if (cls) d.className = cls; d.innerHTML = html; tout.append(d); tout.scrollTop = tout.scrollHeight; };
const CMDS = {
  help: () => print(`commands: <span class="p">whoami</span>, <span class="p">about</span>, <span class="p">projects</span>, <span class="p">skills</span>, <span class="p">contact</span>, <span class="p">ls</span>, <span class="p">cat about.txt</span>, <span class="p">keys</span>, <span class="p">unlock</span>, <span class="p">reset</span>, <span class="p">open &lt;page&gt;</span>, <span class="p">clear</span>, <span class="p">exit</span>`),
  whoami: () => print("Thong Thai. CS student at the University of Georgia, from Đà Nẵng, Vietnam. I build apps for the people around me."),
  about: () => print("Grew up in a three-generation home in Đà Nẵng. My grandmother wanted peace in the family; my father wanted to watch his children grow up. I build so I can be there for others."),
  projects: () => print(`golden-peace   wellness app for older adults in Vietnam (React Native, Expo, Supabase)\nremember-me    diary app for people living with Alzheimer’s (Flutter, Firebase)\n<span class="dim">try: open golden-peace</span>`),
  skills: () => print("languages   Python, C++, JavaScript, TypeScript, HTML, CSS\nframeworks  React Native (Expo), Flutter (FlutterFlow)\ndata+tools  MySQL, Supabase, Firebase, YOLOv5-tiny, Figma"),
  contact: () => print(`email   <a href="mailto:${EMAIL}">${EMAIL}</a>\ngithub  <a href="${GITHUB}">${GITHUB.replace("https://", "")}</a>`),
  ls: () => print("about.txt  golden-peace/  remember-me/  resume.pdf  vault.lock"),
  "cat about.txt": () => CMDS.about(),
  "cat vault.lock": () => print(found.size === 5 ? "unlocked. type: unlock" : `locked. keys: ${found.size}/5`, found.size === 5 ? "ok" : "dim"),
  keys: () => print(ROOMS.map(r => `${found.has(r.id) ? "[x]" : "[ ]"} ${r.name}`).join("\n")),
  unlock: () => found.size === 5
    ? print(`ACCESS GRANTED\n\nYou found all five keys. Thank you for exploring.\nThe real secret: this whole site is built by hand, and I would love to build something with you.\nSay hi: <a href="mailto:${EMAIL}">${EMAIL}</a>`, "ok")
    : print(`ACCESS DENIED: ${found.size}/5 keys. Type <span class="p">keys</span> to see which rooms are left.`, "dim"),
  "sudo hire thong": () => print(`[sudo] password for recruiter: ********\nPermission granted. Opening email...`, "ok") || setTimeout(() => location.href = `mailto:${EMAIL}`, 900),
  reset: () => { if (!found.size) return print("No keys to reset yet.", "dim"); print("Resetting keys...", "dim"); setTimeout(() => { term.close(); resetKeys(); }, 500); },
  clear: () => { tout.innerHTML = ""; },
  exit: () => term.close(),
};
const PAGES = { home: "index.html", about: "about.html", projects: "projects.html", resume: "resume.html", "golden-peace": "golden-peace.html", "remember-me": "https://github.com/NotWutLit/remember-me-app" };
$(".term-in", term).addEventListener("submit", e => {
  e.preventDefault(); const raw = tin.value.trim(); tin.value = ""; if (!raw) return;
  print(`<span class="p">$</span> ${raw.replace(/</g, "&lt;")}`);
  const cmd = raw.toLowerCase();
  if (CMDS[cmd]) return CMDS[cmd]();
  const m = cmd.match(/^(open|cd) (.+)$/); if (m && PAGES[m[2]]) { print(`opening ${m[2]}...`, "dim"); return setTimeout(() => location.href = PAGES[m[2]], 500); }
  if (cmd.startsWith("sudo")) return print("nice try.", "dim");
  print(`command not found: ${raw.replace(/</g, "&lt;")}. Type <span class="p">help</span>.`, "dim");
});
function openTerminal() {
  if (!tout.childElementCount) print(`Welcome to thong@danang. Type <span class="p">help</span> to start. Keys found: ${found.size}/5`, "dim");
  term.showModal(); tin.focus();
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
  { label: "Escape room: keys and hints", hint: "game", run: () => openRooms() },
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
const setX = x => { cx = x; chibi.style.setProperty("--cx", x + "px"); };
const ACTS = ["wave", "laptop", "camera", "racket", "read"];
function showAct() { ACTS.forEach(a => chibi.classList.toggle("act-" + a, !running && a === act)); }

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
  if (reduce || running) return;
  running = true; showAct();
  const dir = Math.sign(target - cx) || 1;
  chibi.classList.add("running"); chibi.classList.toggle("flip", dir < 0);
  let last = performance.now();
  const frame = now => {
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
chibi.addEventListener("click", () => { paused = true; chibi.classList.remove("running"); say(hintText()); });
function chibiCheer() {
  if (reduce) return;
  chibi.classList.add("cheer"); setTimeout(() => chibi.classList.remove("cheer"), 1400);
}
if (reduce) { setX(12); showAct(); } // stands still in the corner with his prop; still clickable
else {
  setTimeout(() => goTo(Math.min(innerWidth * .18, 220)), 2200);
  setInterval(() => { if (!paused && !document.hidden) goTo(randomSpot()); }, 14000);
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
