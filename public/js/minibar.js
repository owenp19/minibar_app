(function () {
  'use strict';

  let floors = [];
  let rooms = [];
  let inventory = [];
  let selectedFloorId = null;
  let selectedRoomId = null;
  let originalInventoryData = [];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const el = {
    viewFloors: $('#view-floors'),
    viewRooms: $('#view-rooms'),
    viewInventory: $('#view-inventory'),
    floorsContainer: $('#floors-container'),
    roomsContainer: $('#rooms-container'),
    roomsHeading: $('#rooms-heading'),
    roomsSubtitle: $('#rooms-subtitle'),
    inventoryContainer: $('#inventory-container'),
    invFloorName: $('#inv-floor-name'),
    invRoomName: $('#inv-room-name'),
    saveStatus: $('#save-status'),
    backToFloorsBtn: $('#back-to-floors-btn'),
    backToRoomsBtn: $('#back-to-rooms-btn'),
    saveInventoryBtn: $('#save-inventory-btn'),
    resetInventoryBtn: $('#reset-inventory-btn'),
    breadcrumb: $('#breadcrumb'),
    pageDescription: $('#page-description'),
  };

  function showView(viewId) {
    $$('.view-section').forEach((v) => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
  }

  function updateBreadcrumb(view, floorName, roomNumber) {
    if (!el.breadcrumb) return;
    if (view === 'view-floors') {
      el.breadcrumb.innerHTML = `
        <span class="crumb">
          <i class="ri-home-5-line"></i>
          <span class="crumb-current">Minibares</span>
        </span>
      `;
      if (el.pageDescription) {
        el.pageDescription.textContent = 'Selecciona un piso para ver sus habitaciones y revisar el inventario del minibar.';
      }
    } else if (view === 'view-rooms') {
      el.breadcrumb.innerHTML = `
        <span class="crumb">
          <i class="ri-home-5-line"></i>
          <span class="crumb-link" id="crumb-link-floors">Minibares</span>
        </span>
        <span class="crumb-sep"><i class="ri-arrow-right-s-line"></i></span>
        <span class="crumb">
          <span class="crumb-current">${floorName || 'Piso'}</span>
        </span>
      `;
      const link = document.getElementById('crumb-link-floors');
      if (link) {
        link.addEventListener('click', () => {
          goBackToFloors();
        });
      }
      if (el.pageDescription) {
        el.pageDescription.textContent = `Selecciona una habitación del ${floorName} para ver su inventario.`;
      }
    } else if (view === 'view-inventory') {
      el.breadcrumb.innerHTML = `
        <span class="crumb">
          <i class="ri-home-5-line"></i>
          <span class="crumb-link" id="crumb-link-floors-inv">Minibares</span>
        </span>
        <span class="crumb-sep"><i class="ri-arrow-right-s-line"></i></span>
        <span class="crumb">
          <span class="crumb-link" id="crumb-link-rooms-inv">${floorName || 'Piso'}</span>
        </span>
        <span class="crumb-sep"><i class="ri-arrow-right-s-line"></i></span>
        <span class="crumb">
          <span class="crumb-current">Habitación ${roomNumber || ''}</span>
        </span>
      `;
      const linkFloors = document.getElementById('crumb-link-floors-inv');
      if (linkFloors) {
        linkFloors.addEventListener('click', () => {
          goBackToFloors();
        });
      }
      const linkRooms = document.getElementById('crumb-link-rooms-inv');
      if (linkRooms) {
        linkRooms.addEventListener('click', () => {
          goBackToRooms();
        });
      }
      if (el.pageDescription) {
        el.pageDescription.textContent = `Revisando inventario de ${floorName}, Habitación ${roomNumber}.`;
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
      throw new Error(body.error || `Error ${res.status}`);
    }
    return res.json();
  }

  // ============ NAVIGATION HELPERS ============

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
    if (selectedFloorId) {
      loadRooms(selectedFloorId);
    } else {
      renderRooms();
    }
  }

  function getFloorName(floorId) {
    const floor = floors.find((f) => f.id === floorId);
    return floor ? floor.name : 'Piso';
  }

  function getRoomNumber(roomId) {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.room_number : '';
  }

  // ============ FLOORS ============

  async function loadFloors() {
    try {
      floors = await apiFetch('/api/minibar/floors');
      renderFloors();
    } catch (err) {
      el.floorsContainer.innerHTML = `<div class="empty-state"><i class="ri-error-warning-line"></i><h3>Error al cargar</h3><p>${err.message}</p></div>`;
    }
  }

  function renderFloors() {
    if (!floors.length) {
      el.floorsContainer.innerHTML = `<div class="empty-state"><i class="ri-building-2-line"></i><h3>Sin pisos</h3><p>No hay pisos disponibles.</p></div>`;
      return;
    }
    el.floorsContainer.innerHTML = floors
      .map(
        (f) => `
      <div class="floor-card${selectedFloorId === f.id ? ' active' : ''}" data-floor-id="${f.id}">
        <i class="ri-building-2-line"></i>
        <div class="floor-label">${f.name}</div>
      </div>
    `
      )
      .join('');

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
    el.roomsSubtitle.textContent = `Selecciona una habitación del ${floorName} para ver su inventario.`;

    try {
      rooms = await apiFetch(`/api/minibar/rooms/${floorId}`);
      renderRooms();
    } catch (err) {
      el.roomsContainer.innerHTML = `<div class="empty-state"><i class="ri-error-warning-line"></i><h3>Error</h3><p>${err.message}</p></div>`;
    }
  }

  function renderRooms() {
    if (!rooms.length) {
      el.roomsContainer.innerHTML = `<div class="empty-state"><i class="ri-hotel-bed-line"></i><h3>Sin habitaciones</h3><p>No hay habitaciones registradas en este piso.</p></div>`;
      return;
    }
    el.roomsContainer.innerHTML = rooms
      .map(
        (r) => `
      <div class="room-card${selectedRoomId === r.id ? ' active' : ''}" data-room-id="${r.id}">
        ${r.room_number}
      </div>
    `
      )
      .join('');

    el.roomsContainer.querySelectorAll('.room-card').forEach((card) => {
      card.addEventListener('click', () => onRoomClick(Number(card.dataset.roomId)));
    });
  }

  async function onRoomClick(roomId) {
    selectedRoomId = roomId;
    renderRooms();
    showView('view-inventory');
    updateBreadcrumb('view-inventory', getFloorName(selectedFloorId), getRoomNumber(roomId));
    await loadInventory(roomId);
  }

  // ============ INVENTORY ============

  async function loadInventory(roomId) {
    const floorName = getFloorName(selectedFloorId);
    const roomNumber = getRoomNumber(roomId);

    el.invFloorName.textContent = floorName;
    el.invRoomName.textContent = roomNumber ? `Habitación ${roomNumber}` : '—';
    el.saveStatus.textContent = '';
    el.saveStatus.className = 'save-status';

    try {
      inventory = await apiFetch(`/api/minibar/inventory/${roomId}`);
      originalInventoryData = inventory.map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
      renderInventory();
    } catch (err) {
      el.inventoryContainer.innerHTML = `<div class="empty-state"><i class="ri-error-warning-line"></i><h3>Error</h3><p>${err.message}</p></div>`;
    }
  }

  function renderInventory() {
    if (!inventory.length) {
      el.inventoryContainer.innerHTML = `<div class="empty-state"><i class="ri-fridge-line"></i><h3>Sin productos</h3><p>No hay productos registrados para esta habitación.</p></div>`;
      return;
    }

    const grouped = {};
    for (const item of inventory) {
      if (!grouped[item.category_name]) {
        grouped[item.category_name] = [];
      }
      grouped[item.category_name].push(item);
    }

    const categoryOrder = ['Canasta', 'Nevera'];
    let html = '';
    for (const catName of categoryOrder) {
      const items = grouped[catName];
      if (!items) continue;

      html += `<div class="category-section">`;
      html += `<div class="category-heading">
        <i class="${catName === 'Canasta' ? 'ri-shopping-basket-line' : 'ri-snowy-line'}"></i>
        <h3>${catName}</h3>
        <span class="cat-count">${items.length} producto${items.length !== 1 ? 's' : ''}</span>
      </div>`;

      for (const item of items) {
        const isModified = originalInventoryData.some(
          (o) => o.product_id === item.product_id && o.quantity !== item.quantity
        );
        const isAgotado = item.quantity === 0;
        html += `
          <div class="product-row-minibar${isModified ? ' modified' : ''}${isAgotado ? ' agotado' : ''}" data-product-id="${item.product_id}">
            <div class="product-info">
              <div class="product-name-text">
                ${item.product_name}
                ${isAgotado ? '<span class="product-agotado-badge"><i class="ri-alert-line"></i>Agotado</span>' : ''}
              </div>
              <div class="product-default">
                Cantidad inicial: ${item.default_quantity}
                ${isModified ? '<span class="modified-badge"><i class="ri-edit-line"></i> Modificado</span>' : ''}
              </div>
            </div>
            <div class="product-controls">
              <button class="qty-btn qty-minus" data-product-id="${item.product_id}" type="button">−</button>
              <input class="qty-input" type="number" min="0" value="${item.quantity}" data-product-id="${item.product_id}" />
              <button class="qty-btn qty-plus" data-product-id="${item.product_id}" type="button">+</button>
            </div>
          </div>
        `;
      }
      html += `</div>`;
    }

    el.inventoryContainer.innerHTML = html;

    el.inventoryContainer.querySelectorAll('.qty-minus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = Number(btn.dataset.productId);
        changeQty(pid, -1);
      });
    });
    el.inventoryContainer.querySelectorAll('.qty-plus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = Number(btn.dataset.productId);
        changeQty(pid, 1);
      });
    });
    el.inventoryContainer.querySelectorAll('.qty-input').forEach((input) => {
      input.addEventListener('change', () => {
        const pid = Number(input.dataset.productId);
        const val = Math.max(0, parseInt(input.value, 10) || 0);
        setQty(pid, val);
      });
      input.addEventListener('focus', () => {
        input.select();
      });
    });

    checkUnsavedChanges();
  }

  function changeQty(productId, delta) {
    const item = inventory.find((i) => i.product_id === productId);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    setQty(productId, newQty);
  }

  function setQty(productId, value) {
    const item = inventory.find((i) => i.product_id === productId);
    if (!item) return;
    item.quantity = value;

    const row = el.inventoryContainer.querySelector(`.product-row-minibar[data-product-id="${productId}"]`);
    if (row) {
      const input = row.querySelector('.qty-input');
      if (input) input.value = value;

      const isModified = originalInventoryData.some(
        (o) => o.product_id === productId && o.quantity !== value
      );
      row.classList.toggle('modified', isModified);

      const isAgotado = value === 0;
      row.classList.toggle('agotado', isAgotado);
      const nameDiv = row.querySelector('.product-name-text');
      if (nameDiv) {
        const existingBadge = nameDiv.querySelector('.product-agotado-badge');
        if (isAgotado && !existingBadge) {
          nameDiv.innerHTML += '<span class="product-agotado-badge"><i class="ri-alert-line"></i>Agotado</span>';
        } else if (!isAgotado && existingBadge) {
          existingBadge.remove();
        }
      }
    }

    checkUnsavedChanges();
  }

  function checkUnsavedChanges() {
    const hasChanges = inventory.some((item) => {
      const orig = originalInventoryData.find((o) => o.product_id === item.product_id);
      return !orig || orig.quantity !== item.quantity;
    });
    if (hasChanges) {
      el.saveStatus.textContent = '⚠️ No olvides guardar los cambios';
      el.saveStatus.className = 'save-status warning';
    } else {
      el.saveStatus.textContent = '';
      el.saveStatus.className = 'save-status';
    }
  }

  async function saveInventory() {
    const items = inventory.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
    }));
    try {
      el.saveInventoryBtn.disabled = true;
      el.saveInventoryBtn.innerHTML = '<i class="ri-loader-4-line spinning"></i> Guardando…';
      const result = await apiFetch(`/api/minibar/inventory/${selectedRoomId}`, {
        method: 'PUT',
        body: JSON.stringify({ items }),
      });
      originalInventoryData = items;
      renderInventory();
      el.saveStatus.textContent = '✅ ' + result.message;
      el.saveStatus.className = 'save-status success';
      setTimeout(() => {
        if (el.saveStatus.className.includes('success')) {
          el.saveStatus.textContent = '📋 Inventario actualizado';
        }
      }, 3000);
    } catch (err) {
      el.saveStatus.textContent = '❌ Error: ' + err.message;
      el.saveStatus.className = 'save-status error';
    } finally {
      el.saveInventoryBtn.disabled = false;
      el.saveInventoryBtn.innerHTML = '<i class="ri-save-3-line"></i> Guardar cambios';
    }
  }

  async function resetInventory() {
    if (!confirm('¿Restablecer todos los valores a las cantidades iniciales?')) return;
    try {
      for (const item of inventory) {
        item.quantity = item.default_quantity;
      }
      originalInventoryData = inventory.map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
      renderInventory();
      el.saveStatus.textContent = '📋 Valores restablecidos. Guarda los cambios si deseas mantenerlos.';
      el.saveStatus.className = 'save-status warning';
    } catch (err) {
      el.saveStatus.textContent = '❌ Error: ' + err.message;
      el.saveStatus.className = 'save-status error';
    }
  }

  // ============ NAVIGATION EVENTS ============

  el.backToFloorsBtn.addEventListener('click', goBackToFloors);
  el.backToRoomsBtn.addEventListener('click', goBackToRooms);
  el.saveInventoryBtn.addEventListener('click', saveInventory);
  el.resetInventoryBtn.addEventListener('click', resetInventory);

  // ============ INIT ============

  if (typeof initTheme === 'function') initTheme();
  if (typeof initLanguage === 'function') initLanguage();
  if (typeof setupThemeSwitcher === 'function') setupThemeSwitcher(document.getElementById('app-theme-switcher'));
  if (typeof setupLangSelector === 'function') setupLangSelector(document.getElementById('app-lang-selector'));

  loadFloors();
})();
