(function () {
  'use strict';

  let floors = [];
  let rooms = [];
  let inventory = [];
  let selectedFloorId = null;
  let selectedRoomId = null;
  let movements = [];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const el = {
    viewDashboard: $('#view-dashboard'),
    viewFloors: $('#view-floors'),
    viewRooms: $('#view-rooms'),
    viewRoomDetail: $('#view-room-detail'),
    dashboardContainer: $('#dashboard-container'),
    dashGoFloorsBtn: $('#dash-go-floors-btn'),
    dashRefreshBtn: $('#dash-refresh-btn'),
    floorsContainer: $('#floors-container'),
    roomsContainer: $('#rooms-container'),
    roomsHeading: $('#rooms-heading'),
    roomsSubtitle: $('#rooms-subtitle'),
    rdFloorName: $('#rd-floor-name'),
    rdRoomName: $('#rd-room-name'),
    breadcrumb: $('#breadcrumb'),
    pageDescription: $('#page-description'),
    roomDetailSubtitle: $('#room-detail-subtitle'),
    backToFloorsBtn: $('#back-to-floors-btn'),
    backToRoomsBtn: $('#back-to-rooms-btn'),

    inventoryContainer: $('#inventory-container'),
    invSaveStatus: $('#inv-save-status'),
    refreshInventoryBtn: $('#refresh-inventory-btn'),

    consumptionProducts: $('#consumption-products-container'),
    consumptionTotal: $('#consumption-total'),
    saveConsumptionBtn: $('#save-consumption-btn'),
    saveAndSendBtn: $('#save-and-send-btn'),
    consumptionStatus: $('#consumption-status'),

    restockProducts: $('#restock-products-container'),
    saveRestockBtn: $('#save-restock-btn'),
    restockStatus: $('#restock-status'),

    adjustProducts: $('#adjust-products-container'),
    saveAdjustBtn: $('#save-adjust-btn'),
    adjustStatus: $('#adjust-status'),

    historyContainer: $('#history-container'),
    refreshHistoryBtn: $('#refresh-history-btn'),

    reportFrom: $('#report-from'),
    reportTo: $('#report-to'),
    generateReportBtn: $('#generate-report-btn'),
    downloadReportPdfBtn: $('#download-report-pdf-btn'),
    reportResult: $('#report-result'),
    reportStatus: $('#report-status'),

    previewModal: $('#preview-modal'),
    previewContent: $('#preview-content'),
    previewCopyBtn: $('#preview-copy-btn'),
    previewSendBtn: $('#preview-send-btn'),
    closePreviewBtn: $('#close-preview-btn'),
    closePreviewBtn2: $('#close-preview-btn2')
  };

  function showView(viewId) {
    $$('.view-section').forEach((v) => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
  }

  function switchTab(tabName) {
    $$('.room-tab').forEach((t) => t.classList.remove('active'));
    $$('.tab-content').forEach((c) => c.classList.remove('active'));
    const tabBtn = $(`.room-tab[data-tab="${tabName}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    const tabContent = $(`#tab-${tabName}`);
    if (tabContent) tabContent.classList.add('active');

    // Load data on demand per tab
    if (tabName === 'inventory') renderInventory();
    else if (tabName === 'consumption') renderConsumptionForm();
    else if (tabName === 'restock') renderRestockForm();
    else if (tabName === 'adjust') renderAdjustForm();
    else if (tabName === 'history') loadAndRenderHistory();
    else if (tabName === 'reports') {
      if (!el.reportFrom.value) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        el.reportFrom.value = firstDay.toISOString().split('T')[0];
        el.reportTo.value = today.toISOString().split('T')[0];
      }
    }
  }

  function updateBreadcrumb(view, floorName, roomNumber) {
    if (!el.breadcrumb) return;
    if (view === 'view-floors') {
      el.breadcrumb.innerHTML = `
        <span class="crumb">
          <i class="ph-light ph-house"></i>
          <span class="crumb-current">Minibares</span>
        </span>
      `;
      if (el.pageDescription) {
        el.pageDescription.textContent = 'Selecciona un piso para ver sus habitaciones y gestionar el minibar.';
      }
    } else if (view === 'view-rooms') {
      el.breadcrumb.innerHTML = `
        <span class="crumb">
          <i class="ph-light ph-house"></i>
          <span class="crumb-link" id="crumb-link-floors">Minibares</span>
        </span>
        <span class="crumb-sep"><i class="ph-light ph-caret-right"></i></span>
        <span class="crumb">
          <span class="crumb-current">${floorName || 'Piso'}</span>
        </span>
      `;
      const link = document.getElementById('crumb-link-floors');
      if (link) link.addEventListener('click', goBackToFloors);
      if (el.pageDescription) {
        el.pageDescription.textContent = 'Selecciona una habitaci\u00f3n del ' + (floorName || 'Piso') + ' para gestionar su minibar.';
      }
    } else if (view === 'view-room-detail') {
      el.breadcrumb.innerHTML = `
        <span class="crumb">
          <i class="ph-light ph-house"></i>
          <span class="crumb-link" id="crumb-link-floors-det">Minibares</span>
        </span>
        <span class="crumb-sep"><i class="ph-light ph-caret-right"></i></span>
        <span class="crumb">
          <span class="crumb-link" id="crumb-link-rooms-det">${floorName || 'Piso'}</span>
        </span>
        <span class="crumb-sep"><i class="ph-light ph-caret-right"></i></span>
        <span class="crumb">
          <span class="crumb-current">Habitaci\u00f3n ${roomNumber || ''}</span>
        </span>
      `;
      const linkFloors = document.getElementById('crumb-link-floors-det');
      if (linkFloors) linkFloors.addEventListener('click', goBackToFloors);
      const linkRooms = document.getElementById('crumb-link-rooms-det');
      if (linkRooms) linkRooms.addEventListener('click', goBackToRooms);
      if (el.pageDescription) {
        el.pageDescription.textContent = 'Gestionando minibar de ' + (floorName || 'Piso') + ', Habitaci\u00f3n ' + (roomNumber || '');
      }
    }
  }

  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Error ' + res.status);
    }
    return res.json();
  }

  function goBackToFloors() {
    selectedFloorId = null;
    selectedRoomId = null;
    showView('view-floors');
    renderFloors();
    updateBreadcrumb('view-floors');
  }

  function goBackToRooms() {
    selectedRoomId = null;
    showView('view-rooms');
    updateBreadcrumb('view-rooms', getFloorName(selectedFloorId));
    if (selectedFloorId) loadRooms(selectedFloorId);
    else renderRooms();
  }

  function getFloorName(floorId) {
    const floor = floors.find((f) => f.id === floorId);
    return floor ? floor.name : 'Piso';
  }

  function getRoomNumber(roomId) {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.room_number : '';
  }

  function formatCOP(value) {
    const n = Number(value) || 0;
    return '$' + Math.round(n).toLocaleString('es-CO') + ' COP';
  }

  // ============ DASHBOARD ============

  async function loadDashboard() {
    if (!el.dashboardContainer) return;
    el.dashboardContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando dashboard...</h3></div>';
    try {
      const data = await apiFetch('/api/minibar/dashboard');
      renderDashboard(data);
    } catch (err) {
      el.dashboardContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderDashboard(data) {
    const t = data.today || {};
    const w = data.week || {};
    let html = '';

    html += '<div class="report-summary-cards">';
    const cards = [
      { label: 'Consumo hoy', value: formatCOP(t.total), icon: 'ph-light ph-currency-circle-dollar' },
      { label: 'Productos hoy', value: String(t.products || 0), icon: 'ph-light ph-shopping-bag' },
      { label: 'Movimientos hoy', value: String(t.movements || 0), icon: 'ph-light ph-list-dashes' },
      { label: 'Semana', value: formatCOP(w.total), icon: 'ph-light ph-calendar' },
      { label: 'Habitaciones', value: String(data.totalRooms || 0), icon: 'ph-light ph-bed' },
      { label: 'Stock bajo', value: String(data.lowStockRoomCount || 0), icon: 'ph-light ph-warning' }
    ];
    for (const card of cards) {
      html += '<div class="report-card">' +
        '<div class="report-card-icon"><i class="' + card.icon + '"></i></div>' +
        '<div class="report-card-value">' + card.value + '</div>' +
        '<div class="report-card-label">' + card.label + '</div>' +
      '</div>';
    }
    html += '</div>';

    if (data.topProducts && data.topProducts.length) {
      const top = data.topProducts[0];
      html += '<div class="report-section"><h3 class="report-section-title">Producto destacado de hoy</h3>';
      html += '<div class="featured-product-card">' +
        '<div class="featured-product-icon"><i class="ph-light ph-trophy"></i></div>' +
        '<div class="featured-product-info">' +
          '<div class="featured-product-name">' + top.name + '</div>' +
          '<div class="featured-product-stats">' +
            '<span><strong>' + top.total_qty + '</strong> unidades consumidas</span>' +
            '<span><strong>' + formatCOP(top.total_amount) + '</strong> en ventas</span>' +
          '</div>' +
        '</div>' +
      '</div></div>';

      if (data.topProducts.length > 1) {
        html += '<div class="report-section"><h3 class="report-section-title">Productos m&aacute;s consumidos hoy</h3>';
        html += '<div class="report-ranking">';
        data.topProducts.forEach((p, i) => {
          html += '<div class="report-rank-item"><span class="report-rank-num">#' + (i + 1) + '</span><span class="report-rank-label">' + p.name + '</span><span class="report-rank-value">' + p.total_qty + ' uds</span></div>';
        });
        html += '</div></div>';
      }
    }

    if (data.recentMovements && data.recentMovements.length) {
      html += '<div class="report-section"><h3 class="report-section-title">&Uacute;ltimos movimientos</h3>';
      html += '<div class="movements-table" style="max-height:300px;overflow-y:auto;"><table><thead><tr>' +
        '<th>Hora</th><th>Tipo</th><th>Producto</th><th>Hab.</th><th>Cant.</th><th>Usuario</th>' +
      '</tr></thead><tbody>';
      const typeLabels = { consumption: 'Consumo', restock: 'Reposici&oacute;n', adjustment: 'Ajuste' };
      for (const m of data.recentMovements) {
        const date = new Date(m.created_at);
        const dateStr = date.toLocaleDateString('es-CO') + ' ' + date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        html += '<tr>' +
          '<td class="movement-date">' + dateStr + '</td>' +
          '<td><span class="movement-type-badge ' + m.movement_type + '">' + (typeLabels[m.movement_type] || m.movement_type) + '</span></td>' +
          '<td>' + m.product_name + '</td>' +
          '<td>' + m.room_number + '</td>' +
          '<td class="movement-qty">' + m.quantity_moved + '</td>' +
          '<td>' + (m.user_name || '&mdash;') + '</td>' +
        '</tr>';
      }
      html += '</tbody></table></div></div>';
    }

    html += '<p class="report-generated-at">Actualizado: ' + new Date().toLocaleString('es-CO') + '</p>';
    el.dashboardContainer.innerHTML = html;
  }

  function goToDashboard() {
    showView('view-dashboard');
    updateBreadcrumb('view-floors');
    el.pageDescription.textContent = 'Bienvenido al panel de control del minibar.';
    loadDashboard();
  }

  // ============ FLOORS ============

  async function loadFloors() {
    try {
      floors = await apiFetch('/api/minibar/floors');
      renderFloors();
    } catch (err) {
      el.floorsContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error al cargar</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderFloors() {
    if (!floors.length) {
      el.floorsContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-buildings"></i><h3>Sin pisos</h3><p>No hay pisos disponibles.</p></div>';
      return;
    }
    el.floorsContainer.innerHTML = floors.map((f) =>
      '<div class="floor-card' + (selectedFloorId === f.id ? ' active' : '') + '" data-floor-id="' + f.id + '">' +
        '<i class="ph-light ph-buildings"></i>' +
        '<div class="floor-label">' + f.name + '</div>' +
      '</div>'
    ).join('');

    el.floorsContainer.querySelectorAll('.floor-card').forEach((card) => {
      card.addEventListener('click', () => onFloorClick(Number(card.dataset.floorId)));
    });
  }

  async function onFloorClick(floorId) {
    selectedFloorId = floorId;
    selectedRoomId = null;
    renderFloors();
    showView('view-rooms');
    updateBreadcrumb('view-rooms', getFloorName(floorId));
    await loadRooms(floorId);
  }

  // ============ ROOMS ============

  async function loadRooms(floorId) {
    const floorName = getFloorName(floorId);
    el.roomsHeading.textContent = floorName;
    el.roomsSubtitle.textContent = 'Selecciona una habitaci\u00f3n del ' + floorName + ' para gestionar su minibar.';

    try {
      rooms = await apiFetch('/api/minibar/rooms/' + floorId);
      renderRooms();
    } catch (err) {
      el.roomsContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderRooms() {
    if (!rooms.length) {
      el.roomsContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-bed"></i><h3>Sin habitaciones</h3><p>No hay habitaciones registradas en este piso.</p></div>';
      return;
    }
    el.roomsContainer.innerHTML = rooms.map((r) =>
      '<div class="room-card' + (selectedRoomId === r.id ? ' active' : '') + '" data-room-id="' + r.id + '">' +
        r.room_number +
      '</div>'
    ).join('');

    el.roomsContainer.querySelectorAll('.room-card').forEach((card) => {
      card.addEventListener('click', () => onRoomClick(Number(card.dataset.roomId)));
    });
  }

  async function onRoomClick(roomId) {
    selectedRoomId = roomId;
    renderRooms();
    showView('view-room-detail');

    const floorName = getFloorName(selectedFloorId);
    const roomNumber = getRoomNumber(roomId);
    el.rdFloorName.innerHTML = '<i class="ph-light ph-buildings"></i> ' + floorName;
    el.rdRoomName.innerHTML = '<i class="ph-light ph-bed"></i> Habitaci\u00f3n ' + roomNumber;
    el.roomDetailSubtitle.textContent = 'Gestionando minibar de ' + floorName + ', Habitaci\u00f3n ' + roomNumber + '.';

    updateBreadcrumb('view-room-detail', floorName, roomNumber);

    // Load inventory for the room
    await loadInventory(roomId);

    // Switch to the first tab (inventory)
    switchTab('inventory');
  }

  // ============ INVENTORY ============

  async function loadInventory(roomId) {
    try {
      inventory = await apiFetch('/api/minibar/inventory/' + roomId);
    } catch (err) {
      inventory = [];
      el.inventoryContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderInventory() {
    if (!inventory.length) {
      el.inventoryContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-fridge"></i><h3>Sin productos</h3><p>No hay productos registrados para esta habitaci\u00f3n.</p></div>';
      return;
    }

    const grouped = {};
    for (const item of inventory) {
      if (!grouped[item.category_name]) grouped[item.category_name] = [];
      grouped[item.category_name].push(item);
    }

    const categoryOrder = ['Canasta', 'Nevera'];
    let html = '';

    for (const catName of categoryOrder) {
      const items = grouped[catName];
      if (!items) continue;

      html += '<div class="category-section">';
      html += '<div class="category-heading">' +
        '<i class="' + (catName === 'Canasta' ? 'ph-light ph-shopping-cart-simple' : 'ph-light ph-snowflake') + '"></i>' +
        '<h3>' + catName + '</h3>' +
        '<span class="cat-count">' + items.length + ' producto' + (items.length !== 1 ? 's' : '') + '</span>' +
      '</div>';

      for (const item of items) {
        const isAgotado = item.quantity === 0;
        html += '<div class="product-row-minibar' + (isAgotado ? ' agotado' : '') + '" data-product-id="' + item.product_id + '">' +
          '<div class="product-info">' +
            '<div class="product-name-text">' +
              item.product_name +
              (isAgotado ? '<span class="product-agotado-badge"><i class="ph-light ph-warning"></i>Agotado</span>' : '') +
            '</div>' +
            '<div class="product-details-row">' +
              '<span class="product-price-label">' + formatCOP(item.product_price) + '</span>' +
              ' <span class="product-detail-sep">|</span> ' +
              '<span class="product-qty-label">' + item.quantity + ' uds.</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      }
      html += '</div>';
    }

    el.inventoryContainer.innerHTML = html;
  }

  // ============ CONSUMPTION FORM ============

  function renderConsumptionForm() {
    if (!inventory.length) {
      el.consumptionProducts.innerHTML = '<div class="empty-state"><i class="ph-light ph-shopping-bag"></i><h3>Sin productos</h3><p>Cargando inventario...</p></div>';
      return;
    }

    const grouped = {};
    for (const item of inventory) {
      if (!grouped[item.category_name]) grouped[item.category_name] = [];
      grouped[item.category_name].push(item);
    }

    const categoryOrder = ['Canasta', 'Nevera'];
    let html = '';

    for (const catName of categoryOrder) {
      const items = grouped[catName];
      if (!items) continue;

      html += '<div class="category-section">';
      html += '<div class="category-heading">' +
        '<i class="' + (catName === 'Canasta' ? 'ph-light ph-shopping-cart-simple' : 'ph-light ph-snowflake') + '"></i>' +
        '<h3>' + catName + '</h3>' +
      '</div>';

      for (const item of items) {
        const isAgotado = item.quantity === 0;
        const itemTotal = 0;
        html += '<div class="product-row-consumption' + (isAgotado ? ' agotado' : '') + '" data-product-id="' + item.product_id + '" data-price="' + item.product_price + '">' +
          '<div class="product-consumption-info">' +
            '<div class="product-name-text">' +
              item.product_name +
              (isAgotado ? '<span class="product-agotado-badge"><i class="ph-light ph-warning"></i>Agotado</span>' : '') +
            '</div>' +
            '<div class="product-details-row">' +
              '<span class="product-price-label">' + formatCOP(item.product_price) + '</span>' +
              ' <span class="product-detail-sep">|</span> ' +
              '<span class="product-qty-label">Disponible: ' + item.quantity + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="product-consumption-controls">' +
            '<button class="qty-btn cons-qty-minus" type="button" data-pid="' + item.product_id + '">&minus;</button>' +
            '<input class="qty-input cons-qty-input" type="number" min="0" max="' + item.quantity + '" value="0" data-pid="' + item.product_id + '" ' + (isAgotado ? 'disabled' : '') + ' />' +
            '<button class="qty-btn cons-qty-plus" type="button" data-pid="' + item.product_id + '">+</button>' +
            '<span class="cons-line-total" data-pid="' + item.product_id + '">$0</span>' +
          '</div>' +
        '</div>';
      }
      html += '</div>';
    }

    el.consumptionProducts.innerHTML = html;

    // Attach events
    el.consumptionProducts.querySelectorAll('.cons-qty-minus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = Number(btn.dataset.pid);
        changeConsumptionQty(pid, -1);
      });
    });
    el.consumptionProducts.querySelectorAll('.cons-qty-plus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = Number(btn.dataset.pid);
        changeConsumptionQty(pid, 1);
      });
    });
    el.consumptionProducts.querySelectorAll('.cons-qty-input').forEach((input) => {
      input.addEventListener('change', () => {
        const pid = Number(input.dataset.pid);
        const max = Number(input.max);
        const val = Math.max(0, Math.min(max, parseInt(input.value, 10) || 0));
        setConsumptionQty(pid, val);
      });
      input.addEventListener('focus', function() { this.select(); });
    });

    updateConsumptionTotal();
  }

  function changeConsumptionQty(productId, delta) {
    const input = el.consumptionProducts.querySelector('.cons-qty-input[data-pid="' + productId + '"]');
    if (!input || input.disabled) return;
    const max = Number(input.max);
    const current = Number(input.value) || 0;
    const val = Math.max(0, Math.min(max, current + delta));
    setConsumptionQty(productId, val);
  }

  function setConsumptionQty(productId, value) {
    const input = el.consumptionProducts.querySelector('.cons-qty-input[data-pid="' + productId + '"]');
    if (!input) return;
    input.value = value;
    updateConsumptionLineTotal(productId);
    updateConsumptionTotal();
  }

  function updateConsumptionLineTotal(productId) {
    const input = el.consumptionProducts.querySelector('.cons-qty-input[data-pid="' + productId + '"]');
    const totalSpan = el.consumptionProducts.querySelector('.cons-line-total[data-pid="' + productId + '"]');
    if (!input || !totalSpan) return;
    const row = input.closest('.product-row-consumption');
    const price = Number(row ? row.dataset.price : 0);
    const qty = Number(input.value) || 0;
    totalSpan.textContent = formatCOP(qty * price);
  }

  function updateConsumptionTotal() {
    let total = 0;
    el.consumptionProducts.querySelectorAll('.cons-qty-input').forEach((input) => {
      const row = input.closest('.product-row-consumption');
      const price = Number(row ? row.dataset.price : 0);
      const qty = Number(input.value) || 0;
      total += qty * price;
    });
    el.consumptionTotal.textContent = formatCOP(total);
  }

  function getConsumptionItems() {
    const items = [];
    el.consumptionProducts.querySelectorAll('.cons-qty-input').forEach((input) => {
      const qty = Number(input.value) || 0;
      if (qty > 0) {
        items.push({ productId: Number(input.dataset.pid), quantity: qty });
      }
    });
    return items;
  }

  async function saveConsumption(openWhatsapp) {
    if (!selectedRoomId) {
      el.consumptionStatus.textContent = 'Error: No hay habitaci\u00f3n seleccionada.';
      el.consumptionStatus.className = 'status error';
      return;
    }
    const items = getConsumptionItems();
    if (items.length === 0) {
      el.consumptionStatus.textContent = 'Selecciona al menos un producto y su cantidad.';
      el.consumptionStatus.className = 'status error';
      return;
    }

    el.consumptionStatus.textContent = 'Guardando consumo...';
    el.consumptionStatus.className = 'status';
    el.saveConsumptionBtn.disabled = true;
    el.saveAndSendBtn.disabled = true;

    try {
      const result = await apiFetch('/api/minibar/consumption', {
        method: 'POST',
        body: JSON.stringify({ roomId: selectedRoomId, items })
      });

      el.consumptionStatus.textContent = result.message;
      el.consumptionStatus.className = 'status success';

      if (openWhatsapp && result.whatsappMessage) {
        el.previewContent.textContent = result.whatsappMessage;
        el.previewModal.classList.add('visible');
        el.previewModal.setAttribute('aria-hidden', 'false');
        el.previewSendBtn.dataset.message = result.whatsappMessage;
      }

      // Reload inventory after consumption
      await loadInventory(selectedRoomId);
      renderConsumptionForm();
    } catch (err) {
      el.consumptionStatus.textContent = 'Error: ' + err.message;
      el.consumptionStatus.className = 'status error';
    } finally {
      el.saveConsumptionBtn.disabled = false;
      el.saveAndSendBtn.disabled = false;
    }
  }

  // ============ RESTOCK FORM ============

  function renderRestockForm() {
    if (!inventory.length) {
      el.restockProducts.innerHTML = '<div class="empty-state"><i class="ph-light ph-plus-square"></i><h3>Sin productos</h3><p>No hay productos registrados.</p></div>';
      return;
    }

    const grouped = {};
    for (const item of inventory) {
      if (!grouped[item.category_name]) grouped[item.category_name] = [];
      grouped[item.category_name].push(item);
    }

    const categoryOrder = ['Canasta', 'Nevera'];
    let html = '';

    for (const catName of categoryOrder) {
      const items = grouped[catName];
      if (!items) continue;

      html += '<div class="category-section">';
      html += '<div class="category-heading">' +
        '<i class="' + (catName === 'Canasta' ? 'ph-light ph-shopping-cart-simple' : 'ph-light ph-snowflake') + '"></i>' +
        '<h3>' + catName + '</h3>' +
      '</div>';

      for (const item of items) {
        html += '<div class="product-row-restock" data-product-id="' + item.product_id + '">' +
          '<div class="product-info">' +
            '<div class="product-name-text">' + item.product_name + '</div>' +
            '<div class="product-details-row">' +
              '<span class="product-qty-label">Actual: ' + item.quantity + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="product-restock-controls">' +
            '<button class="qty-btn restock-qty-minus" type="button" data-pid="' + item.product_id + '">&minus;</button>' +
            '<input class="qty-input restock-qty-input" type="number" min="0" value="0" data-pid="' + item.product_id + '" />' +
            '<button class="qty-btn restock-qty-plus" type="button" data-pid="' + item.product_id + '">+</button>' +
            '<span class="restock-preview" data-pid="' + item.product_id + '">→ ' + item.quantity + '</span>' +
          '</div>' +
        '</div>';
      }
      html += '</div>';
    }

    el.restockProducts.innerHTML = html;

    el.restockProducts.querySelectorAll('.restock-qty-minus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = Number(btn.dataset.pid);
        changeRestockQty(pid, -1);
      });
    });
    el.restockProducts.querySelectorAll('.restock-qty-plus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = Number(btn.dataset.pid);
        changeRestockQty(pid, 1);
      });
    });
    el.restockProducts.querySelectorAll('.restock-qty-input').forEach((input) => {
      input.addEventListener('change', () => {
        const pid = Number(input.dataset.pid);
        const val = Math.max(0, parseInt(input.value, 10) || 0);
        setRestockQty(pid, val);
      });
      input.addEventListener('focus', function() { this.select(); });
    });
  }

  function changeRestockQty(productId, delta) {
    const input = el.restockProducts.querySelector('.restock-qty-input[data-pid="' + productId + '"]');
    if (!input) return;
    const current = Number(input.value) || 0;
    const val = Math.max(0, current + delta);
    setRestockQty(productId, val);
  }

  function setRestockQty(productId, value) {
    const input = el.restockProducts.querySelector('.restock-qty-input[data-pid="' + productId + '"]');
    const preview = el.restockProducts.querySelector('.restock-preview[data-pid="' + productId + '"]');
    if (!input) return;
    input.value = value;
    if (preview) {
      const item = inventory.find(i => i.product_id === productId);
      const current = item ? item.quantity : 0;
      preview.textContent = '\u2192 ' + (current + value);
    }
  }

  function getRestockItems() {
    const items = [];
    el.restockProducts.querySelectorAll('.restock-qty-input').forEach((input) => {
      const qty = Number(input.value) || 0;
      if (qty > 0) items.push({ productId: Number(input.dataset.pid), quantity: qty });
    });
    return items;
  }

  async function saveRestock() {
    if (!selectedRoomId) {
      el.restockStatus.textContent = 'Error: No hay habitaci\u00f3n seleccionada.';
      el.restockStatus.className = 'status error';
      return;
    }
    const items = getRestockItems();
    if (items.length === 0) {
      el.restockStatus.textContent = 'Selecciona al menos un producto y cantidad a reponer.';
      el.restockStatus.className = 'status error';
      return;
    }

    el.restockStatus.textContent = 'Guardando reposici\u00f3n...';
    el.restockStatus.className = 'status';
    el.saveRestockBtn.disabled = true;

    try {
      const result = await apiFetch('/api/minibar/restock', {
        method: 'POST',
        body: JSON.stringify({ roomId: selectedRoomId, items })
      });
      el.restockStatus.textContent = result.message;
      el.restockStatus.className = 'status success';
      await loadInventory(selectedRoomId);
      renderRestockForm();
    } catch (err) {
      el.restockStatus.textContent = 'Error: ' + err.message;
      el.restockStatus.className = 'status error';
    } finally {
      el.saveRestockBtn.disabled = false;
    }
  }

  // ============ ADJUST FORM ============

  function renderAdjustForm() {
    if (!inventory.length) {
      el.adjustProducts.innerHTML = '<div class="empty-state"><i class="ph-light ph-wrench"></i><h3>Sin productos</h3><p>No hay productos registrados.</p></div>';
      return;
    }

    const grouped = {};
    for (const item of inventory) {
      if (!grouped[item.category_name]) grouped[item.category_name] = [];
      grouped[item.category_name].push(item);
    }

    const categoryOrder = ['Canasta', 'Nevera'];
    let html = '';

    for (const catName of categoryOrder) {
      const items = grouped[catName];
      if (!items) continue;

      html += '<div class="category-section">';
      html += '<div class="category-heading">' +
        '<i class="' + (catName === 'Canasta' ? 'ph-light ph-shopping-cart-simple' : 'ph-light ph-snowflake') + '"></i>' +
        '<h3>' + catName + '</h3>' +
      '</div>';

      for (const item of items) {
        html += '<div class="product-row-adjust" data-product-id="' + item.product_id + '">' +
          '<div class="product-info">' +
            '<div class="product-name-text">' + item.product_name + '</div>' +
            '<div class="product-details-row">' +
              '<span class="product-qty-label">Actual: ' + item.quantity + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="product-adjust-controls">' +
            '<input class="qty-input adjust-qty-input" type="number" min="0" value="' + item.quantity + '" data-pid="' + item.product_id + '" />' +
            '<span class="adjust-hint" data-i18n="minibarAdjustHint">Nueva cantidad</span>' +
          '</div>' +
        '</div>';
      }
      html += '</div>';
    }

    el.adjustProducts.innerHTML = html;

    el.adjustProducts.querySelectorAll('.adjust-qty-input').forEach((input) => {
      input.addEventListener('change', () => {
        const val = Math.max(0, parseInt(input.value, 10) || 0);
        input.value = val;
      });
      input.addEventListener('focus', function() { this.select(); });
    });
  }

  function getAdjustItems() {
    const items = [];
    el.adjustProducts.querySelectorAll('.adjust-qty-input').forEach((input) => {
      const qty = Number(input.value) || 0;
      const item = inventory.find(i => i.product_id === Number(input.dataset.pid));
      const current = item ? item.quantity : 0;
      if (qty !== current) items.push({ productId: Number(input.dataset.pid), quantity: qty });
    });
    return items;
  }

  async function saveAdjust() {
    if (!selectedRoomId) {
      el.adjustStatus.textContent = 'Error: No hay habitaci\u00f3n seleccionada.';
      el.adjustStatus.className = 'status error';
      return;
    }
    const items = getAdjustItems();
    if (items.length === 0) {
      el.adjustStatus.textContent = 'No hay cambios para guardar.';
      el.adjustStatus.className = 'status error';
      return;
    }

    el.adjustStatus.textContent = 'Guardando ajuste...';
    el.adjustStatus.className = 'status';
    el.saveAdjustBtn.disabled = true;

    try {
      const result = await apiFetch('/api/minibar/adjust', {
        method: 'POST',
        body: JSON.stringify({ roomId: selectedRoomId, items })
      });
      el.adjustStatus.textContent = result.message;
      el.adjustStatus.className = 'status success';
      await loadInventory(selectedRoomId);
      renderAdjustForm();
    } catch (err) {
      el.adjustStatus.textContent = 'Error: ' + err.message;
      el.adjustStatus.className = 'status error';
    } finally {
      el.saveAdjustBtn.disabled = false;
    }
  }

  // ============ HISTORY ============

  async function loadAndRenderHistory() {
    if (!selectedRoomId) {
      el.historyContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-clock-counter-clockwise"></i><h3>Sin historial</h3><p>Selecciona una habitaci\u00f3n primero.</p></div>';
      return;
    }

    el.historyContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando...</h3></div>';

    try {
      movements = await apiFetch('/api/minibar/movements/' + selectedRoomId);
      renderHistory();
    } catch (err) {
      el.historyContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderHistory() {
    if (!movements.length) {
      el.historyContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-clock-counter-clockwise"></i><h3>Sin movimientos</h3><p>No hay movimientos registrados para esta habitaci\u00f3n.</p></div>';
      return;
    }

    const typeLabels = {
      consumption: 'Consumo',
      restock: 'Reposici\u00f3n',
      adjustment: 'Ajuste'
    };
    const typeIcons = {
      consumption: 'ph-light ph-shopping-bag',
      restock: 'ph-light ph-plus-square',
      adjustment: 'ph-light ph-wrench'
    };
    const typeClasses = {
      consumption: 'movement-consumption',
      restock: 'movement-restock',
      adjustment: 'movement-adjustment'
    };

    let html = '<div class="movements-table"><table><thead><tr>' +
      '<th>Fecha</th><th>Tipo</th><th>Producto</th><th>Antes</th><th>Movido</th><th>Despu\u00e9s</th><th>Usuario</th><th></th>' +
      '</tr></thead><tbody>';

    for (const m of movements) {
      const date = new Date(m.created_at);
      const dateStr = date.toLocaleDateString('es-CO');
      const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      const isVoidType = m.movement_type === 'void';

      html += '<tr class="' + (typeClasses[m.movement_type] || '') + (isVoidType ? ' movement-void' : '') + '">' +
        '<td class="movement-date">' + dateStr + ' ' + timeStr + '</td>' +
        '<td><span class="movement-type-badge ' + m.movement_type + '"><i class="' + (typeIcons[m.movement_type] || 'ph-light ph-arrow-u-up-left') + '"></i> ' + (typeLabels[m.movement_type] || m.movement_type) + '</span></td>' +
        '<td>' + m.product_name + (m.notes ? '<br><small style="color:#999;">' + m.notes + '</small>' : '') + '</td>' +
        '<td class="movement-qty">' + m.quantity_before + '</td>' +
        '<td class="movement-qty ' + (m.quantity_moved > 0 ? 'movement-positive' : 'movement-negative') + '">' + (m.quantity_moved > 0 ? '+' : '') + m.quantity_moved + '</td>' +
        '<td class="movement-qty">' + m.quantity_after + '</td>' +
        '<td>' + (m.user_name || '&mdash;') + '</td>' +
        '<td>' + (!isVoidType && m.movement_type !== 'void' ? '<button class="btn-icon btn-void-movement" data-id="' + m.id + '" title="Anular movimiento"><i class="ph-light ph-arrow-u-up-left"></i></button>' : '') + '</td>' +
      '</tr>';
    }

    html += '</tbody></table></div>';
    el.historyContainer.innerHTML = html;

    el.historyContainer.querySelectorAll('.btn-void-movement').forEach((btn) => {
      btn.addEventListener('click', () => voidMovement(Number(btn.dataset.id)));
    });
  }

  async function voidMovement(movementId) {
    if (!confirm('\u00bfEst\u00e1s seguro de anular este movimiento? Se restaurar\u00e1 el inventario al estado anterior.')) return;
    if (!confirm('\u00bfRealmente deseas continuar? Esta acci\u00f3n no se puede deshacer.')) return;
    try {
      const result = await apiFetch('/api/admin/movements/' + movementId + '/void', { method: 'POST' });
      alert(result.message);
      await loadAndRenderHistory();
      await loadInventory(selectedRoomId);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  // ============ REPORTS ============

  async function generateReport() {
    const from = el.reportFrom.value;
    const to = el.reportTo.value;

    if (!from || !to) {
      el.reportStatus.textContent = 'Selecciona fecha inicial y final.';
      el.reportStatus.className = 'status error';
      return;
    }

    el.reportResult.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Generando reporte...</h3></div>';
    el.reportStatus.textContent = '';
    el.reportStatus.className = 'status';

    try {
      const data = await apiFetch('/api/minibar/reports?from=' + from + '&to=' + to);
      renderReport(data);
    } catch (err) {
      el.reportResult.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error</h3><p>' + err.message + '</p></div>';
      el.reportStatus.textContent = 'Error al generar reporte.';
      el.reportStatus.className = 'status error';
    }
  }

  function renderReport(data) {
    const s = data.summary;
    let html = '';

    // Summary cards
    html += '<div class="report-summary-cards">';
    const cards = [
      { label: 'Total consumido', value: formatCOP(s.totalAmount), icon: 'ph-light ph-currency-circle-dollar' },
      { label: 'Productos consumidos', value: String(s.totalProducts), icon: 'ph-light ph-shopping-bag' },
      { label: 'Movimientos', value: String(s.totalMovements), icon: 'ph-light ph-list-dashes' },
      { label: 'Habitaciones', value: String(s.totalRoomsWithConsumption), icon: 'ph-light ph-bed' }
    ];
    for (const card of cards) {
      html += '<div class="report-card">' +
        '<div class="report-card-icon"><i class="' + card.icon + '"></i></div>' +
        '<div class="report-card-value">' + card.value + '</div>' +
        '<div class="report-card-label">' + card.label + '</div>' +
      '</div>';
    }
    html += '</div>';

    // Category breakdown
    html += '<div class="report-section"><h3 class="report-section-title">Consumo por categor\u00eda</h3>';
    for (const cat of s.categoryBreakdown) {
      html += '<div class="report-row"><span class="report-row-label">' + cat.name + '</span><span class="report-row-value">' + formatCOP(cat.total) + '</span></div>';
    }
    html += '</div>';

    // Floor breakdown
    html += '<div class="report-section"><h3 class="report-section-title">Consumo por piso</h3>';
    for (const f of s.floorBreakdown) {
      html += '<div class="report-row"><span class="report-row-label">' + f.floorName + '</span><span class="report-row-value">' + formatCOP(f.total) + '</span></div>';
    }
    html += '</div>';

    // Top 5 rooms
    if (s.top5Rooms && s.top5Rooms.length) {
      html += '<div class="report-section"><h3 class="report-section-title">Top 5 habitaciones que m\u00e1s consumieron</h3>';
      html += '<div class="report-ranking">';
      s.top5Rooms.forEach((r, i) => {
        html += '<div class="report-rank-item"><span class="report-rank-num">#' + (i + 1) + '</span><span class="report-rank-label">Habitaci\u00f3n ' + r.roomNumber + '</span><span class="report-rank-value">' + formatCOP(r.total) + '</span></div>';
      });
      html += '</div></div>';
    }

    // Most consumed products
    if (s.mostConsumedProducts && s.mostConsumedProducts.length) {
      html += '<div class="report-section"><h3 class="report-section-title">Productos m\u00e1s consumidos</h3>';
      html += '<div class="report-ranking">';
      s.mostConsumedProducts.forEach((p, i) => {
        html += '<div class="report-rank-item"><span class="report-rank-num">#' + (i + 1) + '</span><span class="report-rank-label">' + p.name + '</span><span class="report-rank-value">' + p.items + ' uds</span></div>';
      });
      html += '</div></div>';
    }

    // Products without consumption
    if (s.noConsumptionProducts && s.noConsumptionProducts.length) {
      html += '<div class="report-section"><h3 class="report-section-title">Productos sin consumo</h3>';
      html += '<p class="report-muted">' + s.noConsumptionProducts.map(p => p.name).join(', ') + '</p></div>';
    }

    // Rooms without consumption
    if (s.noConsumptionRooms && s.noConsumptionRooms.length) {
      html += '<div class="report-section"><h3 class="report-section-title">Habitaciones sin consumo</h3>';
      html += '<p class="report-muted">' + s.noConsumptionRooms.map(r => 'Hab. ' + r.room_number).join(', ') + '</p></div>';
    }

    // Observations
    if (data.observations && data.observations.length) {
      html += '<div class="report-section"><h3 class="report-section-title">Observaciones</h3><ul class="report-observations">';
      for (const obs of data.observations) {
        html += '<li>' + obs + '</li>';
      }
      html += '</ul></div>';
    }

    html += '<p class="report-generated-at">Generado: ' + new Date(s.generatedAt).toLocaleString('es-CO') + '</p>';

    el.reportResult.innerHTML = html;
    el.reportStatus.textContent = 'Reporte generado correctamente.';
    el.reportStatus.className = 'status success';
  }

  async function downloadReportPdf() {
    const from = el.reportFrom.value;
    const to = el.reportTo.value;

    if (!from || !to) {
      el.reportStatus.textContent = 'Selecciona fecha inicial y final.';
      el.reportStatus.className = 'status error';
      return;
    }

    el.reportStatus.textContent = 'Generando PDF...';
    el.reportStatus.className = 'status';

    try {
      const res = await fetch('/api/minibar/reports/pdf?from=' + from + '&to=' + to, {
        credentials: 'same-origin'
      });
      if (!res.ok) throw new Error('Error al generar PDF');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'informe-consumos-' + from + '-' + to + '.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      el.reportStatus.textContent = 'PDF descargado correctamente.';
      el.reportStatus.className = 'status success';
    } catch (err) {
      el.reportStatus.textContent = 'Error: ' + err.message;
      el.reportStatus.className = 'status error';
    }
  }

  // ============ WHATSAPP PREVIEW MODAL ============

  function openWhatsAppWithMessage(message) {
    const encodedMessage = encodeURIComponent(message);
    const url = 'https://wa.me/?text=' + encodedMessage;
    window.open(url, '_blank');
  }

  function closePreviewModal() {
    el.previewModal.classList.remove('visible');
    el.previewModal.setAttribute('aria-hidden', 'true');
  }

  // ============ EVENTS ============

  el.backToFloorsBtn.addEventListener('click', goBackToFloors);
  el.backToRoomsBtn.addEventListener('click', goBackToRooms);

  // Dashboard
  if (el.dashGoFloorsBtn) {
    el.dashGoFloorsBtn.addEventListener('click', () => {
      showView('view-floors');
      updateBreadcrumb('view-floors');
      renderFloors();
    });
  }
  if (el.dashRefreshBtn) {
    el.dashRefreshBtn.addEventListener('click', loadDashboard);
  }

  // Tabs
  document.querySelectorAll('.room-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  // Inventory
  el.refreshInventoryBtn.addEventListener('click', async () => {
    await loadInventory(selectedRoomId);
    renderInventory();
  });

  // Consumption
  el.saveConsumptionBtn.addEventListener('click', () => saveConsumption(false));
  el.saveAndSendBtn.addEventListener('click', () => saveConsumption(true));

  // Restock
  el.saveRestockBtn.addEventListener('click', saveRestock);

  // Adjust
  el.saveAdjustBtn.addEventListener('click', saveAdjust);

  // History
  el.refreshHistoryBtn.addEventListener('click', loadAndRenderHistory);

  // Reports
  el.generateReportBtn.addEventListener('click', generateReport);
  el.downloadReportPdfBtn.addEventListener('click', downloadReportPdf);

  // Preview modal
  el.closePreviewBtn.addEventListener('click', closePreviewModal);
  el.closePreviewBtn2.addEventListener('click', closePreviewModal);
  el.previewModal.addEventListener('click', (e) => {
    if (e.target === el.previewModal) closePreviewModal();
  });

  el.previewCopyBtn.addEventListener('click', async () => {
    const text = el.previewContent.textContent || '';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      el.consumptionStatus.textContent = 'Mensaje copiado al portapapeles.';
      el.consumptionStatus.className = 'status success';
    } catch (e) {
      el.consumptionStatus.textContent = 'No se pudo copiar.';
      el.consumptionStatus.className = 'status error';
    }
  });

  el.previewSendBtn.addEventListener('click', () => {
    const message = el.previewContent.textContent || '';
    if (message) {
      openWhatsAppWithMessage(message);
    }
    closePreviewModal();
  });

  // ============ INIT ============

  if (typeof initTheme === 'function') initTheme();
  if (typeof initLanguage === 'function') initLanguage();
  if (typeof setupThemeSwitcher === 'function') setupThemeSwitcher(document.getElementById('app-theme-switcher'));
  if (typeof setupLangSelector === 'function') setupLangSelector(document.getElementById('app-lang-selector'));

  // Start with dashboard
  goToDashboard();
  loadFloors();
})();
