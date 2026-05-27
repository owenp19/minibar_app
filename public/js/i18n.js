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
    navConsumption: "Consumo",
    navMinibars: "Minibares",
    navUnlock: "Desbloqueo",
    navProfile: "Perfil",
    navSettings: "Configuración",
    navHelp: "Ayuda",
    navNewConsumption: "Nuevo consumo",
    navLogout: "Cerrar sesión",

    /* Main - Consumption */
    consumptionTitle: "Registro de consumo",
    consumptionDesc: "Selecciona la habitación, marca los productos consumidos y envía el resumen a recepción por WhatsApp.",
    consumptionRoom: "Habitación",
    consumptionRoomPlaceholder: "Seleccione una habitación",
    consumptionRoomTip: "Tip: primero selecciona la habitación para habilitar el listado de productos.",
    consumptionProducts: "Productos del minibar",
    consumptionSearch: "Buscar producto…",
    consumptionSelectAll: "Seleccionar todo",
    consumptionUnselectAll: "Quitar selección",
    consumptionTotalHint: "El total se calcula automáticamente según cantidades seleccionadas.",
    consumptionNote: "Nota (opcional)",
    consumptionNotePlaceholder: "Ej: salida tardía, consumo extra, minibar incompleto, etc.",
    consumptionNoteHint: "Esta nota se incluirá en el resumen enviado a recepción.",
    consumptionSend: "Enviar a recepción",
    consumptionPreview: "Vista previa",
    consumptionCopy: "Copiar resumen",
    consumptionClear: "Limpiar",
    consumptionVerify: "Verifica habitación y total antes de enviar.",
    consumptionNoRoom: "Selecciona una habitación antes de continuar.",
    consumptionNoProducts: "Selecciona al menos un producto y su cantidad.",
    consumptionSuccess: "Consumo registrado. Se generó el resumen con enlace PDF.",
    consumptionSuccessNoPdf: "Consumo registrado. Se generó el resumen (sin enlace PDF).",
    consumptionError: "Ocurrió un error al registrar el consumo.",
    consumptionPdfDownload: "Descargar PDF",
    consumptionReportTitle: "Informe",
    consumptionReportDesc: "Genera el PDF con consumos por rango de fechas.",
    consumptionReportFrom: "Desde",
    consumptionReportTo: "Hasta",
    consumptionReportDownload: "Descargar PDF",
    consumptionNoData: "No hay consumos en el rango seleccionado.",
    consumptionPdfError: "No se pudo generar el informe.",
    consumptionPdfMissing: "No está cargada la librería del PDF.",
    consumptionRoomsLoaded: "Habitaciones cargadas.",
    consumptionRoomsError: "No se pudieron cargar los productos.",
    consumptionRoomsEmpty: "No hay habitaciones registradas en el sistema.",
    consumptionCopied: "Resumen copiado al portapapeles.",
    consumptionCopyError: "No se pudo copiar el resumen.",
    consumptionRoomsUpdated: "Habitaciones actualizadas.",
    consumptionPrice: "Precio",
    consumptionQty: "cant.",

    /* KPI */
    kpiRoom: "Habitación",
    kpiItems: "Items",
    kpiTotal: "Total",
    kpiLastAction: "Última acción",

    /* Minibares */
    minibarTitle: "Gestión de Minibar",
    minibarDesc: "Selecciona un piso para ver sus habitaciones y revisar el inventario del minibar.",
    minibarSelectFloor: "Seleccionar piso",
    minibarSelectFloorDesc: "Elige el piso donde se encuentra la habitación.",
    minibarRooms: "Habitaciones",
    minibarRoomsDesc: "Selecciona una habitación para ver su inventario.",
    minibarInventory: "Inventario de minibar",
    minibarInventoryDesc: "Revisa y actualiza las cantidades de los productos.",
    minibarBackToFloors: "Volver a pisos",
    minibarBackToRooms: "Volver a habitaciones",
    minibarSave: "Guardar cambios",
    minibarReset: "Restablecer valores iniciales",
    minibarSaving: "Guardando…",
    minibarSaved: "Cambios guardados correctamente",
    minibarUnsaved: "No olvides guardar los cambios",
    minibarUpdated: "Inventario actualizado",
    minibarResetConfirm: "¿Restablecer todos los valores a las cantidades iniciales?",
    minibarResetDone: "Valores restablecidos. Guarda los cambios si deseas mantenerlos.",
    minibarError: "Error al guardar los cambios",
    minibarModified: "Modificado",
    minibarOutOfStock: "Agotado",
    minibarInitialQty: "Cantidad inicial",
    minibarNoFloors: "No hay pisos disponibles.",
    minibarNoRooms: "No hay habitaciones registradas en este piso.",
    minibarNoProducts: "No hay productos registrados para esta habitación.",
    minibarLoadingRooms: "Cargando habitaciones…",
    minibarRoom: "Habitación",

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
    navConsumption: "Consumption",
    navMinibars: "Minibars",
    navUnlock: "Unlock",
    navProfile: "Profile",
    navSettings: "Settings",
    navHelp: "Help",
    navNewConsumption: "New consumption",
    navLogout: "Log out",

    /* Main - Consumption */
    consumptionTitle: "Consumption Log",
    consumptionDesc: "Select the room, mark consumed products, and send the summary to reception via WhatsApp.",
    consumptionRoom: "Room",
    consumptionRoomPlaceholder: "Select a room",
    consumptionRoomTip: "Tip: first select the room to enable the product list.",
    consumptionProducts: "Minibar products",
    consumptionSearch: "Search product…",
    consumptionSelectAll: "Select all",
    consumptionUnselectAll: "Unselect all",
    consumptionTotalHint: "The total is calculated automatically based on selected quantities.",
    consumptionNote: "Note (optional)",
    consumptionNotePlaceholder: "e.g. late checkout, extra consumption, incomplete minibar, etc.",
    consumptionNoteHint: "This note will be included in the summary sent to reception.",
    consumptionSend: "Send to reception",
    consumptionPreview: "Preview",
    consumptionCopy: "Copy summary",
    consumptionClear: "Clear",
    consumptionVerify: "Check room and total before sending.",
    consumptionNoRoom: "Select a room before continuing.",
    consumptionNoProducts: "Select at least one product and its quantity.",
    consumptionSuccess: "Consumption registered. Summary with PDF link generated.",
    consumptionSuccessNoPdf: "Consumption registered. Summary generated (without PDF link).",
    consumptionError: "An error occurred while registering the consumption.",
    consumptionPdfDownload: "Download PDF",
    consumptionReportTitle: "Report",
    consumptionReportDesc: "Generate PDF with consumptions by date range.",
    consumptionReportFrom: "From",
    consumptionReportTo: "To",
    consumptionReportDownload: "Download PDF",
    consumptionNoData: "No consumptions in the selected range.",
    consumptionPdfError: "Could not generate the report.",
    consumptionPdfMissing: "PDF library is not loaded.",
    consumptionRoomsLoaded: "Rooms loaded.",
    consumptionRoomsError: "Could not load products.",
    consumptionRoomsEmpty: "No rooms registered in the system.",
    consumptionCopied: "Summary copied to clipboard.",
    consumptionCopyError: "Could not copy the summary.",
    consumptionRoomsUpdated: "Rooms updated.",
    consumptionPrice: "Price",
    consumptionQty: "qty.",

    /* KPI */
    kpiRoom: "Room",
    kpiItems: "Items",
    kpiTotal: "Total",
    kpiLastAction: "Last action",

    /* Minibares */
    minibarTitle: "Minibar Management",
    minibarDesc: "Select a floor to view its rooms and check the minibar inventory.",
    minibarSelectFloor: "Select floor",
    minibarSelectFloorDesc: "Choose the floor where the room is located.",
    minibarRooms: "Rooms",
    minibarRoomsDesc: "Select a room to view its inventory.",
    minibarInventory: "Minibar Inventory",
    minibarInventoryDesc: "Review and update product quantities.",
    minibarBackToFloors: "Back to floors",
    minibarBackToRooms: "Back to rooms",
    minibarSave: "Save changes",
    minibarReset: "Reset to default",
    minibarSaving: "Saving…",
    minibarSaved: "Changes saved successfully",
    minibarUnsaved: "Do not forget to save your changes",
    minibarUpdated: "Inventory updated",
    minibarResetConfirm: "Reset all values to default quantities?",
    minibarResetDone: "Values reset. Save changes if you want to keep them.",
    minibarError: "Error saving changes",
    minibarModified: "Modified",
    minibarOutOfStock: "Out of stock",
    minibarInitialQty: "Initial quantity",
    minibarNoFloors: "No floors available.",
    minibarNoRooms: "No rooms registered on this floor.",
    minibarNoProducts: "No products registered for this room.",
    minibarLoadingRooms: "Loading rooms…",
    minibarRoom: "Room",

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
