(function () {
  'use strict';

  function normalizeDateStr(val) {
    if (!val) return '';
    if (val instanceof Date) {
      if (isNaN(val)) return '';
      return val.getFullYear() + '-' + String(val.getMonth() + 1).padStart(2, '0') + '-' + String(val.getDate()).padStart(2, '0');
    }
    var s = String(val);
    if (s.indexOf('T') !== -1) s = s.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return '';
  }

  let floors = [];
  let rooms = [];
  let inventory = [];
  let selectedFloorId = null;
  let selectedRoomId = null;
  let selectedProducts = new Map();

  const LOSS_TYPES = [
    { value: 'perdida', label: 'Perdida' },
    { value: 'dano', label: 'Daño' }
  ];

  const OBSERVATION_PRESETS = [
    'Producto faltante al revisar la habitación.',
    'Huésped no reportó consumo.',
    'Producto dañado o no encontrado.',
    'Faltante detectado durante revisión de salida.',
    'Novedad reportada por camarería.'
  ];

  const RECORD_STATUSES = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'cerrado', label: 'Cerrado' }
  ];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const el = {
    viewFloors: $('#view-floors'),
    viewRooms: $('#view-rooms'),
    viewProducts: $('#view-products'),
    floorsContainer: $('#floors-container'),
    roomsContainer: $('#rooms-container'),
    roomsSubtitle: $('#rooms-subtitle'),
    productsContainer: $('#products-container'),
    productsSubtitle: $('#products-subtitle'),
    backToFloorsBtn: $('#back-to-floors-btn'),
    backToRoomsBtn: $('#back-to-rooms-btn'),
    lossTotal: $('#loss-total'),
    lossUnitsTotal: $('#loss-units-total'),
    lossSummaryBar: $('#loss-summary-bar'),
    registerLossBtn: $('#register-loss-btn'),
    successModal: $('#success-modal'),
    successMessage: $('#success-message'),
    errorModal: $('#error-modal'),
    errorMessage: $('#error-message'),
    pageDescription: $('#page-description'),
    breadcrumb: $('#breadcrumb')
  };

  function apiFetch(url, options = {}) {
    return fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Error ' + res.status);
      }
      return res.json();
    });
  }

  function formatCOP(value) {
    const n = Number(value) || 0;
    return '$' + Math.round(n).toLocaleString('es-CO') + ' COP';
  }

  function showView(viewId) {
    $$('.view-section').forEach((v) => v.style.display = 'none');
    const view = $('#' + viewId);
    if (view) view.style.display = 'block';
  }

  function updateBreadcrumb(text) {
    if (el.breadcrumb) {
      el.breadcrumb.innerHTML = '<span class="crumb"><i class="ph-light ph-house"></i><span class="crumb-current">' + text + '</span></span>';
    }
  }

  function showSuccess(msg) {
    el.successMessage.textContent = msg;
    el.successModal.style.display = '';
    el.successModal.classList.add('visible');
  }

  function showError(msg) {
    el.errorMessage.textContent = msg;
    el.errorModal.style.display = '';
    el.errorModal.classList.add('visible');
  }

  function closeModals() {
    $$('.modal-overlay').forEach((m) => {
      m.style.display = 'none';
      m.classList.remove('visible');
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.modal-close-trigger')) closeModals();
    if (e.target.classList.contains('modal-overlay')) closeModals();
  });

  // ============ FLOORS ============

  async function loadFloors() {
    showView('view-floors');
    updateBreadcrumb('Pérdidas');
    el.pageDescription.textContent = 'Selecciona un piso para registrar pérdidas o daños.';
    el.floorsContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando pisos...</h3></div>';
    try {
      floors = await apiFetch('/api/perdidas/floors');
      // Only show floors 2-6
      floors = floors.filter(f => f.floor_number >= 2 && f.floor_number <= 6);
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
      card.addEventListener('click', () => {
        selectedFloorId = Number(card.dataset.floorId);
        loadRooms(selectedFloorId);
      });
    });
  }

  // ============ ROOMS ============

  async function loadRooms(floorId) {
    showView('view-rooms');
    updateBreadcrumb('Pérdidas > Habitaciones');
    const floor = floors.find((f) => f.id === floorId);
    el.roomsSubtitle.textContent = floor ? 'Habitaciones de ' + floor.name : 'Habitaciones del piso seleccionado.';
    el.roomsContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando habitaciones...</h3></div>';
    try {
      rooms = await apiFetch('/api/perdidas/rooms/' + floorId);
      renderRooms();
    } catch (err) {
      el.roomsContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error al cargar</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderRooms() {
    if (!rooms.length) {
      el.roomsContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-bed"></i><h3>Sin habitaciones</h3><p>No hay habitaciones en este piso.</p></div>';
      return;
    }
    el.roomsContainer.innerHTML = rooms.map((r) =>
      '<div class="room-card" data-room-id="' + r.id + '">' +
        '<div class="room-card-number">' + r.room_number + '</div>' +
      '</div>'
    ).join('');

    el.roomsContainer.querySelectorAll('.room-card').forEach((card) => {
      card.addEventListener('click', () => {
        selectedRoomId = Number(card.dataset.roomId);
        loadProducts(selectedRoomId);
      });
    });
  }

  // ============ PRODUCTS ============

  function initObservationPresets() {
    const container = document.getElementById('observation-presets');
    if (!container) return;
    container.innerHTML = OBSERVATION_PRESETS.map(text =>
      '<button class="btn-ghost btn-xs chip-btn" type="button">' + text + '</button>'
    ).join('');
    container.querySelectorAll('.chip-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const textarea = document.getElementById('loss-general-notes');
        if (textarea) {
          const current = textarea.value.trim();
          textarea.value = current ? current + '\n' + btn.textContent : btn.textContent;
          textarea.focus();
        }
      });
    });
  }

  function initStatusSelector() {
    const sel = document.getElementById('record-status-select');
    if (!sel) return;
    sel.innerHTML = RECORD_STATUSES.map(s =>
      '<option value="' + s.value + '">' + s.label + '</option>'
    ).join('');
  }

  function initNovedadSelector() {
    const container = document.getElementById('record-novedad-selector');
    if (!container) return;
    container.innerHTML = LOSS_TYPES.map(lt =>
      '<label class="loss-radio" style="font-size:12px;"><input type="radio" name="record-novedad-type" value="' + lt.value + '" /> ' + lt.label + '</label>'
    ).join('');
  }

  async function loadProducts(roomId) {
    showView('view-products');
    updateBreadcrumb('Pérdidas > Productos');
    const room = rooms.find((r) => r.id === roomId);
    el.productsSubtitle.textContent = room ? 'Productos de la habitación ' + room.room_number : 'Productos de la habitación.';
    el.productsContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando productos...</h3></div>';
    selectedProducts.clear();
    updateProductSelection();
    document.getElementById('loss-extra-section').style.display = 'none';
    initObservationPresets();
    initStatusSelector();
    initNovedadSelector();
    try {
      inventory = await apiFetch('/api/perdidas/inventory/' + roomId);
      renderProducts();
    } catch (err) {
      el.productsContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error al cargar</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderProducts() {
    if (!inventory.length) {
      el.productsContainer.innerHTML = '<div class="empty-state"><i class="ph-light ph-shopping-bag"></i><h3>Sin productos</h3><p>Esta habitación no tiene productos configurados.</p></div>';
      return;
    }

    // Group by category
    const categories = new Map();
    for (const item of inventory) {
      const cat = item.category_name || 'Sin categoría';
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat).push(item);
    }

    let html = '';
    for (const [catName, items] of categories) {
      html += '<div class="category-section"><div class="category-heading"><i class="ph-light ph-tag"></i> ' + catName + '</div>';
      html += '<div class="product-grid">';
      for (const item of items) {
        const pid = item.product_id;
        const isAgotado = item.current_qty <= 0;
        html += '<div class="loss-product-card" data-product-id="' + pid + '">';
        html += '<div class="loss-product-header">';
        html += '<div class="loss-product-name">' + item.product_name + '</div>';
        html += '<div class="loss-product-category">' + catName + '</div>';
        html += '</div>';
        html += '<div class="loss-product-info">';
        html += '<div class="loss-product-stock">' +
          (isAgotado
            ? '<span class="movement-type-badge adjustment">Agotado</span>'
            : '<span class="stock-badge">Disponible: <strong>' + item.current_qty + '</strong></span>') +
        '</div>';
        html += '<div class="loss-product-price">' + formatCOP(item.price) + '</div>';

        // Expiration
        var expText = 'No definida';
        var expClass = 'exp-gray';
        var expIcon = 'ph-minus';
        if (item.expiration_date) {
          var dateStr = normalizeDateStr(item.expiration_date);
          if (dateStr) {
            var today = new Date(); today.setHours(0,0,0,0);
            var expDate = new Date(dateStr + 'T00:00:00');
            if (!isNaN(expDate.getTime())) {
              var diffTime = expDate.getTime() - today.getTime();
              var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              expText = expDate.toLocaleDateString('es-CO');
              if (diffDays <= 0) { expClass = 'exp-red'; expIcon = 'ph-warning-circle'; }
              else if (diffDays <= 7) { expClass = 'exp-red'; expIcon = 'ph-warning'; }
              else if (diffDays <= 30) { expClass = 'exp-yellow'; expIcon = 'ph-clock'; }
              else { expClass = 'exp-green'; expIcon = 'ph-check-circle'; }
            }
          }
        }
        html += '<div class="loss-product-exp"><span class="exp-indicator ' + expClass + '"></span><span class="' + expClass + '">Vence: ' + expText + '</span></div>';

        html += '</div>';
        if (!isAgotado) {
          html += '<div class="loss-product-controls">';
          html += '<div class="loss-type-selector">';
          for (const lt of LOSS_TYPES) {
            html += '<label class="loss-radio"><input type="radio" name="loss-type-' + pid + '" value="' + lt.value + '" /> ' + lt.label + '</label>';
          }
          html += '</div>';
          html += '<div class="loss-qty-control">';
          html += '<label>Cant:</label>';
          html += '<input type="number" class="admin-input loss-qty-input" min="0" max="' + item.current_qty + '" value="0" style="width:70px;" />';
          html += '</div>';
          html += '<div class="loss-product-total">Total: <span class="loss-line-total">$0 COP</span></div>';
          html += '</div>';
          html += '<div class="loss-notes-field">';
          html += '<input type="text" class="admin-input loss-notes-input" placeholder="Observación por producto (opcional)" style="width:100%;font-size:12px;" />';
          html += '</div>';
        }
        html += '</div>';
      }
      html += '</div></div>';
    }
    el.productsContainer.innerHTML = html;

    // Attach events
    el.productsContainer.querySelectorAll('.loss-qty-input').forEach((input) => {
      input.addEventListener('input', updateProductSelection);
      input.addEventListener('change', updateProductSelection);
    });
    el.productsContainer.querySelectorAll('input[type="radio"][name^="loss-type-"]').forEach((radio) => {
      radio.addEventListener('change', updateProductSelection);
    });

    // Show the observation/status section
    document.getElementById('loss-extra-section').style.display = '';
  }

  function updateProductSelection() {
    const cards = el.productsContainer.querySelectorAll('.loss-product-card');
    selectedProducts.clear();
    let total = 0;
    let totalUnits = 0;

    cards.forEach((card) => {
      const pid = Number(card.dataset.productId);
      const qtyInput = card.querySelector('.loss-qty-input');

      if (!qtyInput) return; // agotado

      const qty = Number(qtyInput.value) || 0;
      let lossType = null;
      for (const lt of LOSS_TYPES) {
        const radio = card.querySelector('input[value="' + lt.value + '"]');
        if (radio && radio.checked) {
          lossType = lt.value;
          break;
        }
      }

      if (qty > 0 && lossType) {
        const item = inventory.find((i) => i.product_id === pid);
        if (item) {
          const lineTotal = qty * Number(item.price);
          total += lineTotal;
          totalUnits += qty;
          selectedProducts.set(pid, {
            productId: pid,
            productName: item.product_name,
            categoryName: item.category_name,
            lossType,
            quantity: qty,
            unitPrice: Number(item.price),
            totalPrice: lineTotal,
            currentQty: item.current_qty,
            notes: card.querySelector('.loss-notes-input')?.value || ''
          });

          const totalSpan = card.querySelector('.loss-line-total');
          if (totalSpan) totalSpan.textContent = formatCOP(lineTotal);
        }
      } else {
        const totalSpan = card.querySelector('.loss-line-total');
        if (totalSpan) totalSpan.textContent = '$0 COP';
      }
    });

    el.lossTotal.textContent = formatCOP(total);
    el.lossSummaryBar.style.display = selectedProducts.size > 0 ? '' : 'none';
    if (el.lossUnitsTotal) {
      el.lossUnitsTotal.textContent = String(totalUnits);
    }
  }

  // ============ REGISTER LOSS ============

  el.registerLossBtn.addEventListener('click', async () => {
    if (!selectedFloorId) {
      showError('Selecciona un piso.');
      return;
    }
    if (!selectedRoomId) {
      showError('Selecciona una habitación.');
      return;
    }
    if (selectedProducts.size === 0) {
      showError('Selecciona al menos un producto.');
      return;
    }

    const items = Array.from(selectedProducts.values());

    for (const item of items) {
      if (!item.lossType) {
        showError('Selecciona el tipo de novedad para ' + item.productName + '.');
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        showError('La cantidad debe ser mayor a cero para ' + item.productName + '.');
        return;
      }
      if (item.quantity > item.currentQty) {
        showError('La cantidad no puede superar el inventario disponible para ' + item.productName + '.');
        return;
      }
    }

    // Get general notes from the textarea
    const generalNotesEl = document.getElementById('loss-general-notes');
    const notes = generalNotesEl ? generalNotesEl.value : '';

    // Get status
    const statusEl = document.getElementById('record-status-select');
    const status = statusEl ? statusEl.value : 'pendiente';

    try {
      await apiFetch('/api/perdidas/register', {
        method: 'POST',
        body: JSON.stringify({
          floorId: selectedFloorId,
          roomId: selectedRoomId,
          items,
          notes,
          status
        })
      });
      showSuccess('Novedad registrada correctamente. Inventario actualizado.');
      // Refresh products to show updated inventory
      await loadProducts(selectedRoomId);
    } catch (err) {
      showError(err.message || 'Error al registrar la novedad.');
    }
  });

  // ============ BACK BUTTONS ============

  el.backToFloorsBtn.addEventListener('click', loadFloors);
  el.backToRoomsBtn.addEventListener('click', () => {
    if (selectedFloorId) loadRooms(selectedFloorId);
  });

  // ============ INIT ============

  if (typeof initTheme === 'function') initTheme();
  if (typeof initLanguage === 'function') initLanguage();
  if (typeof setupThemeSwitcher === 'function') setupThemeSwitcher(document.getElementById('app-theme-switcher'));
  if (typeof setupLangSelector === 'function') setupLangSelector(document.getElementById('app-lang-selector'));

  if (typeof loadCurrentUser === 'function') loadCurrentUser();

  loadFloors();
})();
