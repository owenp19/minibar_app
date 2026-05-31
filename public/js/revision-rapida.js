/* =============================================
   Revisión Rápida — Quick Review Mode
   ============================================= */

/* ---------- State ---------- */
var qrState = {
  selectedRoom: null,
  currentAction: null,
  products: [],
  rooms: [],
  floors: []
};

/* ---------- View navigation ---------- */
function qrShowView(viewId) {
  document.querySelectorAll(".view-section").forEach(function (el) {
    el.style.display = "none";
  });
  var view = document.getElementById(viewId);
  if (view) view.style.display = "block";
}

/* ---------- Load floors and rooms ---------- */
async function qrLoadInitialData() {
  try {
    var res = await fetch("/api/rooms", { credentials: "include" });
    if (!res.ok) throw new Error("Error cargando habitaciones");
    var rooms = await res.json();
    qrState.rooms = Array.isArray(rooms) ? rooms : [];

    // Extract unique floors
    var floorMap = {};
    qrState.rooms.forEach(function (r) {
      var fId = r.floorId || r.floor_id || r.piso_id || r.floor || 0;
      var fName = r.floorName || r.floor_name || r.piso_nombre || r.piso || ("Piso " + fId);
      if (!floorMap[fId]) {
        floorMap[fId] = { id: fId, name: fName };
      }
    });
    qrState.floors = Object.values(floorMap).sort(function (a, b) {
      return (a.id || 0) - (b.id || 0);
    });

    qrRenderFloors();
  } catch (e) {
    console.error("Error cargando datos iniciales:", e);
  }
}

function qrRenderFloors() {
  var container = document.getElementById("quick-floors");
  if (!container) return;

  if (qrState.floors.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><p>No hay pisos disponibles.</p></div>';
    return;
  }

  container.innerHTML = "";
  qrState.floors.forEach(function (floor) {
    var card = document.createElement("div");
    card.className = "floor-card";
    card.innerHTML =
      '<i class="ph-light ph-buildings"></i>' +
      '<div class="floor-label">' + floor.name + "</div>";
    card.addEventListener("click", function () {
      qrOnFloorSelected(floor);
    });
    container.appendChild(card);
  });
}

function qrOnFloorSelected(floor) {
  var roomsOnFloor = qrState.rooms.filter(function (r) {
    var fId = r.floorId || r.floor_id || r.piso_id || r.floor || 0;
    return fId == floor.id;
  });

  if (roomsOnFloor.length === 0) {
    showToast("No hay habitaciones en este piso.", "warning");
    return;
  }

  if (roomsOnFloor.length === 1) {
    qrOnRoomSelected(roomsOnFloor[0]);
    return;
  }

  // Show room selection via floors grid for the quick selection
  var container = document.getElementById("quick-floors");
  container.innerHTML = "";
  var backBtn = document.createElement("div");
  backBtn.className = "nav-back-btn";
  backBtn.style.marginBottom = "12px";
  backBtn.style.gridColumn = "1 / -1";
  backBtn.innerHTML =
    '<i class="ph-light ph-arrow-left"></i> Volver a pisos';
  backBtn.addEventListener("click", function () {
    qrRenderFloors();
  });
  container.appendChild(backBtn);

  roomsOnFloor.forEach(function (room) {
    var num =
      room.room_number ||
      room.roomNumber ||
      room.numero_habitacion ||
      room.numero ||
      room.number ||
      "";
    var card = document.createElement("div");
    card.className = "room-card";
    card.textContent = num;
    card.addEventListener("click", function () {
      qrOnRoomSelected(room);
    });
    container.appendChild(card);
  });
}

/* ---------- Room selected ---------- */
function qrOnRoomSelected(room) {
  qrState.selectedRoom = room;
  var num =
    room.room_number ||
    room.roomNumber ||
    room.numero_habitacion ||
    room.numero ||
    room.number ||
    "";

  document.getElementById("qr-room-number").textContent = num;
  document.getElementById("qr-status-bar").style.display = "flex";
  document.getElementById("qr-badge").textContent = "Seleccionada";
  document.getElementById("qr-badge").className = "room-status-badge pendiente";
  document.getElementById("qr-last-review").textContent = "Lista para revisar";

  qrShowView("view-room");
}

/* ---------- Quick action buttons ---------- */
function qrSetupActions() {
  document.querySelectorAll("#qr-actions .quick-action-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var action = btn.dataset.action;
      qrOnActionSelected(action);
    });
  });

  document.getElementById("qr-back-btn").addEventListener("click", function () {
    qrState.selectedRoom = null;
    qrShowView("view-search");
  });

  document.getElementById("qr-action-back-btn").addEventListener("click", function () {
    qrShowView("view-room");
  });

  document.getElementById("qr-history-back-btn").addEventListener("click", function () {
    qrShowView("view-room");
  });
}

/* ---------- Action selected ---------- */
function qrOnActionSelected(action) {
  qrState.currentAction = action;

  var labels = {
    "minibar-completo": { icon: "ph-check-circle", label: "Minibar completo", desc: "Marca la habitación como revisada sin novedades." },
    consumo: { icon: "ph-shopping-bag", label: "Registrar consumo", desc: "Productos consumidos por el huésped." },
    perdida: { icon: "ph-chart-bar", label: "Registrar pérdida o daño", desc: "Productos robados o dañados." },
    reposicion: { icon: "ph-plus-square", label: "Reponer productos", desc: "Agregar productos al inventario." },
    historial: { icon: "ph-clock-counter-clockwise", label: "Ver historial", desc: "Últimos movimientos de la habitación." }
  };

  var info = labels[action] || labels.consumo;

  document.getElementById("qr-action-icon").className =
    "ph-light " + info.icon;
  document.getElementById("qr-action-icon").style.marginRight = "8px";
  document.getElementById("qr-action-label").textContent = info.label;
  document.getElementById("qr-action-desc").textContent = info.desc;

  if (action === "historial") {
    qrLoadHistory();
    return;
  }

  if (action === "minibar-completo") {
    qrMinibarCompleto();
    return;
  }

  // Load products for consumption, loss, restock
  qrLoadProductsForAction(action);
}

/* ---------- Minibar completo ---------- */
function qrMinibarCompleto() {
  var room = qrState.selectedRoom;
  if (!room) return;

  var roomId = room.id || room.room_id || room.roomId;
  var num =
    room.room_number ||
    room.roomNumber ||
    room.numero_habitacion ||
    room.numero ||
    room.number ||
    "";

  showConfirm({
    title: "Minibar completo",
    message:
      "\u00bfConfirmas marcar la habitaci\u00f3n " +
      num +
      " como revisada sin novedades?",
    confirmText: "S\u00ed, marcar como revisada",
    cancelText: "Cancelar",
    icon: "ph-check-circle",
    iconType: "info",
    onConfirm: async function () {
      try {
        var res = await fetch("/api/minibar/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: roomId,
            status: "revisada",
            notes: "Minibar completo - Revisión rápida"
          }),
          credentials: "include"
        });

        if (!res.ok) throw new Error("Error");

        showToast("Habitaci\u00f3n " + num + " marcada como revisada.", "success");
        document.getElementById("qr-badge").textContent = "Revisada";
        document.getElementById("qr-badge").className = "room-status-badge revisada";
        document.getElementById("qr-last-review").textContent = "Revisada ahora";

        setTimeout(function () {
          qrShowView("view-search");
          qrState.selectedRoom = null;
          qrRenderFloors();
        }, 1500);
      } catch (e) {
        showToast("Error al marcar la habitaci\u00f3n.", "error");
      }
    }
  });
}

/* ---------- Load products for action ---------- */
async function qrLoadProductsForAction(action) {
  var container = document.getElementById("qr-products-container");
  var summary = document.getElementById("qr-summary");
  if (!container) return;

  container.innerHTML =
    '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando productos…</h3></div>';
  summary.style.display = "none";

  try {
    var res = await fetch("/api/products", { credentials: "include" });
    if (!res.ok) throw new Error("Error");
    var products = await res.json();
    qrState.products = Array.isArray(products) ? products : [];

    qrRenderProducts(action);
  } catch (e) {
    container.innerHTML =
      '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error al cargar productos</h3></div>';
    showToast("Error al cargar productos.", "error");
  }
}

function qrRenderProducts(action) {
  var container = document.getElementById("qr-products-container");
  var summary = document.getElementById("qr-summary");
  if (!container) return;

  if (qrState.products.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><i class="ph-light ph-package"></i><h3>No hay productos</h3></div>';
    return;
  }

  var isConsumption = action === "consumo";
  var isLoss = action === "perdida";
  var isRestock = action === "reposicion";

  var saveLabel = isConsumption
    ? "Guardar consumo"
    : isLoss
      ? "Registrar pérdida"
      : "Guardar reposición";

  document.getElementById("qr-save-label").textContent = saveLabel;

  container.innerHTML = "";
  container.className = "product-grid";

  qrState.products.forEach(function (product) {
    var id = product.id || product.product_id || product.productId || "";
    var name = product.name || product.product_name || "Producto";
    var price = Number(product.price) || 0;
    var category = product.category || product.categoria || "";
    var stock = Number(product.stock || product.quantity || product.cantidad || 0);

    var card = document.createElement("div");
    card.className = "product-card-mobile";
    if (stock <= 0) card.classList.add("agotado");
    else if (stock <= 3) card.classList.add("bajo-inventario");

    var stockLabel = stock <= 0 ? "Agotado" : stock <= 3 ? "Bajo inventario" : "Disponible";
    var stockClass = stock <= 0 ? "agotado" : stock <= 3 ? "bajo" : "disponible";

    card.innerHTML =
      '<div class="product-card-header">' +
      '<div>' +
      '<div class="product-card-name">' + name + "</div>" +
      (category
        ? '<div class="product-card-category">' + category + "</div>"
        : "") +
      "</div>" +
      '<span class="product-card-stock ' + stockClass + '">' +
      (stock <= 0
        ? '<i class="ph-light ph-x-circle"></i>'
        : stock <= 3
          ? '<i class="ph-light ph-warning"></i>'
          : '<i class="ph-light ph-check"></i>') +
      " " +
      stockLabel +
      "</span>" +
      "</div>" +
      '<div class="product-card-body">' +
      '<div class="product-card-price">' +
      formatPrice(price) +
      (isConsumption ? "" : "") +
      "</div>" +
      '<div class="product-card-qty">' +
      '<button class="qty-btn" data-pid="' +
      id +
      '" data-dir="down">' +
      '<i class="ph-light ph-minus"></i>' +
      "</button>" +
      '<input type="number" class="qty-input-mobile" data-pid="' +
      id +
      '" value="0" min="0" max="99" inputmode="numeric" />' +
      '<button class="qty-btn" data-pid="' +
      id +
      '" data-dir="up">' +
      '<i class="ph-light ph-plus"></i>' +
      "</button>" +
      "</div>" +
      "</div>" +
      '<div class="product-card-total" id="qr-total-' +
      id +
      '">Total: <strong>' +
      formatPrice(0) +
      "</strong></div>";

    container.appendChild(card);

    // Wire up qty buttons
    var minusBtn = card.querySelector('[data-dir="down"]');
    var plusBtn = card.querySelector('[data-dir="up"]');
    var input = card.querySelector(".qty-input-mobile");

    function updateTotal() {
      var qty = Number(input.value) || 0;
      var totalEl = document.getElementById("qr-total-" + id);
      if (totalEl) {
        totalEl.innerHTML = "Total: <strong>" + formatPrice(qty * price) + "</strong>";
      }
      qrUpdateSummary();
    }

    minusBtn.addEventListener("click", function () {
      var v = Number(input.value) || 0;
      if (v > 0) {
        input.value = String(v - 1);
        updateTotal();
      }
    });

    plusBtn.addEventListener("click", function () {
      var v = Number(input.value) || 0;
      if (v < 99) {
        input.value = String(v + 1);
        updateTotal();
      }
    });

    input.addEventListener("input", function () {
      var v = Number(input.value) || 0;
      if (v < 0) input.value = "0";
      if (v > 99) input.value = "99";
      updateTotal();
    });
  });

  summary.style.display = "block";
  qrUpdateSummary();
  qrShowView("view-action");

  // Wire save button
  document.getElementById("qr-save-btn").onclick = function () {
    qrSaveAction(action);
  };
}

function qrUpdateSummary() {
  var total = 0;
  var count = 0;

  document.querySelectorAll("#qr-products-container .product-card-mobile").forEach(function (card) {
    var input = card.querySelector(".qty-input-mobile");
    var qty = Number(input ? input.value : "0") || 0;
    if (qty > 0) {
      var priceEl = card.querySelector(".product-card-price");
      var price = 0;
      if (priceEl) {
        var txt = priceEl.textContent.replace(/[^0-9]/g, "");
        price = Number(txt) || 0;
      }
      total += qty * price;
      count += qty;
    }
  });

  document.getElementById("qr-total").textContent = formatPrice(total);
}

function qrGetSelectedProducts() {
  var items = [];
  document.querySelectorAll("#qr-products-container .product-card-mobile").forEach(function (card) {
    var input = card.querySelector(".qty-input-mobile");
    var qty = Number(input ? input.value : "0") || 0;
    if (qty > 0) {
      var pid = input.dataset.pid;
      var nameEl = card.querySelector(".product-card-name");
      var name = nameEl ? nameEl.textContent : "Producto";
      var priceEl = card.querySelector(".product-card-price");
      var price = 0;
      if (priceEl) {
        var txt = priceEl.textContent.replace(/[^0-9]/g, "");
        price = Number(txt) || 0;
      }
      items.push({ productId: pid, name: name, quantity: qty, price: price });
    }
  });
  return items;
}

/* ---------- Save action ---------- */
async function qrSaveAction(action) {
  var room = qrState.selectedRoom;
  if (!room) {
    showToast("Selecciona una habitaci\u00f3n primero.", "error");
    return;
  }

  var items = qrGetSelectedProducts();
  if (items.length === 0) {
    showToast("Selecciona al menos un producto.", "warning");
    return;
  }

  var roomId = room.id || room.room_id || room.roomId;
  var num =
    room.room_number ||
    room.roomNumber ||
    room.numero_habitacion ||
    room.numero ||
    room.number ||
    "";

  var confirmMessages = {
    consumo:
      "\u00bfConfirmas registrar este consumo y descontarlo del inventario?",
    perdida:
      "\u00bfConfirmas registrar estos productos como robados o da\u00f1ados?",
    reposicion:
      "\u00bfConfirmas reponer estos productos al inventario?"
  };

  showConfirm({
    title:
      action === "consumo"
        ? "Registrar consumo"
        : action === "perdida"
          ? "Registrar p\u00e9rdida"
          : "Reponer productos",
    message: confirmMessages[action] || "Confirmas esta acci\u00f3n?",
    confirmText: "S\u00ed, guardar",
    cancelText: "Cancelar",
    icon:
      action === "consumo"
        ? "ph-shopping-bag"
        : action === "perdida"
          ? "ph-chart-bar"
          : "ph-plus-square",
    iconType: "info",
    onConfirm: async function () {
      var endpoint = "";
      var payload = { roomId: roomId, items: [] };

      if (action === "consumo") {
        endpoint = "/api/consumptions";
        payload.items = items.map(function (x) {
          return { productId: x.productId, quantity: x.quantity };
        });
        payload.note = "Registrado desde Revisión rápida";
      } else if (action === "perdida") {
        endpoint = "/api/perdidas";
        payload.items = items.map(function (x) {
          return {
            productId: x.productId,
            quantity: x.quantity,
            type: "stolen"
          };
        });
        payload.notes = "Registrado desde Revisión rápida";
      } else if (action === "reposicion") {
        endpoint = "/api/minibar/restock";
        payload.items = items.map(function (x) {
          return { productId: x.productId, quantity: x.quantity };
        });
        payload.notes = "Reposición desde Revisión rápida";
      }

      try {
        var res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include"
        });

        if (!res.ok) throw new Error("Error HTTP " + res.status);

        var successMsg = {
          consumo: "Consumo registrado correctamente.",
          perdida: "P\u00e9rdida registrada correctamente.",
          reposicion: "Reposici\u00f3n guardada correctamente."
        };

        showToast(
          successMsg[action] || "Acci\u00f3n completada.",
          "success"
        );

        // Reset products
        qrState.currentAction = null;
        qrShowView("view-room");

        // Update status badge
        document.getElementById("qr-badge").textContent = "Con novedad";
        document.getElementById("qr-badge").className =
          "room-status-badge novedad";
        document.getElementById("qr-last-review").textContent = "Actualizado ahora";
      } catch (e) {
        console.error("Error guardando:", e);
        showToast(
          "Error al guardar, intenta nuevamente.",
          "error"
        );
      }
    }
  });
}

/* ---------- Load history ---------- */
async function qrLoadHistory() {
  var room = qrState.selectedRoom;
  if (!room) return;

  var roomId = room.id || room.room_id || room.roomId;
  var num =
    room.room_number ||
    room.roomNumber ||
    room.numero_habitacion ||
    room.numero ||
    room.number ||
    "";

  document.getElementById("qr-history-room").textContent = num;
  qrShowView("view-history");

  var container = document.getElementById("qr-history-container");
  container.innerHTML =
    '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando historial…</h3></div>';

  try {
    var res = await fetch(
      "/api/minibar/" + roomId + "/movements?limit=20",
      { credentials: "include" }
    );

    if (!res.ok) throw new Error("Error");

    var movements = await res.json();
    var list = Array.isArray(movements) ? movements : [];

    if (list.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><i class="ph-light ph-clock-counter-clockwise"></i><h3>Sin movimientos</h3><p>No hay movimientos registrados para esta habitaci\u00f3n.</p></div>';
      return;
    }

    container.innerHTML = "";

    list.forEach(function (mov) {
      var type = mov.type || mov.tipo || "unknown";
      var typeLabels = {
        consumption: "Consumo",
        restock: "Reposici\u00f3n",
        adjustment: "Ajuste",
        loss: "P\u00e9rdida",
        stolen: "Robo",
        damaged: "Da\u00f1o"
      };
      var typeLabel = typeLabels[type] || type;

      var typeIcons = {
        consumption: "ph-shopping-bag",
        restock: "ph-plus-square",
        adjustment: "ph-wrench",
        loss: "ph-chart-bar",
        stolen: "ph-chart-bar",
        damaged: "ph-warning"
      };
      var typeIcon = typeIcons[type] || "ph-clock-counter-clockwise";

      var productName =
        mov.product_name ||
        mov.product?.name ||
        mov.name ||
        "Producto";

      var qty = Number(mov.quantity || mov.qty || mov.cantidad || 0);
      var date = mov.created_at || mov.createdAt || mov.fecha || "";
      var formattedDate = date
        ? new Date(date).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        : "—";

      var card = document.createElement("div");
      card.className = "table-card-row";
      card.innerHTML =
        '<div class="table-card-main">' +
        '<div>' +
        '<div class="table-card-title">' +
        '<i class="ph-light ' +
        typeIcon +
        '" style="margin-right:6px;color:var(--color-primary);"></i>' +
        typeLabel +
        "</div>" +
        '<div class="table-card-subtitle">' +
        productName +
        "</div>" +
        "</div>" +
        '<div class="table-card-value">' +
        (qty > 0 ? "+" : "") +
        qty +
        "</div>" +
        "</div>" +
        '<div class="table-card-details">' +
        '<div class="table-card-detail"><i class="ph-light ph-calendar"></i> ' +
        formattedDate +
        "</div>" +
        "</div>";

      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML =
      '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error al cargar historial</h3><p>Intenta nuevamente.</p></div>';
    console.error("Error loading history:", e);
  }
}

/* ---------- Init ---------- */
function qrInit() {
  qrSetupActions();
  qrLoadInitialData();

  // Setup quick search
  if (document.getElementById("quick-room-search")) {
    setupQuickRoomSearch(
      "quick-room-search",
      "quick-room-result",
      function (room) {
        qrOnRoomSelected(room);
      }
    );
  }
}

document.addEventListener("DOMContentLoaded", qrInit);
