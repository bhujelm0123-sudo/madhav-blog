/*
 * Shared EN / NE language switcher for Madhav Bhujel's blog.
 * Add <script src="/language-switcher.js" defer></script> to every standalone
 * article HTML page, just before </body>. The script inserts the toggle,
 * configures the hidden GTranslate widget, and remembers the visitor's choice
 * across pages on blog.madhavbhujel.com.np.
 */
(function () {
  "use strict";

  const LANGUAGE_COOKIE = "mb-language";
  const TRANSLATE_COOKIE = "googtrans";
  const TRANSLATOR_URL = "https://cdn.gtranslate.net/widgets/latest/dropdown.js";
  const STYLE_ID = "mb-language-switcher-style";
  const MOUNT_ID = "gtranslate-mount";
  const BUTTON_ID = "mb-language-toggle";
  const DOMAIN = location.hostname.endsWith("madhavbhujel.com.np")
    ? ".madhavbhujel.com.np"
    : "";

  function readCookie(name) {
    const prefix = name + "=";
    const item = document.cookie.split(";").map(value => value.trim())
      .find(value => value.startsWith(prefix));
    return item ? decodeURIComponent(item.slice(prefix.length)) : "";
  }

  function writeCookie(name, value) {
    const base = name + "=" + encodeURIComponent(value) + "; path=/; max-age=31536000; SameSite=Lax";
    document.cookie = base;
    if (DOMAIN) document.cookie = base + "; domain=" + DOMAIN;
  }

  function eraseCookie(name) {
    const expired = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
    document.cookie = expired;
    if (DOMAIN) document.cookie = expired + "; domain=" + DOMAIN;
  }

  function originalLanguage() {
    const declared = (document.documentElement.dataset.originalLanguage ||
      document.documentElement.getAttribute("lang") || "en").toLowerCase();
    return declared.startsWith("ne") ? "ne" : "en";
  }

  function preferredLanguage(sourceLanguage) {
    const saved = readCookie(LANGUAGE_COOKIE).toLowerCase();
    return saved === "en" || saved === "ne" ? saved : sourceLanguage;
  }

  function setTranslatorCookie(source, target) {
    if (source === target) {
      eraseCookie(TRANSLATE_COOKIE);
    } else {
      writeCookie(TRANSLATE_COOKIE, "/" + source + "/" + target);
    }
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mb-language-slot { display:inline-flex; align-items:center; gap:8px; flex:0 0 auto; }
      .mb-language-toggle {
        position:relative; display:grid; grid-template-columns:1fr 1fr; align-items:center;
        width:78px; height:38px; min-height:38px; padding:0; overflow:hidden;
        border:1px solid #c6c7ca; border-radius:999px; background:#c6c7ca;
        color:#f7f7f8; font:800 11px/1 Arial,sans-serif; letter-spacing:.02em;
        cursor:pointer; -webkit-tap-highlight-color:transparent;
        transition:background .2s ease,border-color .2s ease;
      }
      .mb-language-toggle::before {
        content:""; position:absolute; z-index:0; top:3px; left:3px;
        width:calc(50% - 4px); height:calc(100% - 6px); border-radius:999px;
        background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.16);
        transform:translateX(0); transition:transform .22s cubic-bezier(.2,.75,.25,1);
      }
      .mb-language-toggle[data-current-language="ne"]::before { transform:translateX(calc(100% + 4px)); }
      .mb-language-toggle .mb-language-choice {
        position:relative; z-index:1; display:grid; min-width:0; height:100%;
        place-items:center; color:#f7f7f8; user-select:none;
      }
      .mb-language-toggle[data-current-language="en"] .mb-language-en,
      .mb-language-toggle[data-current-language="ne"] .mb-language-ne { color:#29313a; }
      .mb-language-toggle:hover { filter:brightness(.98); }
      .mb-language-toggle:focus-visible { outline:3px solid #94641e; outline-offset:4px; }
      .mb-language-toggle:active::before { transform:scale(.94); }
      .mb-language-toggle[data-current-language="ne"]:active::before { transform:translateX(calc(100% + 4px)) scale(.94); }
      [data-theme="dark"] .mb-language-toggle { border-color:#58636d; background:#58636d; }
      [data-theme="dark"] .mb-language-toggle[data-current-language="en"] .mb-language-en,
      [data-theme="dark"] .mb-language-toggle[data-current-language="ne"] .mb-language-ne { color:#202b34; }
      .mb-gtranslate-host {
        position:fixed !important; left:-10000px !important; top:0 !important;
        width:1px !important; height:1px !important; overflow:hidden !important;
        opacity:0 !important; pointer-events:none !important;
      }
      @media(max-width:540px) { .mb-language-toggle { width:72px; height:36px; min-height:36px; font-size:10px; } }
      @media(prefers-reduced-motion:reduce) { .mb-language-toggle, .mb-language-toggle::before { transition:none !important; } }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function makeButton() {
    const existing = document.getElementById(BUTTON_ID) || document.getElementById("language-toggle");
    const button = existing || document.createElement("button");
    button.type = "button";
    button.id = BUTTON_ID;
    button.classList.add("mb-language-toggle");
    button.setAttribute("role", "switch");
    button.setAttribute("aria-checked", "false");
    button.setAttribute("translate", "no");
    if (!button.querySelector(".mb-language-en")) {
      button.innerHTML = '<span class="mb-language-choice mb-language-en" lang="en">EN</span>' +
        '<span class="mb-language-choice mb-language-ne" lang="ne">NE</span>';
    }
    return button;
  }

  function placeButton(button) {
    if (button.isConnected) return;

    const controls = document.querySelector(
      ".controls, .header-controls, .header-actions, .top-controls"
    );
    if (controls) {
      const themeControl = controls.querySelector(
        "#theme-button, .theme-toggle, #theme-toggle, [aria-label*='theme' i]"
      );
      controls.insertBefore(button, themeControl || null);
      return;
    }

    const header = document.querySelector(".header-inner, header .container, header");
    if (header) {
      const themeControl = header.querySelector(
        "#theme-button, .theme-toggle, #theme-toggle, [aria-label*='theme' i]"
      );
      if (themeControl && themeControl.parentElement) {
        const parent = themeControl.parentElement;
        parent.classList.add("mb-language-slot");
        parent.insertBefore(button, themeControl);
      } else {
        const slot = document.createElement("div");
        slot.className = "mb-language-slot";
        slot.appendChild(button);
        header.appendChild(slot);
      }
      return;
    }

    // Last-resort placement for article layouts without a recognizable header.
    const slot = document.createElement("div");
    slot.className = "mb-language-slot";
    slot.style.cssText = "position:fixed;top:14px;right:16px;z-index:99999;";
    slot.appendChild(button);
    document.body.appendChild(slot);
  }

  function ensureMount() {
    let mount = document.getElementById(MOUNT_ID);
    if (!mount) {
      mount = document.createElement("div");
      mount.id = MOUNT_ID;
      mount.className = "gtranslate_wrapper mb-gtranslate-host";
      mount.setAttribute("aria-hidden", "true");
      (document.body || document.documentElement).appendChild(mount);
    } else {
      mount.classList.add("gtranslate_wrapper", "mb-gtranslate-host");
    }
    return mount;
  }

  function configureTranslator(source) {
    window.gtranslateSettings = {
      default_language: source,
      languages: ["en", "ne"],
      wrapper_selector: "#" + MOUNT_ID
    };

    if (!document.querySelector('script[data-mb-gtranslate-loader="true"]') &&
        !Array.from(document.scripts).some(script => script.src.includes("cdn.gtranslate.net/widgets/latest/dropdown.js"))) {
      const script = document.createElement("script");
      script.src = TRANSLATOR_URL;
      script.async = true;
      script.dataset.mbGtranslateLoader = "true";
      document.head.appendChild(script);
    }
  }

  function optionForLanguage(select, source, target) {
    return Array.from(select.options).find(option => {
      const value = (option.value || "").toLowerCase();
      const text = (option.textContent || "").trim().toLowerCase();
      const parts = value.split("|");
      return value === source + "|" + target || parts[parts.length - 1] === target ||
        (target === "ne" && (text.includes("nepali") || text.includes("नेपाली"))) ||
        (target === "en" && text.includes("english"));
    });
  }

  function activateTranslation(source, target, reloadIfUnavailable) {
    if (source === target) {
      location.reload();
      return;
    }

    if (typeof window.doGTranslate === "function") {
      try {
        window.doGTranslate(source + "|" + target);
        return;
      } catch (error) { /* Try the widget selector below. */ }
    }

    const mount = document.getElementById(MOUNT_ID);
    const select = mount && mount.querySelector("select");
    const option = select && optionForLanguage(select, source, target);
    if (select && option) {
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    if (reloadIfUnavailable) location.reload();
  }

  function updateButton(button, target) {
    const isNepali = target === "ne";
    button.dataset.currentLanguage = target;
    button.setAttribute("aria-checked", String(isNepali));
    const targetName = isNepali ? "English" : "Nepali";
    button.setAttribute("aria-label", "Switch language to " + targetName);
    button.setAttribute("title", "Switch language to " + targetName);
  }

  function init() {
    injectStyles();

    const source = originalLanguage();
    let target = preferredLanguage(source);
    setTranslatorCookie(source, target);

    const button = makeButton();
    placeButton(button);
    updateButton(button, target);

    if (!button.dataset.mbLanguageBound) {
      button.dataset.mbLanguageBound = "true";
      button.addEventListener("click", function () {
        const next = target === "ne" ? "en" : "ne";
        target = next;
        writeCookie(LANGUAGE_COOKIE, next);
        setTranslatorCookie(source, next);
        updateButton(button, next);
        activateTranslation(source, next, true);
      });
    }

    ensureMount();
    configureTranslator(source);

    // Reapply a saved preference after the translator has initialized.
    if (target !== source) {
      let attempts = 0;
      const retry = function () {
        attempts += 1;
        if (typeof window.doGTranslate === "function") {
          activateTranslation(source, target, false);
        } else if (attempts < 12) {
          window.setTimeout(retry, 250);
        }
      };
      window.setTimeout(retry, 300);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
