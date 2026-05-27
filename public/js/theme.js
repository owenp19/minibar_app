/* ===================================================
   ChargeIt Hotel — Theme Management
   =================================================== */

function getCurrentTheme() {
  // Migrate from old key
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
