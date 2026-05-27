/* ===================================================
   ChargeIt Hotel — i18n Translation System
   =================================================== */

const translations = {
  es: {
    appName: "ChargeIt Hotel",
    appShort: "ChargeIt",
    hotelName: "Nattivo Collection Hotel",

    /* Login */
    loginTitle: "Iniciar sesión",
    loginSubtitle: "Ingresa con tu correo corporativo y contraseña.",
    loginEmail: "Correo electrónico",
    loginEmailPlaceholder: "operador@nattivo.com",
    loginPassword: "Contraseña",
    loginPasswordPlaceholder: "••••••••",
    loginRemember: "Recordarme",
    loginForgot: "¿Olvidaste tu contraseña?",
    loginButton: "Ingresar",
    loginNoAccount: "¿No tienes cuenta?",
    loginCreateAccount: "Crear cuenta",
    loginLoading: "Iniciando sesión en el minibar…",
    loginError: "Error al iniciar sesión. Inténtalo de nuevo.",
    loginConnectionError: "Ocurrió un error al iniciar sesión. Verifica tu conexión.",
    loginSuccess: "Inicio de sesión exitoso. Redirigiendo…",

    /* Register */
    registerTitle: "Crear cuenta",
    registerSubtitle: "Regístrate para gestionar el minibar del hotel.",
    registerName: "Nombre completo",
    registerNamePlaceholder: "Ej: Juan Pérez",
    registerEmail: "Correo electrónico",
    registerEmailPlaceholder: "operador@nattivo.com",
    registerPassword: "Contraseña",
    registerPasswordPlaceholder: "Mínimo 6 caracteres",
    registerConfirm: "Confirmar contraseña",
    registerConfirmPlaceholder: "Repite la contraseña",
    registerButton: "Crear cuenta",
    registerHasAccount: "¿Ya tienes cuenta?",
    registerLogin: "Iniciar sesión",
    registerLoading: "Creando tu cuenta…",
    registerPasswordMismatch: "Las contraseñas no coinciden.",
    registerPasswordLength: "La contraseña debe tener al menos 6 caracteres.",
    registerError: "Error al crear la cuenta. Inténtalo de nuevo.",
    registerSuccess: "Cuenta creada con éxito. Redirigiendo…",
    registerConnectionError: "Ocurrió un error. Verifica tu conexión.",

    /* Sidebar */
    navMinibars: "Minibares",
    navAdmin: "Admin",
    navUnlock: "Desbloqueo",
    navProfile: "Perfil",
    navSettings: "Configuración",
    navLogout: "Cerrar sesión",

    /* Main - Minibar Module */
    minibarTitle: "Gestión de Minibar",
    minibarDesc: "Selecciona un piso para ver sus habitaciones y gestionar el minibar.",
    minibarSelectFloor: "Seleccionar piso",
    minibarSelectFloorDesc: "Elige el piso donde se encuentra la habitación.",
    minibarRooms: "Habitaciones",
    minibarRoomsDesc: "Selecciona una habitación para gestionar su minibar.",
    minibarRoomDetail: "Detalle de habitación",
    minibarBackToFloors: "Volver a pisos",
    minibarBackToRooms: "Volver a habitaciones",
    minibarRefresh: "Actualizar",
    minibarTabInventory: "Inventario",
    minibarTabConsumption: "Registrar consumo",
    minibarTabRestock: "Reponer productos",
    minibarTabAdjust: "Ajuste manual",
    minibarTabHistory: "Historial",
    minibarTabReports: "Reportes",
    minibarConsTotal: "Total consumo:",
    minibarConsSave: "Guardar consumo",
    minibarConsSaveSend: "Guardar y enviar a recepción",
    minibarRestockDesc: "Selecciona los productos que deseas reponer y la cantidad a agregar al inventario.",
    minibarRestockSave: "Guardar reposición",
    minibarAdjustDesc: "Corrige manualmente las cantidades de los productos cuando sea necesario.",
    minibarAdjustSave: "Guardar ajuste",
    minibarAdjustHint: "Nueva cantidad",
    minibarReportFrom: "Desde",
    minibarReportTo: "Hasta",
    minibarReportGenerate: "Generar reporte",
    minibarReportPDF: "Exportar PDF",
    minibarNoFloors: "No hay pisos disponibles.",
    minibarNoRooms: "No hay habitaciones registradas en este piso.",
    minibarNoProducts: "No hay productos registrados para esta habitación.",
    minibarOutOfStock: "Agotado",

    /* KPI */
    kpiRoom: "Habitación",
    kpiItems: "Items",
    kpiTotal: "Total",
    kpiLastAction: "Última acción",

    /* Minibares */


    /* Unlock */
    unlockTitle: "Desbloqueo de habitación",
    unlockDesc: "Selecciona una o varias habitaciones y genera el mensaje para WhatsApp.",
    unlockSelectRooms: "Selección de habitaciones",
    unlockSelectRoomsDesc: "Puedes seleccionar múltiples habitaciones.",
    unlockRooms: "Habitaciones",
    unlockNote: "Nota (opcional)",
    unlockNotePlaceholder: "Ej: Favor desbloquear folio por mantenimiento.",
    unlockPreview: "Vista previa",
    unlockCopy: "Copiar",
    unlockSend: "Enviar por WhatsApp",
    unlockRefresh: "Recargar",
    unlockSelectAll: "Seleccionar todas",
    unlockClear: "Limpiar",
    unlockSummary: "Resumen",
    unlockSummaryDesc: "Se genera con fecha y hora.",
    unlockWhatsappHint: "Si el número está vacío, WhatsApp te deja elegir el contacto.",
    unlockNoRooms: "Selecciona una o varias habitaciones antes de enviar.",
    unlockReady: "Mensaje listo para enviar en WhatsApp.",
    unlockCopied: "Mensaje copiado al portapapeles.",
    unlockCopyError: "No se pudo copiar el mensaje.",
    unlockMultiTip: "Tip: En Windows usa Ctrl para seleccionar varias. En Mac usa Cmd.",
    unlockSelectRoom: "Selecciona una o varias habitaciones.",

    /* Profile */
    profileTitle: "Perfil",
    profileDesc: "Gestiona tu información personal y foto de perfil.",
    profilePhoto: "Foto de perfil",
    profileChangePhoto: "Cambiar foto",
    profileName: "Nombre completo",
    profileNamePlaceholder: "Tu nombre completo",
    profileEmail: "Correo electrónico",
    profileEmailPlaceholder: "correo@ejemplo.com",
    profilePhone: "Teléfono",
    profilePhonePlaceholder: "+57 300 123 4567",
    profileSave: "Guardar cambios",
    profileSaving: "Guardando…",
    profileSaved: "Datos actualizados correctamente.",
    profileError: "Error al guardar los datos. Inténtalo de nuevo.",
    profilePhotoSaved: "Foto actualizada correctamente.",
    profilePhotoError: "Error al subir la foto. Intenta de nuevo.",
    profileRole: "Rol",

    /* Settings */
    settingsTitle: "Configuración",
    settingsDesc: "Personaliza la apariencia y consulta la información del sistema.",
    settingsTheme: "Tema",
    settingsThemeDesc: "Selecciona el tema visual de la aplicación.",
    settingsThemeDark: "Oscuro",
    settingsThemeDarkDesc: "Modo nocturno, ideal para poca luz",
    settingsThemeLight: "Claro",
    settingsThemeLightDesc: "Modo diurno, alta legibilidad",
    settingsSystemInfo: "Información del sistema",
    settingsSystemInfoDesc: "Versión y estado actual.",
    settingsVersion: "Versión",
    settingsDatabase: "Base de datos",
    settingsEnvironment: "Entorno",
    settingsCredentials: "Credenciales de acceso",
    settingsCredentialsDesc: "Usuarios predefinidos para pruebas.",
    settingsUser: "Usuario",
    settingsEmail: "Email",
    settingsPassword: "Contraseña",
    settingsResetHint: "Si olvidaste la contraseña, ejecuta npm run seed para restablecerla.",

    /* Common */
    loading: "Cargando información…",
    loadingInventory: "Preparando inventario…",
    loadingUpdating: "Actualizando datos…",
    loadingSaving: "Guardando cambios…",
    noData: "No hay información disponible",
    error: "Error",
    save: "Guardar",
    cancel: "Cancelar",
    close: "Cerrar",
    send: "Enviar",

    /* Preloader */
    preloaderText: "Cargando experiencia…",

    /* Breadcrumb */
    breadcrumbHome: "Minibar",
    breadcrumbConsumption: "Consumo",
    breadcrumbMinibars: "Minibares",
    breadcrumbSettings: "Configuración",
    breadcrumbUnlock: "Desbloqueo",
    breadcrumbTools: "Herramientas",

    /* Modal */
    modalPreview: "Vista previa del resumen",
    modalPreviewUnlock: "Vista previa del mensaje",
    modalCopy: "Copiar",
    modalSend: "Enviar",
    modalClose: "Cerrar",

    /* Logout */
    logout: "Cerrar sesión",

    /* Admin */
    adminTitle: "Admin – ChargeIt Hotel",
    adminPanel: "Panel de Administración",
    adminDashboard: "Dashboard",
    adminProducts: "Productos",
    adminCategories: "Categorías",
    adminFloors: "Pisos",
    adminRooms: "Habitaciones",
    adminUsers: "Usuarios",
    adminNewProduct: "Nuevo producto",
    adminNewCategory: "Nueva categoría",
    adminNewFloor: "Nuevo piso",
    adminNewRoom: "Nueva habitación",
    adminNewUser: "Nuevo usuario",
    adminSave: "Guardar cambios",
    adminCreate: "Crear",
    adminCancel: "Cancelar",
    adminDelete: "Eliminar",
    adminEdit: "Editar",
    adminActive: "Activo",
    adminInactive: "Inactivo",

    /* Dashboard */
    dashboardTitle: "Dashboard",
    dashboardDesc: "Resumen rápido del estado del minibar.",
    dashboardToday: "Consumo hoy",
    dashboardProductsToday: "Productos hoy",
    dashboardMovementsToday: "Movimientos hoy",
    dashboardWeek: "Semana",
    dashboardRooms: "Habitaciones",
    dashboardLowStock: "Stock bajo",
    dashboardTopProducts: "Productos más consumidos hoy",
    dashboardRecentMovements: "Últimos movimientos",
    dashboardGoToFloors: "Ir a pisos",
    dashboardRefresh: "Actualizar",

    /* Footer */
    footerVersion: "v1.0.1",
    footerDeveloped: "Desarrollado por Owen Pusey — Minibar Hotel Nattivo",
  },

  en: {
    appName: "ChargeIt Hotel",
    appShort: "ChargeIt",
    hotelName: "Nattivo Collection Hotel",

    /* Login */
    loginTitle: "Sign in",
    loginSubtitle: "Enter your corporate email and password.",
    loginEmail: "Email",
    loginEmailPlaceholder: "operador@nattivo.com",
    loginPassword: "Password",
    loginPasswordPlaceholder: "••••••••",
    loginRemember: "Remember me",
    loginForgot: "Forgot your password?",
    loginButton: "Log in",
    loginNoAccount: "Don't have an account?",
    loginCreateAccount: "Create account",
    loginLoading: "Signing in to minibar…",
    loginError: "Error signing in. Try again.",
    loginConnectionError: "An error occurred while signing in. Check your connection.",
    loginSuccess: "Login successful. Redirecting…",

    /* Register */
    registerTitle: "Create account",
    registerSubtitle: "Register to manage the hotel minibar.",
    registerName: "Full name",
    registerNamePlaceholder: "e.g. John Doe",
    registerEmail: "Email",
    registerEmailPlaceholder: "operador@nattivo.com",
    registerPassword: "Password",
    registerPasswordPlaceholder: "Min 6 characters",
    registerConfirm: "Confirm password",
    registerConfirmPlaceholder: "Repeat password",
    registerButton: "Create account",
    registerHasAccount: "Already have an account?",
    registerLogin: "Sign in",
    registerLoading: "Creating your account…",
    registerPasswordMismatch: "Passwords do not match.",
    registerPasswordLength: "Password must be at least 6 characters.",
    registerError: "Error creating account. Try again.",
    registerSuccess: "Account created successfully. Redirecting…",
    registerConnectionError: "An error occurred. Check your connection.",

    /* Sidebar */
    navMinibars: "Minibars",
    navAdmin: "Admin",
    navUnlock: "Unlock",
    navProfile: "Profile",
    navSettings: "Settings",
    navLogout: "Log out",

    /* Main - Minibar Module */
    minibarTitle: "Minibar Management",
    minibarDesc: "Select a floor to view its rooms and manage the minibar.",
    minibarSelectFloor: "Select floor",
    minibarSelectFloorDesc: "Choose the floor where the room is located.",
    minibarRooms: "Rooms",
    minibarRoomsDesc: "Select a room to manage its minibar.",
    minibarRoomDetail: "Room detail",
    minibarBackToFloors: "Back to floors",
    minibarBackToRooms: "Back to rooms",
    minibarRefresh: "Refresh",
    minibarTabInventory: "Inventory",
    minibarTabConsumption: "Register consumption",
    minibarTabRestock: "Restock products",
    minibarTabAdjust: "Manual adjust",
    minibarTabHistory: "History",
    minibarTabReports: "Reports",
    minibarConsTotal: "Total consumption:",
    minibarConsSave: "Save consumption",
    minibarConsSaveSend: "Save and send to reception",
    minibarRestockDesc: "Select the products you want to restock and the quantity to add to inventory.",
    minibarRestockSave: "Save restock",
    minibarAdjustDesc: "Manually correct product quantities when needed.",
    minibarAdjustSave: "Save adjustment",
    minibarAdjustHint: "New quantity",
    minibarReportFrom: "From",
    minibarReportTo: "To",
    minibarReportGenerate: "Generate report",
    minibarReportPDF: "Export PDF",
    minibarNoFloors: "No floors available.",
    minibarNoRooms: "No rooms registered on this floor.",
    minibarNoProducts: "No products registered for this room.",
    minibarOutOfStock: "Out of stock",

    /* KPI */
    kpiRoom: "Room",
    kpiItems: "Items",
    kpiTotal: "Total",
    kpiLastAction: "Last action",

    /* Unlock */
    unlockTitle: "Room Unlock",
    unlockDesc: "Select one or multiple rooms and generate the WhatsApp message.",
    unlockSelectRooms: "Room Selection",
    unlockSelectRoomsDesc: "You can select multiple rooms.",
    unlockRooms: "Rooms",
    unlockNote: "Note (optional)",
    unlockNotePlaceholder: "e.g. Please unlock room for maintenance.",
    unlockPreview: "Preview",
    unlockCopy: "Copy",
    unlockSend: "Send via WhatsApp",
    unlockRefresh: "Refresh",
    unlockSelectAll: "Select all",
    unlockClear: "Clear",
    unlockSummary: "Summary",
    unlockSummaryDesc: "Generated with date and time.",
    unlockWhatsappHint: "If the number is empty, WhatsApp lets you choose the contact.",
    unlockNoRooms: "Select one or more rooms before sending.",
    unlockReady: "Message ready to send on WhatsApp.",
    unlockCopied: "Message copied to clipboard.",
    unlockCopyError: "Could not copy the message.",
    unlockMultiTip: "Tip: On Windows use Ctrl to select multiple. On Mac use Cmd.",
    unlockSelectRoom: "Select one or more rooms.",

    /* Profile */
    profileTitle: "Profile",
    profileDesc: "Manage your personal information and profile photo.",
    profilePhoto: "Profile photo",
    profileChangePhoto: "Change photo",
    profileName: "Full name",
    profileNamePlaceholder: "Your full name",
    profileEmail: "Email",
    profileEmailPlaceholder: "email@example.com",
    profilePhone: "Phone",
    profilePhonePlaceholder: "+57 300 123 4567",
    profileSave: "Save changes",
    profileSaving: "Saving…",
    profileSaved: "Data updated successfully.",
    profileError: "Error saving data. Try again.",
    profilePhotoSaved: "Photo updated successfully.",
    profilePhotoError: "Error uploading photo. Try again.",
    profileRole: "Role",

    /* Settings */
    settingsTitle: "Settings",
    settingsDesc: "Customize the appearance and check system information.",
    settingsTheme: "Theme",
    settingsThemeDesc: "Select the visual theme of the application.",
    settingsThemeDark: "Dark",
    settingsThemeDarkDesc: "Night mode, ideal for low light",
    settingsThemeLight: "Light",
    settingsThemeLightDesc: "Day mode, high readability",
    settingsSystemInfo: "System Information",
    settingsSystemInfoDesc: "Current version and status.",
    settingsVersion: "Version",
    settingsDatabase: "Database",
    settingsEnvironment: "Environment",
    settingsCredentials: "Access Credentials",
    settingsCredentialsDesc: "Predefined users for testing.",
    settingsUser: "User",
    settingsEmail: "Email",
    settingsPassword: "Password",
    settingsResetHint: "If you forgot the password, run npm run seed to reset it.",

    /* Common */
    loading: "Loading information…",
    loadingInventory: "Preparing inventory…",
    loadingUpdating: "Updating data…",
    loadingSaving: "Saving changes…",
    noData: "No information available",
    error: "Error",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    send: "Send",

    /* Preloader */
    preloaderText: "Loading experience…",

    /* Breadcrumb */
    breadcrumbHome: "Minibar",
    breadcrumbConsumption: "Consumption",
    breadcrumbMinibars: "Minibars",
    breadcrumbSettings: "Settings",
    breadcrumbUnlock: "Unlock",
    breadcrumbTools: "Tools",

    /* Modal */
    modalPreview: "Summary preview",
    modalPreviewUnlock: "Message preview",
    modalCopy: "Copy",
    modalSend: "Send",
    modalClose: "Close",

    /* Logout */
    logout: "Log out",

    /* Admin */
    adminTitle: "Admin – ChargeIt Hotel",
    adminPanel: "Administration Panel",
    adminDashboard: "Dashboard",
    adminProducts: "Products",
    adminCategories: "Categories",
    adminFloors: "Floors",
    adminRooms: "Rooms",
    adminUsers: "Users",
    adminNewProduct: "New product",
    adminNewCategory: "New category",
    adminNewFloor: "New floor",
    adminNewRoom: "New room",
    adminNewUser: "New user",
    adminSave: "Save changes",
    adminCreate: "Create",
    adminCancel: "Cancel",
    adminDelete: "Delete",
    adminEdit: "Edit",
    adminActive: "Active",
    adminInactive: "Inactive",

    /* Dashboard */
    dashboardTitle: "Dashboard",
    dashboardDesc: "Quick overview of minibar status.",
    dashboardToday: "Today's consumption",
    dashboardProductsToday: "Products today",
    dashboardMovementsToday: "Movements today",
    dashboardWeek: "Week",
    dashboardRooms: "Rooms",
    dashboardLowStock: "Low stock",
    dashboardTopProducts: "Most consumed products today",
    dashboardRecentMovements: "Recent movements",
    dashboardGoToFloors: "Go to floors",
    dashboardRefresh: "Refresh",

    /* Footer */
    footerVersion: "v1.0.1",
    footerDeveloped: "Developed by Owen Pusey — Minibar Hotel Nattivo",
  }
};

function getCurrentLang() {
  return localStorage.getItem("chargeit-lang") || "es";
}

function setLanguage(lang) {
  lang = lang || "es";
  localStorage.setItem("chargeit-lang", lang);
  document.documentElement.setAttribute("lang", lang);
  applyTranslations(lang);
  updateThemeSwitcherLabels(lang);
}

function applyTranslations(lang) {
  lang = lang || getCurrentLang();
  const t = translations[lang] || translations.es;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key] !== undefined) {
      el.textContent = t[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key] !== undefined) {
      el.placeholder = t[key];
    }
  });

  document.querySelectorAll("[data-i18n-value]").forEach((el) => {
    const key = el.getAttribute("data-i18n-value");
    if (t[key] !== undefined) {
      el.value = t[key];
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (t[key] !== undefined) {
      el.title = t[key];
    }
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (t[key] !== undefined) {
      el.setAttribute("aria-label", t[key]);
    }
  });

  updateLangSelectorUI(lang);
}

function updateLangSelectorUI(lang) {
  document.querySelectorAll(".lang-selector-btn, .header-lang-btn").forEach((btn) => {
    const btnLang = btn.getAttribute("data-lang");
    btn.classList.toggle("active", btnLang === lang);
    btn.setAttribute("aria-pressed", btnLang === lang);
  });
}

function updateThemeSwitcherLabels(lang) {
  document.querySelectorAll(".theme-switcher-btn, .theme-toggle-btn").forEach((btn) => {
    const mode = btn.getAttribute("data-theme-mode");
    if (lang === "en") {
      btn.setAttribute("title", mode === "dark" ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("aria-label", mode === "dark" ? "Switch to light mode" : "Switch to dark mode");
    } else {
      btn.setAttribute("title", mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      btn.setAttribute("aria-label", mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    }
  });
}

function initLanguage() {
  const savedLang = localStorage.getItem("chargeit-lang") || "es";
  setLanguage(savedLang);
}

function setupLangSelector(container) {
  if (!container) return;
  const btns = container.querySelectorAll(".lang-selector-btn, .header-lang-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      setLanguage(lang);
    });
  });
}
