// A hello for anyone who opens DevTools (it's a CS portfolio, after all).
console.log(
  "%cHi, I'm Thong.%c\nThis site is hand-written HTML, CSS and a little JavaScript. No frameworks.",
  "font: 600 16px Georgia, serif; color: #8A6D2B;",
  "font: 13px system-ui, sans-serif; color: inherit;"
);

// Home: type the name out once, like a terminal prompt.
// The text is already in the HTML, so if this script fails the name still shows.
// Only once per visit: coming back to Home shows the name straight away.
const typed = document.querySelector("[data-type]");
let seen = false;
// Only Home sets the flag, so a visit that starts on another page still sees the name type.
if (typed) try { seen = sessionStorage.getItem("typed") === "1"; sessionStorage.setItem("typed", "1"); } catch {} // storage can be blocked; then it just types
if (seen && typed) typed.classList.add("typed-before");
if (typed && !seen && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const text = typed.textContent.trim();
  const start = 150, perChar = 70; // ms
  typed.setAttribute("aria-label", text); // screen readers read the name once, not letter by letter
  const out = document.createElement("span");
  out.setAttribute("aria-hidden", "true");
  typed.replaceChildren(out);
  typed.style.setProperty("--typed-at", `${start + text.length * perChar}ms`); // cursor starts blinking when typing ends
  // Letters are added one at a time so the cursor follows them.
  [...text].forEach((ch, i) => setTimeout(() => { out.textContent += ch; }, start + i * perChar));
}
