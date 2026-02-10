/* =========================================================
   MAIN.JS (UNICO FILE)
   - Inject header/footer partials
   - Lang switch dinamico + active nav
   - Init di tutte le interazioni dopo injection
========================================================= */

/* ---------- UTIL: TRIM CONTENUTO DOPO TAG DI CHIUSURA ---------- */
function trimAfterClosingTag(html, tagName) {
  const close = `</${tagName}>`;
  const lower = html.toLowerCase();
  const idx = lower.lastIndexOf(close);
  if (idx === -1) return html; // se non lo trova, lasciamo (debug)
  return html.slice(0, idx + close.length);
}

/* ---------- PARTIALS / INCLUDES ---------- */

async function loadPartial(selector, url, { trimTag = null } = {}) {
  const host = document.querySelector(selector);
  if (!host) return false;

  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    let html = await res.text();
    if (!html.trim()) throw new Error("Partial vuoto");

    // ✅ CORREZIONE: tronca tutto ciò che sta DOPO </header> o </footer>
    // (utile se il server/qualcosa appende roba indesiderata ai file)
    if (trimTag) {
      html = trimAfterClosingTag(html, trimTag);
    }

    // parsing sicuro in template
    const tpl = document.createElement("template");
    tpl.innerHTML = html;

    host.replaceChildren(tpl.content.cloneNode(true));
    return true;
  } catch (e) {
    console.warn("[partials] Non caricato:", url, e);
    host.innerHTML = `<div style="padding:12px;color:#fff;background:#b00000;font-family:system-ui">
      Partial non caricato: <b>${url}</b><br>${String(e)}
    </div>`;
    return false;
  }
}

function normalizePath(p) {
  if (!p) return "/";
  if (!p.startsWith("/")) p = "/" + p;
  return p.replace(/\/{2,}/g, "/");
}
function ensureTrailingSlash(p) {
  return p.endsWith("/") ? p : p + "/";
}

function computeAltLangPath(currentPathname) {
  let path = normalizePath(currentPathname);
  path = path.replace(/\/index\.html$/i, "/");

  const isEN = path.startsWith("/en/");
  if (isEN) path = path.replace(/^\/en\//, "/"); // EN -> IT
  else path = "/en" + path;                     // IT -> EN

  path = ensureTrailingSlash(normalizePath(path));
  return { isEN, path };
}

function setupLangSwitch() {
  const a = document.querySelector("[data-lang-switch]");
  if (!a) return;

  const label = a.querySelector(".lang-label");
  const { isEN, path: target } = computeAltLangPath(location.pathname);

  a.href = target;
  if (label) label.textContent = isEN ? "Italiano" : "English";
}

function setActiveNav() {
  const here = ensureTrailingSlash(
    normalizePath(location.pathname.replace(/\/index\.html$/i, "/"))
  );

  document.querySelectorAll("a[data-nav]").forEach((a) => {
    const hrefRaw = a.getAttribute("href");
    if (!hrefRaw) return;

    // ignora link esterni / ancore / mailto / tel
    if (
      /^(https?:)?\/\//i.test(hrefRaw) ||
      hrefRaw.startsWith("#") ||
      hrefRaw.startsWith("mailto:") ||
      hrefRaw.startsWith("tel:")
    ) return;

    const href = ensureTrailingSlash(
      normalizePath(hrefRaw.replace(/\/index\.html$/i, "/"))
    );

    if (href === here) a.classList.add("is-active");
  });
}

function getBasePath() {
  const baseTag = document.querySelector("base");
  if (baseTag && baseTag.getAttribute("href")) {
    return baseTag.getAttribute("href").replace(/\/$/, "");
  }
  return "";
}

async function initPartials() {
  const BASE = getBasePath();
  const isEN = location.pathname.startsWith("/en/");

  // ✅ carica header/footer (con trim del tag corretto)
  await loadPartial(
    "#site-header",
    isEN ? `${BASE}/assets/partials/header-en.html`
         : `${BASE}/assets/partials/header-it.html`,
    { trimTag: "header" }
  );

  await loadPartial(
    "#site-footer",
    isEN ? `${BASE}/assets/partials/footer-en.html`
         : `${BASE}/assets/partials/footer-it.html`,
    { trimTag: "footer" }
  );

  setupLangSwitch();
  setActiveNav();
}

/* ---------- SITE INTERACTIONS (IL TUO JS) ---------- */

function initSiteInteractions() {
  /* ===== Off-canvas controls ===== */
  const btn = document.getElementById("menuBtn");
  const panel = document.getElementById("offcanvas");
  const closeBtn = document.getElementById("menuClose");
  const backdrop = document.getElementById("backdrop");

  const openMenu = () => {
    if (!panel || !btn || !backdrop) return;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
    backdrop.classList.add("open");
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    if (!panel || !btn || !backdrop) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
    backdrop.classList.remove("open");
    setTimeout(() => { backdrop.hidden = true; }, 250);
    document.body.style.overflow = "";
  };

  // submenu toggle
  document.querySelectorAll("[data-sub]").forEach((subBtn) => {
    subBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const li = subBtn.closest(".menu-item.has-sub");
      if (!li) return;

      const isOpen = li.classList.contains("open");
      li.classList.toggle("open", !isOpen);
      subBtn.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  // reset submenu (on init)
  document.querySelectorAll(".menu-item.has-sub").forEach((li) => {
    li.classList.remove("open");
    const b = li.querySelector("[data-sub]");
    if (b) b.setAttribute("aria-expanded", "false");
  });

  // close submenu + menu when clicking a link
  if (panel) {
    panel.querySelectorAll("a[href]").forEach((a) => {
      a.addEventListener("click", () => {
        document.querySelectorAll(".menu-item.has-sub.open").forEach((li) => {
          li.classList.remove("open");
          const b = li.querySelector("[data-sub]");
          if (b) b.setAttribute("aria-expanded", "false");
        });
        closeMenu();
      });
    });
  }

  // bind open/close
  if (btn && panel && closeBtn && backdrop) {
    btn.addEventListener("click", () =>
      panel.classList.contains("open") ? closeMenu() : openMenu()
    );
    closeBtn.addEventListener("click", closeMenu);
    backdrop.addEventListener("click", closeMenu);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }

  /* ===== Header hide/show + stato scrolled ===== */
  const header = document.querySelector(".site-header");
  if (header) {
    let lastY = window.scrollY, ticking = false;
    function onScroll() {
      const y = window.scrollY;
      if (y > 4) header.classList.add("scrolled"); else header.classList.remove("scrolled");
      if (y > lastY && y > 120) header.classList.add("hidden");
      else header.classList.remove("hidden");
      lastY = y; ticking = false;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  }

  /* ===== Autoplay video hero (Safari friendly) ===== */
  (() => {
    const v = document.getElementById("bgVideo");
    if (!v) return;

    v.muted = true;
    v.playsInline = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("autoplay", "");

    const tryPlay = () => v.play().catch(() => {});
    window.addEventListener("load", () => setTimeout(tryPlay, 80));

    const unlock = () => {
      tryPlay();
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("click", unlock, { passive: true });
  })();

  /* ===== Showcase interactions ===== */
  const vLeft = document.getElementById("hoverVideoLeft");
  const tileLeft = vLeft ? vLeft.closest(".tile-left") : null;
  if (tileLeft && vLeft) {
    tileLeft.addEventListener("mouseenter", () => { vLeft.play().catch(() => {}); });
    tileLeft.addEventListener("mouseleave", () => { vLeft.pause(); vLeft.currentTime = 0; });
    tileLeft.addEventListener("click", () => {
      if (vLeft.paused) vLeft.play().catch(() => {});
      else { vLeft.pause(); vLeft.currentTime = 0; }
    });
  }

  // evita id duplicati. Gestisce tutte le tile-right.
  document.querySelectorAll(".tile.tile-right").forEach((tileRight) => {
    const vRight = tileRight.querySelector("#hoverVideoRight"); // se esiste
    let hoverTimer = null;
    let videoSrcSet = false;

    function startRight() {
      hoverTimer = setTimeout(() => {
        if (!vRight) return;
        if (!videoSrcSet) {
          vRight.innerHTML = '<source src="video/catalogo.mp4" type="video/mp4">';
          videoSrcSet = true;
        }
        tileRight.classList.add("playing");
        vRight.currentTime = 0;
        vRight.play().catch(() => {});
      }, 1000);
    }

    function stopRight() {
      if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
      if (vRight) { vRight.pause(); vRight.currentTime = 0; }
      tileRight.classList.remove("playing");
    }

    tileRight.addEventListener("mouseenter", startRight);
    tileRight.addEventListener("mouseleave", stopRight);
    tileRight.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      if (tileRight.classList.contains("playing")) stopRight();
      else startRight();
    });
  });

  /* ===== NEWS: slider loop ===== */
  (() => {
    const track = document.querySelector(".news-track");
    const prevBtn = document.querySelector(".news-prev");
    const nextBtn = document.querySelector(".news-next");
    if (!track || !prevBtn || !nextBtn) return;

    let step = 0;
    let transitioning = false;

    const getGapPx = () => {
      const cs = getComputedStyle(track);
      return parseFloat(cs.columnGap || cs.gap || "12") || 12;
    };

    const computeStep = () => {
      const first = track.children[0];
      if (!first) return;
      step = first.getBoundingClientRect().width + getGapPx();
    };

    const setX = (x) => { track.style.transform = `translate3d(${x}px,0,0)`; };

    const waitTransitionEnd = (ms = 600) => new Promise((resolve) => {
      let done = false;
      const finish = () => { if (done) return; done = true; resolve(); };
      const t = setTimeout(finish, ms);

      const handler = (e) => {
        if (e.target !== track) return;
        if (e.propertyName !== "transform") return;
        clearTimeout(t);
        track.removeEventListener("transitionend", handler);
        finish();
      };
      track.addEventListener("transitionend", handler);
    });

    const disableTransition = () => { track.style.transition = "none"; };
    const enableTransition  = () => { track.style.transition = "transform .35s cubic-bezier(.22,.61,.36,1)"; };

    const normalize = async () => {
      disableTransition();
      setX(0);
      void track.offsetHeight;
      enableTransition();
    };

    const slideNext = async () => {
      if (transitioning) return;
      transitioning = true;

      enableTransition();
      setX(-step);
      await waitTransitionEnd();

      disableTransition();
      const first = track.firstElementChild;
      if (first) track.appendChild(first);
      setX(0);
      void track.offsetHeight;
      enableTransition();

      transitioning = false;
    };

    const slidePrev = async () => {
      if (transitioning) return;
      transitioning = true;

      disableTransition();
      const last = track.lastElementChild;
      if (last) track.insertBefore(last, track.firstElementChild);
      setX(-step);
      void track.offsetHeight;

      enableTransition();
      setX(0);
      await waitTransitionEnd();

      transitioning = false;
    };

    nextBtn.addEventListener("click", slideNext);
    prevBtn.addEventListener("click", slidePrev);

    const init = async () => { computeStep(); await normalize(); };

    if (document.readyState === "complete") init();
    else window.addEventListener("load", init);

    window.addEventListener("resize", async () => {
      computeStep();
      await normalize();
    });
  })();

  /* ===== Lightbox per immagini news ===== */
  (() => {
    const imgs = document.querySelectorAll(".news-card img");
    if (!imgs.length) return;

    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `
      <button class="close" aria-label="Chiudi">×</button>
      <img alt="">
    `;
    document.body.appendChild(lb);

    const lbImg = lb.querySelector("img");
    const closeBtn = lb.querySelector(".close");

    const open = (src, alt = "") => {
      lbImg.src = src;
      lbImg.alt = alt;
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    };

    const close = () => {
      lb.classList.remove("open");
      lbImg.src = "";
      document.body.style.overflow = "";
    };

    imgs.forEach((img) => img.addEventListener("click", () => open(img.src, img.alt)));
    closeBtn.addEventListener("click", close);
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  })();
}

/* ---------- BOOT ---------- */

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ lock anti doppio avvio (se per errore includi lo script due volte)
  if (window.__DEKO_INIT__) return;
  window.__DEKO_INIT__ = true;

  await initPartials();
  initSiteInteractions();
});
