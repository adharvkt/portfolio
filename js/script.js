document.documentElement.classList.add("js");

// Selectors
const menu = document.querySelector("#menu-btn");
const header = document.querySelector(".header");
const themeToggler = document.querySelector("#theme-toggler");
const blogContainer = document.getElementById("blog-grid");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Toggle menu functionality
menu.addEventListener("click", () => {
  menu.classList.toggle("fa-times");
  header.classList.toggle("active");
});

// Close menu on scroll + scroll progress bar
const progressBar = document.getElementById("scroll-progress");
window.addEventListener(
  "scroll",
  () => {
    menu.classList.remove("fa-times");
    header.classList.remove("active");
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar && max > 0) {
      progressBar.style.width = (window.scrollY / max) * 100 + "%";
    }
  },
  { passive: true }
);

// Theme toggle functionality
themeToggler.addEventListener("click", () => {
  themeToggler.classList.toggle("fa-sun");
  document.body.classList.toggle("active");
});

// Typing animation
const typedElement = document.querySelector(".typed");
if (typedElement) {
  const typedStrings = typedElement.getAttribute("data-typed-items").split(",");
  new Typed(".typed", {
    strings: typedStrings,
    loop: true,
    typeSpeed: 100,
    backSpeed: 50,
    backDelay: 100,
  });
}

/* ------------------------------------------------------------------
   BLOG
   1) PUBLISHED_POSTS: research I wrote for other companies' platforms.
      Add a new object here for every new post. Posts are grouped under
      their `platform` heading and sorted newest first.
   2) Medium: loaded automatically from my Medium feed.
------------------------------------------------------------------- */
const PUBLISHED_POSTS = [
  {
    platform: "FalconFeeds",
    platformUrl: "https://falconfeeds.io/blogs/",
    title: "Scattered LAPSUS$ Hunters : Profiling the Evolving Cybercrime Ecosystem",
    excerpt:
      "A deep dive into Scattered LAPSUS$ Hunters (SLH/SLSH), a cybercrime identity tied to Scattered Spider, LAPSUS$ and ShinyHunters: its 2025 emergence, social engineering, cloud and SaaS intrusions, data theft, extortion, and how verified operations differ from unconfirmed claims.",
    link: "https://falconfeeds.io/blogs/scattered-lapsus-hunters-slh-cyberattacks-tactics-threat-actor-profile/",
    image: "image/blog/falconfeeds-banner.jpg",
    date: "2026-10-28",
  },
];

function formatDate(value) {
  if (!value) return "";
  const d = new Date(String(value).replace(" ", "T"));
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function byDateDesc(a, b) {
  const da = a.date ? new Date(String(a.date).replace(" ", "T")) : 0;
  const db = b.date ? new Date(String(b.date).replace(" ", "T")) : 0;
  return db - da;
}

function buildCard(post) {
  const card = el("article", "blog-card reveal tilt");

  const media = el("div", "blog-card__img");
  const placeholder = () => media.appendChild(el("i", "fas fa-newspaper"));
  if (post.image) {
    const img = document.createElement("img");
    img.src = post.image;
    img.alt = post.title;
    img.loading = "lazy";
    img.onerror = () => {
      img.remove();
      placeholder();
    };
    media.appendChild(img);
  } else {
    placeholder();
  }
  card.appendChild(media);

  const body = el("div", "blog-card__body");
  const meta = el("div", "blog-card__meta");
  meta.appendChild(el("span", "blog-card__src", post.source));
  const when = [formatDate(post.date), post.readTime].filter(Boolean).join(" \u00b7 ");
  meta.appendChild(el("span", "", when));
  body.appendChild(meta);
  body.appendChild(el("h3", "", post.title));
  body.appendChild(el("p", "", post.excerpt));

  const link = el("a", "read", "Read more ");
  link.href = post.link;
  link.target = "_blank";
  link.rel = "noopener";
  link.appendChild(el("i", "fas fa-arrow-right"));
  body.appendChild(link);

  card.appendChild(body);
  return card;
}

function renderPublished() {
  const host = document.getElementById("published-blogs");
  if (!host) return;
  host.innerHTML = "";
  const platforms = [...new Set(PUBLISHED_POSTS.map((p) => p.platform))];
  platforms.forEach((name) => {
    const posts = PUBLISHED_POSTS.filter((p) => p.platform === name).sort(byDateDesc);
    const block = el("div", "platform-block");
    const head = el("h3", "platform-block__name");
    if (posts[0].platformUrl) {
      const a = el("a", "", name + " ");
      a.href = posts[0].platformUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.appendChild(el("i", "fas fa-arrow-up-right-from-square"));
      head.appendChild(a);
    } else {
      head.textContent = name;
    }
    block.appendChild(head);
    const grid = el("div", "blog-grid");
    posts.forEach((post) => grid.appendChild(buildCard({ ...post, source: post.platform })));
    block.appendChild(grid);
    host.appendChild(block);
  });
  observeReveals();
}

async function fetchMediumBlogs() {
  if (!blogContainer) return;
  const mediumFeedUrl = `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@adharvkt&rand=${Math.random()}`;
  try {
    const response = await fetch(mediumFeedUrl);
    const data = await response.json();
    if (data.status === "ok") {
      // Set the word to be excluded (case-insensitive)
      const excludedWord = "Hfjcjc";
      const posts = data.items
        .filter((post) => !post.title.toLowerCase().includes(excludedWord.toLowerCase()))
        .map((post) => {
          const imageMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
          const text = post.content.replace(/(<([^>]+)>)/gi, "").trim();
          return {
            source: "Medium",
            title: post.title,
            excerpt: text.substring(0, 180) + (text.length > 180 ? "..." : ""),
            link: post.link,
            image: imageMatch ? imageMatch[1] : "",
            date: post.pubDate,
          };
        })
        .sort(byDateDesc);
      blogContainer.innerHTML = "";
      posts.forEach((post) => blogContainer.appendChild(buildCard(post)));
      observeReveals();
      return;
    }
    throw new Error("Medium feed unavailable");
  } catch (error) {
    console.error("Error fetching Medium blogs:", error);
    blogContainer.innerHTML = "";
    const note = el("p", "blog-empty", "Couldn't load Medium posts right now. ");
    const a = el("a", "", "Read them on Medium");
    a.href = "https://medium.com/@adharvkt";
    a.target = "_blank";
    a.rel = "noopener";
    note.appendChild(a);
    blogContainer.appendChild(note);
  }
}

/* ------------------------------------------------------------------
   Reveal on scroll, counters, scrollspy, lightbox
------------------------------------------------------------------- */
let revealObserver = null;
function observeReveals() {
  const items = document.querySelectorAll(".reveal:not(.in)");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    items.forEach((i) => i.classList.add("in"));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
  }
  items.forEach((i) => revealObserver.observe(i));
}

function setupCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!("IntersectionObserver" in window) || reduceMotion) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const node = entry.target;
        const target = parseInt(node.dataset.count, 10);
        const start = performance.now();
        const duration = 1600;
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (node.dataset.suffix || "");
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(node);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((c) => io.observe(c));
}

function setupScrollSpy() {
  const links = [...document.querySelectorAll(".header .navbar a")];
  const map = links
    .map((a) => ({ a, target: document.querySelector(a.getAttribute("href")) }))
    .filter((x) => x.target);
  const onScroll = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = map[0];
    map.forEach((m) => {
      if (m.target.getBoundingClientRect().top + window.scrollY <= y) current = m;
    });
    links.forEach((l) => l.classList.toggle("active", current && l === current.a));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupLightbox() {
  const box = document.getElementById("lightbox");
  if (!box) return;
  const big = box.querySelector("img");
  document.addEventListener("click", (e) => {
    const tile = e.target.closest(".about .box-container .boxes, .project__gallery img");
    if (!tile) return;
    const img = tile.tagName === "IMG" ? tile : tile.querySelector("img");
    if (!img) return;
    big.src = img.currentSrc || img.src;
    box.classList.add("open");
  });
  box.addEventListener("click", () => box.classList.remove("open"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") box.classList.remove("open");
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("boxes")) {
      e.preventDefault();
      e.target.click();
    }
  });
}

/* ------------------------------------------------------------------
   Colour palettes (accent colours are CSS variables, canvases read them)
------------------------------------------------------------------- */
const PALETTES = {
  matrix: { a: "44, 214, 38", b: "25, 227, 197" },
  ocean: { a: "56, 189, 248", b: "129, 140, 248" },
  violet: { a: "168, 85, 247", b: "244, 114, 182" },
  sunset: { a: "251, 146, 60", b: "244, 63, 94" },
};
const ACC = { ...PALETTES.matrix };
function readAccent() {
  const cs = getComputedStyle(document.documentElement);
  ACC.a = cs.getPropertyValue("--ac1").trim() || ACC.a;
  ACC.b = cs.getPropertyValue("--ac2").trim() || ACC.b;
}
function setPalette(name, save = true) {
  const pal = PALETTES[name];
  if (!pal) return false;
  document.documentElement.style.setProperty("--ac1", pal.a);
  document.documentElement.style.setProperty("--ac2", pal.b);
  readAccent();
  if (save) { try { localStorage.setItem("palette", name); } catch (e) {} }
  return true;
}
function setupPalette() {
  const box = document.getElementById("palette");
  const fab = document.getElementById("palette-fab");
  if (!box || !fab) return;
  let saved = null;
  try { saved = localStorage.getItem("palette"); } catch (e) {}
  if (saved) setPalette(saved, false);
  fab.addEventListener("click", () => box.classList.toggle("open"));
  box.querySelectorAll("[data-p]").forEach((b) =>
    b.addEventListener("click", () => { setPalette(b.dataset.p); })
  );
  document.addEventListener("click", (e) => { if (!box.contains(e.target)) box.classList.remove("open"); });
}

/* ------------------------------------------------------------------
   Hero background: connected-node network (dots joined by lines,
   lines also reach out to the mouse). Colours follow the palette.
------------------------------------------------------------------- */
function setupNetwork() {
  const canvas = document.getElementById("net-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const host = canvas.parentElement;
  const content = host.querySelector(".content");
  let w = 0, h = 0, pts = [], raf = null, visible = true;
  const mouse = { x: -999, y: -999 };

  function resize() {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(Math.round((w * h) / 15000), 90);
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.8,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (!reduceMotion) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACC.a}, 0.85)`;
      ctx.fill();
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 130) {
          ctx.strokeStyle = `rgba(${ACC.b}, ${0.25 * (1 - d / 130)})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (dm < 170) {
        ctx.strokeStyle = `rgba(${ACC.a}, ${0.5 * (1 - dm / 170)})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    if (visible && !reduceMotion) raf = requestAnimationFrame(draw);
  }

  host.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    if (content && !reduceMotion) {
      content.style.setProperty("--px", ((mouse.x / r.width) - 0.5) * 2);
      content.style.setProperty("--py", ((mouse.y / r.height) - 0.5) * 2);
    }
  });
  host.addEventListener("pointerleave", () => {
    mouse.x = mouse.y = -999;
    if (content) { content.style.setProperty("--px", 0); content.style.setProperty("--py", 0); }
  });
  window.addEventListener("resize", () => { resize(); if (reduceMotion) draw(); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
      if (!visible) { cancelAnimationFrame(raf); raf = null; }
    }).observe(host);
  }
  resize();
  draw();
}

/* ------------------------------------------------------------------
   Cards: cursor spotlight + subtle 3D tilt (delegated, works for
   cards created later such as blog posts)
------------------------------------------------------------------- */
function setupCardFx() {
  const sel = ".tl-company, .project, .blog-card, .ach-tile, .ach-voice, .edu-card";
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest && e.target.closest(sel);
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    card.style.setProperty("--mx", x + "px");
    card.style.setProperty("--my", y + "px");
    if (card.classList.contains("tilt") && !reduceMotion && e.pointerType !== "touch") {
      card.style.setProperty("--rx", ((y / r.height) - 0.5) * -8 + "deg");
      card.style.setProperty("--ry", ((x / r.width) - 0.5) * 8 + "deg");
    }
  });
  document.addEventListener("pointerout", (e) => {
    const card = e.target.closest && e.target.closest(".tilt");
    if (card && !card.contains(e.relatedTarget)) {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    }
  });
}

/* ------------------------------------------------------------------
   Boot sequence (once per browser session)
------------------------------------------------------------------- */
function setupBoot() {
  const boot = document.getElementById("boot");
  if (!boot) return;
  let seen = false;
  try { seen = sessionStorage.getItem("booted") === "1"; } catch (e) {}
  if (seen || reduceMotion) { boot.classList.add("done"); return; }

  const log = document.getElementById("boot-log");
  const fill = document.getElementById("boot-fill");
  const lines = [
    "> initialising adharv.sys v2.0",
    "> loading modules ........ osint | threat-intel | soc | web3",
    "> mapping attack surface ........ done",
    "> hunting impersonators ........ done",
    "> establishing secure channel ........ OK",
    "> ACCESS GRANTED",
  ];
  let i = 0, finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    boot.classList.add("done");
    try { sessionStorage.setItem("booted", "1"); } catch (e) {}
  };
  const next = () => {
    if (finished) return;
    if (i < lines.length) {
      log.textContent += (i ? "\n" : "") + lines[i];
      i++;
      fill.style.width = Math.round((i / lines.length) * 100) + "%";
      setTimeout(next, i === lines.length ? 650 : 330);
    } else {
      finish();
    }
  };
  boot.addEventListener("click", finish);
  window.addEventListener("keydown", finish, { once: true });
  next();
}

/* ------------------------------------------------------------------
   Small helpers: ghost headings, back-to-top, depth on cards
------------------------------------------------------------------- */
function setupExtras() {
  document.querySelectorAll(".heading").forEach((h) => {
    if (h.closest(".home")) return;
    const t = ((h.querySelector("span") || h).textContent || "").trim();
    if (t && t.length < 22) h.setAttribute("data-ghost", t);
  });
  document.querySelectorAll(".services .box, .about .row .box-container .box").forEach((c) => c.classList.add("reveal", "tilt"));
  const top = document.getElementById("to-top");
  if (top) {
    window.addEventListener("scroll", () => top.classList.toggle("show", window.scrollY > 700), { passive: true });
    top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
}

/* ------------------------------------------------------------------
   Skill sphere: draggable 3D word globe
------------------------------------------------------------------- */
function setupOrbit() {
  const canvas = document.getElementById("orbit-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const tip = document.getElementById("orbit-tip");
  const GROUPS = {
    intel: { label: "Threat Intelligence", color: () => ACC.a },
    soc: { label: "SOC & Detection", color: () => ACC.b },
    web3: { label: "Web3 & Brand", color: () => "167, 139, 250" },
    tools: { label: "Tools & Offence", color: () => "251, 191, 36" },
  };
  const WORDS = {
    intel: ["Threat Intelligence", "OSINT", "Dark Web Monitoring", "Ransomware Tracking", "Vulnerability Intel", "Attack Surface", "IOC Analysis", "TTP Mapping", "MITRE ATT&CK", "Malware Analysis"],
    soc: ["SOC", "Log Analysis", "IBM QRadar", "Threat Hunting", "Phishing Detection", "Leak Detection"],
    web3: ["Web3 Security", "Blockchain Security", "Brand Protection", "Takedowns", "Impersonation Detection", "Digital Risk Protection"],
    tools: ["Python Automation", "Metasploit", "VAPT", "OWASP", "Linux", "CTF", "Red Teaming", "TryHackMe"],
  };
  const tags = [];
  Object.keys(WORDS).forEach((g) => WORDS[g].forEach((t) => tags.push({ t, g })));
  // spread groups evenly over the sphere by shuffling deterministically
  tags.sort((a, b) => ((a.t.length * 7919) % 31) - ((b.t.length * 7919) % 31) || a.t.localeCompare(b.t));
  tags.forEach((tg, i) => {
    const y = 1 - ((i + 0.5) / tags.length) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = Math.PI * (3 - Math.sqrt(5)) * i;
    tg.p = [Math.cos(th) * r, y, Math.sin(th) * r];
  });

  let w = 0, h = 0, raf = null, visible = false, filter = "all", hover = null;
  const st = { rotY: 0, rotX: 0.25, vel: 0.004, dragging: false, lx: 0, ly: 0, mx: -999, my: -999, inside: false };

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function rot(p) {
    const cy = Math.cos(st.rotY), sy = Math.sin(st.rotY), cx = Math.cos(st.rotX), sx = Math.sin(st.rotX);
    let x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy;
    const y = p[1] * cx - z * sx; z = p[1] * sx + z * cx;
    return [x, y, z];
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w * 0.34, h * 0.43), cx = w / 2, cy = h / 2, scale = Math.min(1.15, w / 760);
    if (!st.dragging && !reduceMotion) {
      st.rotY += st.vel * (st.inside ? 0.25 : 1);
      st.vel += (0.004 - st.vel) * 0.03;
    }
    // sphere shell
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R * 1.05);
    g.addColorStop(0, `rgba(${ACC.a}, 0.10)`); g.addColorStop(1, `rgba(${ACC.b}, 0.02)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(${ACC.a}, 0.22)`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < 3; k++) {          // equator rings
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const a = (i / 80) * Math.PI * 2;
        const q = rot(k === 0 ? [Math.cos(a), 0, Math.sin(a)] : k === 1 ? [Math.cos(a), Math.sin(a), 0] : [0, Math.cos(a), Math.sin(a)]);
        const px = cx + q[0] * R * 1.02, py = cy - q[1] * R * 1.02;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = `rgba(${ACC.b}, 0.12)`; ctx.stroke();
    }

    const proj = tags.map((tg) => { const q = rot(tg.p); return { tg, x: cx + q[0] * R, y: cy - q[1] * R, z: q[2] }; });
    proj.sort((a, b) => a.z - b.z);

    // hover detection (front-facing tags only)
    hover = null;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const boxes = proj.map((o) => {
      const depth = (o.z + 1) / 2;
      const size = (11 + 8 * depth) * scale;
      ctx.font = `600 ${size}px Poppins, "Segoe UI", sans-serif`;
      const tw = ctx.measureText(o.tg.t).width;
      return { o, depth, size, tw };
    });
    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = boxes[i];
      if (b.o.z > -0.15 && Math.abs(st.mx - b.o.x) < b.tw / 2 + 6 && Math.abs(st.my - b.o.y) < b.size / 2 + 6) { hover = b; break; }
    }

    // lines from hovered tag to same-group tags
    if (hover) {
      ctx.lineWidth = 1;
      boxes.forEach((b) => {
        if (b !== hover && b.o.tg.g === hover.o.tg.g && b.o.z > -0.3) {
          ctx.strokeStyle = `rgba(${GROUPS[b.o.tg.g].color()}, ${0.15 + 0.35 * b.depth})`;
          ctx.beginPath(); ctx.moveTo(hover.o.x, hover.o.y); ctx.lineTo(b.o.x, b.o.y); ctx.stroke();
        }
      });
    }

    boxes.forEach((b) => {
      const { o, depth, size } = b;
      const match = filter === "all" || filter === o.tg.g;
      const col = GROUPS[o.tg.g].color();
      let alpha = (0.22 + 0.78 * depth) * (match ? 1 : 0.14);
      if (hover) alpha *= b === hover || b.o.tg.g === hover.o.tg.g ? 1 : 0.35;
      ctx.font = `${b === hover ? 700 : 600} ${size * (b === hover ? 1.18 : 1)}px Poppins, "Segoe UI", sans-serif`;
      if (match && depth > 0.55) { ctx.shadowColor = `rgba(${col}, 0.8)`; ctx.shadowBlur = 10 * depth; }
      ctx.fillStyle = `rgba(${col}, ${Math.min(1, alpha)})`;
      ctx.fillText(o.tg.t, o.x, o.y);
      ctx.shadowBlur = 0;
    });

    if (tip) {
      if (hover) {
        tip.textContent = GROUPS[hover.o.tg.g].label;
        tip.style.left = hover.o.x + "px"; tip.style.top = hover.o.y + "px"; tip.style.opacity = 1;
      } else tip.style.opacity = 0;
    }
    canvas.style.cursor = st.dragging ? "grabbing" : hover ? "pointer" : "grab";
    if (visible && !reduceMotion) raf = requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointerdown", (e) => { st.dragging = true; st.lx = e.clientX; st.ly = e.clientY; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect(); st.mx = e.clientX - r.left; st.my = e.clientY - r.top; st.inside = true;
    if (st.dragging) {
      const dx = e.clientX - st.lx, dy = e.clientY - st.ly;
      st.rotY += dx * 0.007; st.vel = dx * 0.0018; st.rotX = Math.max(-1.2, Math.min(1.2, st.rotX + dy * 0.005));
      st.lx = e.clientX; st.ly = e.clientY;
      if (reduceMotion) draw();
    }
  });
  const end = () => { st.dragging = false; };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", () => { st.inside = false; st.mx = st.my = -999; end(); });
  window.addEventListener("resize", () => { resize(); if (reduceMotion) draw(); });

  document.querySelectorAll("#orbit-filters .pill").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll("#orbit-filters .pill").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      filter = btn.dataset.g;
      if (reduceMotion) draw();
    })
  );

  resize();
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
      if (!visible) { cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0.05 }).observe(canvas);
  } else { visible = true; draw(); }
  draw();
}

/* ------------------------------------------------------------------
   Matrix rain (Konami code or `matrix` command)
------------------------------------------------------------------- */
function startMatrix(ms = 9000) {
  if (document.getElementById("matrix-rain")) return;
  const c = document.createElement("canvas");
  c.id = "matrix-rain";
  document.body.appendChild(c);
  const ctx = c.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const size = 16, cols = Math.ceil(innerWidth / size);
  const drops = Array.from({ length: cols }, () => Math.random() * -40);
  const glyphs = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ<>/{}[]$#%";
  let raf, alive = true;
  const stop = () => { alive = false; cancelAnimationFrame(raf); c.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") stop(); };
  document.addEventListener("keydown", onKey);
  c.addEventListener("click", stop);
  setTimeout(() => alive && stop(), ms);
  (function frame() {
    if (!alive) return;
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)"; ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.font = `${size}px monospace`;
    drops.forEach((d, i) => {
      const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
      ctx.fillStyle = Math.random() > 0.96 ? "#fff" : `rgb(${ACC.a})`;
      ctx.fillText(ch, i * size, d * size);
      if (d * size > innerHeight && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 1;
    });
    raf = requestAnimationFrame(frame);
  })();
}
function setupKonami() {
  const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  document.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === seq[pos] ? pos + 1 : k === seq[0] ? 1 : 0;
    if (pos === seq.length) { pos = 0; startMatrix(); }
  });
}

/* ------------------------------------------------------------------
   Interactive terminal
------------------------------------------------------------------- */
function setupTerminal() {
  const body = document.getElementById("term-body");
  const input = document.getElementById("term-input");
  if (!body || !input) return;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hist = []; let hi = 0;
  const print = (html, cls = "") => {
    const d = document.createElement("div");
    d.className = "ln " + cls; d.innerHTML = html; body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  };
  const rows = (arr) => arr.forEach((l) => print(l));

  const links = () => [...document.querySelectorAll(".home .share a")].map((a) => a.href).filter((h) => /^https?:/.test(h));

  const COMMANDS = {
    help: () => rows([
      '<span class="hl">Available commands</span>',
      "  whoami         who am I",
      "  skills         what I work with",
      "  experience     where I have worked",
      "  education      where I studied",
      "  projects       things I have built or led",
      "  achievements   highlights",
      "  blog           what I write",
      "  contact        how to reach me",
      "  neofetch       system summary",
      "  theme &lt;name&gt;   matrix | ocean | violet | sunset",
      "  matrix         digital rain",
      "  clear          clear the screen",
      '<span class="dim">psst: there are a few hidden commands, and the Konami code works too.</span>',
    ]),
    whoami: () => rows([
      '<span class="ok">Adharv K T</span> - cybersecurity professional',
      "Focus: threat intelligence, OSINT, SOC, brand impersonation and Web3 security.",
      "Currently: Reporting Operations Analyst (Threat Detection) at ChainPatrol.",
      "Previously: Cyber Threat Analyst at Falconfeeds.io (2023 - 2026).",
    ]),
    skills: () => rows([
      '<span class="hl">Threat Intelligence</span>  OSINT, dark web monitoring, ransomware tracking, IOC analysis, TTP mapping, MITRE ATT&amp;CK',
      '<span class="hl">SOC &amp; Detection</span>     log analysis, IBM QRadar, threat hunting, phishing and leak detection',
      '<span class="hl">Web3 &amp; Brand</span>        blockchain security, brand protection, impersonation takedowns, DRP',
      '<span class="hl">Tools &amp; Offence</span>     Python automation, Metasploit, VAPT, OWASP, Linux, CTFs',
    ]),
    experience: () => rows([
      '<span class="ok">2026 - now</span>    ChainPatrol         Reporting Operations Analyst (Threat Detection)',
      '<span class="ok">2024 - 2026</span>   Falconfeeds.io       Cyber Threat Analyst',
      '<span class="ok">2023 - 2024</span>   Falconfeeds.io       Cyber Threat Intelligence Analyst Intern',
      '<span class="ok">2021 - now</span>    TryHackMe           CTF Player (top 1% globally)',
      '<span class="ok">2023</span>          First Logic Meta Lab Penetration Tester (internship)',
      '<span class="ok">2022 - 2023</span>   CyberCrews          Cyber Security Intern',
    ]),
    education: () => rows([
      "2023 - 2025   Suresh Gyan Vihar University",
      "2021 - 2023   CyberCrews Hacker Academy (training)",
      "2021          Higher Secondary Education",
      "2019          High School",
    ]),
    projects: () => rows([
      '<span class="hl">Neokred</span>  VAPT and security-awareness engagement for a fintech company. I led the team.',
    ]),
    achievements: () => rows([
      "- Top 1% globally on TryHackMe",
      "- #1 on the monthly India leaderboard (previously)",
      "- Top 3 on the monthly global leaderboard (previously)",
      "- 630+ days on TryHackMe, and counting",
      "- LinkedIn Top Cybersecurity and Information Security Voice",
    ]),
    blog: () => rows([
      'Research: <a href="https://falconfeeds.io/blogs/scattered-lapsus-hunters-slh-cyberattacks-tactics-threat-actor-profile/" target="_blank" rel="noopener">Scattered LAPSUS$ Hunters (FalconFeeds)</a>',
      'Articles: <a href="https://medium.com/@adharvkt" target="_blank" rel="noopener">medium.com/@adharvkt</a>',
    ]),
    contact: () => {
      rows(['Scroll to the contact form below, or find me here:']);
      links().forEach((h) => print(`  <a href="${esc(h)}" target="_blank" rel="noopener">${esc(h)}</a>`));
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    },
    neofetch: () => rows([
      '<span class="ok">  ___  _  __ _____</span>    <span class="hl">adharv</span>@<span class="hl">portfolio</span>',
      '<span class="ok"> / _ \\| |/ /|_   _|</span>   -----------------------',
      '<span class="ok">/ /_\\ \\ \' /   | |</span>     <span class="hl">Role</span>:     Threat Detection',
      '<span class="ok">|  _  | . \\   | |</span>     <span class="hl">Focus</span>:    OSINT / SOC / Web3',
      '<span class="ok">|_| |_|_|\\_\\  |_|</span>     <span class="hl">Rank</span>:     TryHackMe top 1%',
      "                          <span class=\"hl\">Shell</span>:    adharv-sh",
      "                          <span class=\"hl\">Theme</span>:    " + (document.documentElement.style.getPropertyValue("--ac1") ? "custom" : "matrix"),
    ]),
    ls: () => print("whoami  skills  experience  education  projects  achievements  blog  contact  resume.pdf"),
    "cat resume.pdf": () => { print("Opening resume.pdf ..."); window.open("ADCV.pdf", "_blank"); },
    resume: () => COMMANDS["cat resume.pdf"](),
    matrix: () => { print("Wake up, Neo ...", "ok"); startMatrix(); },
    date: () => print(new Date().toString()),
    "sudo hire-me": () => {
      print("[sudo] password for recruiter: ********", "dim");
      setTimeout(() => { print("Access granted. Opening contact form ...", "ok"); document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); }, 500);
    },
    "rm -rf /": () => print("rm: it is dangerous to operate recursively on '/'. Nice try, though.", "warn"),
    exit: () => print("There is no escape. Try 'clear'.", "dim"),
  };

  function run(raw) {
    const cmd = raw.trim();
    print(`<span class="ok">adharv@portfolio:~$</span> <span class="cmd">${esc(cmd)}</span>`);
    if (!cmd) return;
    hist.push(cmd); hi = hist.length;
    const lower = cmd.toLowerCase();
    if (lower === "clear") { body.innerHTML = ""; return; }
    if (lower.startsWith("echo ")) { print(esc(cmd.slice(5))); return; }
    if (lower.startsWith("theme")) {
      const name = lower.split(/\s+/)[1];
      if (setPalette(name)) print(`Theme set to <span class="hl">${esc(name)}</span>.`);
      else print("Usage: theme matrix | ocean | violet | sunset", "warn");
      return;
    }
    if (COMMANDS[lower]) { COMMANDS[lower](); return; }
    print(`command not found: ${esc(cmd.split(" ")[0])}. Type <span class="hl">help</span>.`, "err");
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { run(input.value); input.value = ""; }
    else if (e.key === "ArrowUp") { if (hi > 0) { hi--; input.value = hist[hi]; } e.preventDefault(); }
    else if (e.key === "ArrowDown") { if (hi < hist.length - 1) { hi++; input.value = hist[hi]; } else { hi = hist.length; input.value = ""; } e.preventDefault(); }
    else if (e.key === "Tab") {
      e.preventDefault();
      const m = Object.keys(COMMANDS).filter((k) => k.startsWith(input.value.toLowerCase()));
      if (m.length === 1) input.value = m[0];
    }
    e.stopPropagation();   // keep Konami listener and others out of typing
  });
  document.querySelectorAll("#term-quick [data-cmd]").forEach((b) => b.addEventListener("click", () => run(b.dataset.cmd)));
  document.getElementById("term").addEventListener("click", () => input.focus({ preventScroll: true }));

  print('<span class="ok">adharv-sh v2.0</span> - type <span class="hl">help</span> to see what I can do.');
  // auto-demo when the terminal first scrolls into view
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      let i = 0; const demo = "whoami";
      const t = setInterval(() => {
        if (document.activeElement === input && input.value) { clearInterval(t); return; }
        input.value = demo.slice(0, ++i);
        if (i === demo.length) { clearInterval(t); setTimeout(() => { if (input.value === demo) { run(demo); input.value = ""; } }, 350); }
      }, 110);
    }, { threshold: 0.6 });
    io.observe(document.getElementById("term"));
  }
}

function setupServiceFilters() {
  const pills = document.querySelectorAll("#svc-filters .pill");
  const cards = document.querySelectorAll("#svc-grid .svc");
  pills.forEach((pill) =>
    pill.addEventListener("click", () => {
      pills.forEach((x) => x.classList.remove("active"));
      pill.classList.add("active");
      const c = pill.dataset.c;
      cards.forEach((card) => {
        const show = c === "all" || card.dataset.cat === c;
        card.classList.toggle("is-hidden", !show);
        if (show) card.classList.add("in");
      });
    })
  );
}

document.addEventListener("DOMContentLoaded", setupBoot);

// Everything that needs the page to be ready
window.onload = () => {
  document.body.classList.add("active"); // Ensures the theme toggler works on first click
  renderPublished(); // posts written for company platforms
  fetchMediumBlogs(); // Medium posts, loaded automatically
  observeReveals();
  setupCounters();
  setupScrollSpy();
  setupLightbox();
  readAccent();
  setupPalette();
  setupExtras();
  observeReveals();
  setupNetwork();
  setupCardFx();
  setupOrbit();
  setupServiceFilters();
  setupTerminal();
  setupKonami();
};

console.log("JavaScript loaded successfully.");
