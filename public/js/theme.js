/* ===================================================
   ChargeIt Hotel — Theme Management
   =================================================== */

function getCurrentTheme() {
  var oldTheme = localStorage.getItem("minibar-theme");
  if (oldTheme && !localStorage.getItem("chargeit-theme")) {
    localStorage.setItem("chargeit-theme", oldTheme);
    localStorage.removeItem("minibar-theme");
  }
  return localStorage.getItem("chargeit-theme") || "light";
}

function setTheme(theme) {
  theme = theme || "light";
  localStorage.setItem("chargeit-theme", theme);
  document.documentElement.setAttribute("data-theme", theme);

  document.querySelectorAll(".theme-switcher-btn, .theme-toggle-btn").forEach((btn) => {
    const btnMode = btn.getAttribute("data-theme-mode");
    if (!btnMode) return;
    const isActive = btnMode === theme;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive);
  });

  document.querySelectorAll(".theme-option").forEach((opt) => {
    opt.classList.toggle("active", opt.dataset.themeValue === theme);
  });

  updateThemeMeta(theme);
}

function toggleTheme() {
  const current = getCurrentTheme();
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
}

function updateThemeMeta(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const color = theme === "dark" ? "#101816" : "#F7F4EE";
    meta.setAttribute("content", color);
  }
}

function initTheme() {
  const savedTheme = getCurrentTheme();
  setTheme(savedTheme);
}

function setupThemeSwitcher(container) {
  if (!container) return;
  const btns = container.querySelectorAll(".theme-switcher-btn, .theme-toggle-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-theme-mode");
      setTheme(mode);
    });
  });

  const toggleBtn = container.querySelector(".theme-switcher-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleTheme);
  }
}

/* ── Auto-switch theme by time ── */
function getAutoTheme() {
  if (!localStorage.getItem("chargeit-autoswitch")) return null;
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 19) ? "light" : "dark";
}

function applyAutoTheme() {
  const auto = getAutoTheme();
  if (auto) setTheme(auto);
}

function toggleAutoSwitch(enable) {
  if (enable) {
    // Save current manual theme before auto-switch takes over
    localStorage.setItem("chargeit-theme-manual", getCurrentTheme());
    localStorage.setItem("chargeit-autoswitch", "1");
    applyAutoTheme();
  } else {
    localStorage.removeItem("chargeit-autoswitch");
    // Restore the manual theme that was saved before enabling
    var manual = localStorage.getItem("chargeit-theme-manual");
    if (manual) {
      localStorage.removeItem("chargeit-theme-manual");
      setTheme(manual);
    }
  }
}

function isAutoSwitchEnabled() {
  return !!localStorage.getItem("chargeit-autoswitch");
}

// Run autoswitch every minute
setInterval(applyAutoTheme, 60000);

/* ── Font-size controls ── */
function getFontSize() {
  return localStorage.getItem("chargeit-font-size") || "medium";
}

function setFontSize(size) {
  if (!["small", "medium", "large"].includes(size)) size = "medium";
  localStorage.setItem("chargeit-font-size", size);
  document.documentElement.setAttribute("data-font-size", size);

  document.querySelectorAll(".font-size-option").forEach((opt) => {
    opt.classList.toggle("active", opt.dataset.fontSize === size);
  });
}

function initFontSize() {
  const saved = getFontSize();
  setFontSize(saved);
}
