/* ==========================================================
   1) CONTENT — the only part you edit when selling this
      template to a new customer.
   ========================================================== */
const config = {
  recipientName: "Nguyễn Anh Hoàng<3",          // shown as "for My Love" (set "" to hide)
  forLine: "for {name}",
  yesLabel: "Cóa ",
  noLabel: "Hong thèm 💔",
  maxNoClicks: 8,                    // must equal steps.length - 1

  colors: {                          // overrides the CSS variables
    primary: "#e11d48",
    primarySoft: "#ff6b8a",
    ink: "#3b1d3a",
    bgFrom: "#fff3f6",
    bgMid: "#ffdde7",
    bgTo: "#e9defa",
  },
  confettiColors: ["#e11d48", "#ff6b8a", "#ffd166", "#c9b6f2", "#ffffff"],
  floatingEmoji: "♥",

  // One entry per state. Index = number of NO clicks so far.
  // yes / no = size multipliers, sticker = image shown above the question.
  steps: [
    { question: "Do you love me? ",                 yes: 1,    no: 1,    sticker: "assets/tonton_camHoa.gif" },
    { question: "Đồng ý đi mò:<",                   yes: 1.18, no: 0.88, sticker: "assets/tonton_namngua.gif" },
    { question: "Mình sẽ bùn lắm đó:(",                         yes: 1.38, no: 0.78, sticker: "assets/tonton_khoc.jpg" },
    { question: "Đồ đáng ghéc!",                  yes: 1.6,  no: 0.68, sticker: "assets/tonton_tuyet.gif" },
    { question: "Aaaaa",  yes: 1.9,  no: 0.55, sticker: "assets/tonton_namngua.gif" },
    { question: "Suy nghĩ lại đi màa 😭",   yes: 2.3,  no: 0.44, sticker: "assets/tonton_thatvong.jpg" },
    { question: "Cơ hội cuối á nha :<",                  yes: 2.9,  no: 0.34, sticker: "assets/tonton_khoc.jpg" },
    { question: "Gất bùn",    yes: 3.6,  no: 0.26, sticker: "assets/tonton_tuyet.gif" },
    { question: "",       yes: 4,    no: 0.2,  sticker: "assets/tonton_thatvong.jpg" },
  ],

  final: {
    sticker: "assets/Tonton Friends - Love Sticker.jpg",
    title: "Iu thee ❤️",
    subtitle: "hehe... mình biết bạn cũng thích mình màa🥰",
    replayLabel: "Play again",
    showReplay: false,                // set false in the customer's version
  },
};

/* ==========================================================
   2) LOGIC — no customer-specific text below this line.
   ========================================================== */
const $ = (id) => document.getElementById(id);
const el = {
  stage: $("stage"), forLine: $("for"), sticker: $("sticker"), question: $("question"),
  yes: $("yes"), no: $("no"), cover: $("cover"), coverQ: $("coverQ"), coverYes: $("coverYes"),
  final: $("final"), finalSticker: $("finalSticker"), finalTitle: $("finalTitle"),
  finalSub: $("finalSub"), replay: $("replay"), hearts: $("hearts"), finalHearts: $("finalHearts"), confetti: $("confetti"),
};
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lastStep = Math.min(config.maxNoClicks, config.steps.length - 1);

let noCount = 0;
let heartTimer = null;
let answered = false;

const rand = (min, max) => min + Math.random() * (max - min);

/* ---- Setup ---- */
function applyTheme() {
  const c = config.colors, root = document.documentElement.style;
  root.setProperty("--primary", c.primary);
  root.setProperty("--primary-soft", c.primarySoft);
  root.setProperty("--ink", c.ink);
  root.setProperty("--bg-from", c.bgFrom);
  root.setProperty("--bg-mid", c.bgMid);
  root.setProperty("--bg-to", c.bgTo);
}

function preloadImages() {
  const srcs = new Set([config.final.sticker, ...config.steps.map((s) => s.sticker)]);
  srcs.forEach((src) => { new Image().src = src; });
}

/* ---- Rendering a step ---- */
function swapText(node, text) {
  node.classList.add("swap");
  setTimeout(() => { node.textContent = text; node.classList.remove("swap"); }, 180);
}

function swapSticker(src) {
  if (el.sticker.getAttribute("src") === src) return;
  el.sticker.classList.add("swap");
  setTimeout(() => { el.sticker.src = src; el.sticker.classList.remove("swap"); }, 150);
}

function render(step, { instant = false } = {}) {
  const s = config.steps[step];
  document.documentElement.style.setProperty("--yes", s.yes);
  document.documentElement.style.setProperty("--no", s.no);
  if (instant) {
    el.question.textContent = s.question;
    el.sticker.src = s.sticker;
  } else {
    swapText(el.question, s.question);
    swapSticker(s.sticker);
  }
  if (step > 0) { // little pop on YES every time NO is pressed
    el.yes.classList.remove("bump"); void el.yes.offsetWidth; el.yes.classList.add("bump");
  }
}

/* ---- NO handler: the trap ---- */
function onNo() {
  if (answered || noCount >= lastStep) return;
  noCount += 1;
  render(noCount);
  if (noCount === lastStep) floodWithYes();
}

/* Final NO state: YES expands from its own center to cover the viewport */
function floodWithYes() {
  const r = el.yes.getBoundingClientRect();
  el.cover.style.setProperty("--cx", `${r.left + r.width / 2}px`);
  el.cover.style.setProperty("--cy", `${r.top + r.height / 2}px`);
  el.coverQ.textContent = config.steps[lastStep].question;
  el.coverYes.textContent = config.yesLabel;
  setTimeout(() => {
    if (answered) return;
    el.cover.classList.add("open");
    el.cover.tabIndex = 0;
    el.cover.setAttribute("aria-hidden", "false");
    el.cover.focus({ preventScroll: true });
  }, reduceMotion ? 0 : 450);
}

/* ---- YES handler: works in every state ---- */
function onYes() {
  if (answered) return;
  answered = true;
  el.stage.classList.add("is-hidden");
  el.final.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.final.classList.add("show");
    el.finalTitle.focus({ preventScroll: true });
  }));
  launchConfetti(36);
  heartTimer = setInterval(() => spawnHeart(el.finalHearts, 5500), 450);
  setTimeout(() => {          // cover no longer needed once the final scene is opaque
    el.cover.classList.remove("open");
    el.cover.setAttribute("aria-hidden", "true");
    el.cover.tabIndex = -1;
  }, 1000);
}

/* ---- Effects ---- */
function spawnHeart(container, duration) {
  if (reduceMotion) return;
  const h = document.createElement("span");
  h.className = "heart";
  h.textContent = config.floatingEmoji;
  h.style.setProperty("--x", `${rand(2, 96)}%`);
  h.style.setProperty("--size", `${rand(14, 34)}px`);
  h.style.setProperty("--sway", `${rand(-40, 40)}px`);
  h.style.setProperty("--dur", `${duration / 1000}s`);
  h.style.setProperty("--delay", "0s");
  h.addEventListener("animationend", () => h.remove());
  container.appendChild(h);
}

function startAmbientHearts() {
  if (reduceMotion) return;
  el.hearts.classList.add("ambient");
  for (let i = 0; i < 8; i++) {
    const h = document.createElement("span");
    h.className = "heart";
    h.textContent = config.floatingEmoji;
    h.style.setProperty("--x", `${(i + 0.5) * (100 / 8)}%`);
    h.style.setProperty("--size", `${rand(14, 26)}px`);
    h.style.setProperty("--sway", `${rand(-30, 30)}px`);
    h.style.setProperty("--dur", `${rand(11, 18)}s`);
    h.style.setProperty("--delay", `${rand(0, 10)}s`);
    el.hearts.appendChild(h);
  }
}

function launchConfetti(count) {
  if (reduceMotion) return;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("i");
    piece.style.setProperty("--x", `${rand(0, 100)}%`);
    piece.style.setProperty("--w", `${rand(6, 11)}px`);
    piece.style.setProperty("--c", config.confettiColors[i % config.confettiColors.length]);
    piece.style.setProperty("--dur", `${rand(2.8, 5)}s`);
    piece.style.setProperty("--delay", `${rand(0.3, 1.6)}s`);
    piece.style.setProperty("--drift", `${rand(-80, 80)}px`);
    piece.style.setProperty("--spin", `${rand(300, 900)}deg`);
    el.confetti.appendChild(piece);
  }
  setTimeout(() => { el.confetti.innerHTML = ""; }, 8000); // clean up
}

/* ---- Replay (handy for demos; hide via config.final.showReplay) ---- */
function reset() {
  clearInterval(heartTimer);
  answered = false; noCount = 0;
  el.final.classList.remove("show");
  setTimeout(() => { el.final.hidden = true; el.finalHearts.innerHTML = ""; el.confetti.innerHTML = ""; }, 900);
  el.stage.classList.remove("is-hidden");
  render(0, { instant: true });
  el.yes.focus({ preventScroll: true });
}

/* ---- Init ---- */
function init() {
  applyTheme();
  preloadImages();
  document.title = config.steps[0].question;
  el.forLine.textContent = config.recipientName ? config.forLine.replace("{name}", config.recipientName) : "";
  el.forLine.hidden = !config.recipientName;
  el.yes.textContent = config.yesLabel;
  el.no.textContent = config.noLabel;
  el.finalSticker.src = config.final.sticker;
  el.finalTitle.textContent = config.final.title;
  el.finalSub.textContent = config.final.subtitle;
  el.replay.textContent = config.final.replayLabel;
  el.replay.hidden = !config.final.showReplay;
  render(0, { instant: true });
  startAmbientHearts();

  el.yes.addEventListener("click", onYes);
  el.cover.addEventListener("click", onYes);
  el.no.addEventListener("click", onNo);
  el.replay.addEventListener("click", reset);
}
init();



// defaut