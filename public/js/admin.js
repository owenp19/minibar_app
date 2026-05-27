(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const el = {
    dashboardContent: $('#admin-dashboard-content'),
    productsList: $('#admin-products-list'),
    categoriesList: $('#admin-categories-list'),
    floorsList: $('#admin-floors-list'),
    roomsList: $('#admin-rooms-list'),
    usersList: $('#admin-users-list')
  };

  function switchAdminSection(sectionId) {
    $$('.admin-tab').forEach((t) => t.classList.remove('active'));
    $$('.admin-section').forEach((s) => s.classList.remove('active'));
    const tab = $(`.admin-tab[data-section="${sectionId}"]`);
    if (tab) tab.classList.add('active');
    const section = $(`#section-${sectionId}`);
    if (section) section.classList.add('active');
  }

  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Error ' + res.status);
    }
    return res.json();
  }

  function formatCOP(value) {
    const n = Number(value) || 0;
    return '$' + Math.round(n).toLocaleString('es-CO') + ' COP';
  }

  // ============ DASHBOARD ============

  async function loadDashboard() {
    if (!el.dashboardContent) return;
    el.dashboardContent.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando dashboard...</h3></div>';
    try {
      const data = await apiFetch('/api/admin/dashboard');
      renderDashboard(data);
    } catch (err) {
      el.dashboardContent.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderDashboard(data) {
    const t = data.today || {};
    const w = data.week || {};
    let html = '';

    // Summary cards
    html += '<div class="report-summary-cards">';
    const cards = [
      { label: 'Consumo hoy', value: formatCOP(t.total), icon: 'ph-light ph-currency-circle-dollar' },
      { label: 'Productos hoy', value: String(t.products || 0), icon: 'ph-light ph-shopping-bag' },
      { label: 'Movimientos hoy', value: String(t.movements || 0), icon: 'ph-light ph-list-dashes' },
      { label: 'Semana', value: formatCOP(w.total), icon: 'ph-light ph-calendar' },
      { label: 'Habitaciones', value: String(data.totalRooms || 0), icon: 'ph-light ph-bed' },
      { label: 'Stock bajo', value: String(data.lowStockRoomCount || 0), icon: 'ph-light ph-warning' },
      { label: 'Agotados', value: String(data.agotadoCount || 0), icon: 'ph-light ph-package' }
    ];
    for (const card of cards) {
      html += '<div class="report-card">' +
        '<div class="report-card-icon"><i class="' + card.icon + '"></i></div>' +
        '<div class="report-card-value">' + card.value + '</div>' +
        '<div class="report-card-label">' + card.label + '</div>' +
      '</div>';
    }
    html += '</div>';

    // Featured product of the day
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

      // Rest of ranking
      if (data.topProducts.length > 1) {
        html += '<div class="report-section"><h3 class="report-section-title">Productos m&aacute;s consumidos hoy</h3>';
        html += '<div class="report-ranking">';
        data.topProducts.forEach((p, i) => {
          html += '<div class="report-rank-item"><span class="report-rank-num">#' + (i + 1) + '</span><span class="report-rank-label">' + p.name + '</span><span class="report-rank-value">' + p.total_qty + ' uds</span></div>';
        });
        html += '</div></div>';
      }
    }

    // Recent movements
    if (data.recentMovements && data.recentMovements.length) {
      html += '<div class="report-section"><h3 class="report-section-title">&Uacute;ltimos movimientos</h3>';
      html += '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Habitaci&oacute;n</th><th>Cant.</th><th>Usuario</th></tr></thead><tbody>';
      const typeLabels = { consumption: 'Consumo', restock: 'Reposici&oacute;n', adjustment: 'Ajuste' };
      for (const m of data.recentMovements) {
        const date = new Date(m.created_at);
        const dateStr = date.toLocaleDateString('es-CO') + ' ' + date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        html += '<tr>' +
          '<td>' + dateStr + '</td>' +
          '<td><span class="movement-type-badge ' + m.movement_type + '">' + (typeLabels[m.movement_type] || m.movement_type) + '</span></td>' +
          '<td>' + m.product_name + '</td>' +
          '<td>' + m.room_number + '</td>' +
          '<td>' + m.quantity_moved + '</td>' +
          '<td>' + (m.user_name || '&mdash;') + '</td>' +
        '</tr>';
      }
      html += '</tbody></table></div></div>';
    }

    // Rooms with agotados
    if (data.roomsWithAgotados && data.roomsWithAgotados.length) {
      html += '<div class="report-section"><h3 class="report-section-title">Habitaciones con productos agotados</h3>';
      html += '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Habitaci&oacute;n</th><th>Piso</th><th>Agotados</th></tr></thead><tbody>';
      for (const r of data.roomsWithAgotados) {
        html += '<tr><td>' + r.room_number + '</td><td>' + r.floor_name + '</td><td><span class="movement-type-badge adjustment">' + r.agotados + '</span></td></tr>';
      }
      html += '</tbody></table></div></div>';
    }

    html += '<p class="report-generated-at">Actualizado: ' + new Date().toLocaleString('es-CO') + '</p>';

    el.dashboardContent.innerHTML = html;
  }

  // ============ PRODUCTS ============

  let adminProducts = [];
  let adminCategories = [];

  async function loadAdminProducts() {
    if (!el.productsList) return;
    el.productsList.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando...</h3></div>';
    try {
      adminProducts = await apiFetch('/api/admin/products');
      adminCategories = await apiFetch('/api/admin/categories');
      renderAdminProducts();
    } catch (err) {
      el.productsList.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderAdminProducts() {
    if (!adminProducts.length) {
      el.productsList.innerHTML = '<div class="empty-state"><i class="ph-light ph-shopping-bag"></i><h3>Sin productos</h3><p>No hay productos registrados.</p></div>';
      return;
    }
    let html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
      '<th>ID</th><th>Nombre</th><th>Precio</th><th>Categor&iacute;a</th><th>Stock base</th><th>Orden</th><th>Activo</th><th>Acciones</th>' +
      '</tr></thead><tbody>';
    for (const p of adminProducts) {
      html += '<tr>' +
        '<td>' + p.id + '</td>' +
        '<td>' + p.name + '</td>' +
        '<td>' + formatCOP(p.price) + '</td>' +
        '<td>' + (p.category_name || '&mdash;') + '</td>' +
        '<td>' + p.default_quantity + '</td>' +
        '<td>' + p.display_order + '</td>' +
        '<td>' + (p.is_active ? '<span class="movement-type-badge restock">S&iacute;</span>' : '<span class="movement-type-badge adjustment">No</span>') + '</td>' +
        '<td class="admin-actions">' +
          '<button class="btn-icon admin-edit-product" data-id="' + p.id + '" title="Editar"><i class="ph-light ph-pencil"></i></button>' +
          '<button class="btn-icon admin-delete-product" data-id="' + p.id + '" title="Desactivar"><i class="ph-light ph-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }
    html += '</tbody></table></div>';
    el.productsList.innerHTML = html;

    el.productsList.querySelectorAll('.admin-edit-product').forEach((btn) => {
      btn.addEventListener('click', () => showProductModal(Number(btn.dataset.id)));
    });
    el.productsList.querySelectorAll('.admin-delete-product').forEach((btn) => {
      btn.addEventListener('click', () => deleteProduct(Number(btn.dataset.id)));
    });
  }

  function showProductModal(productId) {
    const product = productId ? adminProducts.find((p) => p.id === productId) : null;
    const title = product ? 'Editar producto' : 'Nuevo producto';
    const name = product ? product.name : '';
    const price = product ? product.price : '';
    const categoryId = product ? product.category_id : (adminCategories.length ? adminCategories[0].id : '');
    const defaultQty = product ? product.default_quantity : 1;
    const displayOrder = product ? product.display_order : 0;
    const isActive = product ? product.is_active : 1;

    const catOptions = adminCategories.map((c) =>
      '<option value="' + c.id + '"' + (c.id === categoryId ? ' selected' : '') + '>' + c.name + '</option>'
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay visible';
    modal.innerHTML =
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h3>' + title + '</h3>' +
          '<button class="modal-close-btn modal-close-trigger" aria-label="Cerrar"><i class="ph-light ph-x"></i></button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div class="admin-form-group">' +
            '<label>Nombre</label>' +
            '<input class="admin-input" id="modal-product-name" value="' + name.replace(/"/g, '&quot;') + '" placeholder="Nombre del producto" />' +
          '</div>' +
          '<div class="admin-form-group">' +
            '<label>Precio ($)</label>' +
            '<input class="admin-input" id="modal-product-price" type="number" step="0.01" min="0" value="' + price + '" />' +
          '</div>' +
          '<div class="admin-form-group">' +
            '<label>Categor&iacute;a</label>' +
            '<select class="admin-input" id="modal-product-category">' + catOptions + '</select>' +
          '</div>' +
          '<div class="admin-form-group">' +
            '<label>Stock base por habitaci&oacute;n</label>' +
            '<input class="admin-input" id="modal-product-qty" type="number" min="0" value="' + defaultQty + '" />' +
          '</div>' +
          '<div class="admin-form-group">' +
            '<label>Orden de visualizaci&oacute;n</label>' +
            '<input class="admin-input" id="modal-product-order" type="number" min="0" value="' + displayOrder + '" />' +
          '</div>' +
          (productId ? '<div class="admin-form-group"><label><input type="checkbox" id="modal-product-active"' + (isActive ? ' checked' : '') + ' /> Activo</label></div>' : '') +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn-primary btn-sm" id="modal-product-save">' + (product ? 'Guardar cambios' : 'Crear producto') + '</button>' +
          '<button class="btn-ghost btn-sm modal-close-trigger">Cancelar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    modal.querySelectorAll('.modal-close-trigger').forEach((btn) => {
      btn.addEventListener('click', () => modal.remove());
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#modal-product-save').addEventListener('click', async () => {
      const body = {
        name: modal.querySelector('#modal-product-name').value.trim(),
        price: Number(modal.querySelector('#modal-product-price').value),
        categoryId: Number(modal.querySelector('#modal-product-category').value),
        defaultQuantity: Number(modal.querySelector('#modal-product-qty').value),
        displayOrder: Number(modal.querySelector('#modal-product-order').value)
      };
      if (productId) {
        body.isActive = modal.querySelector('#modal-product-active').checked ? 1 : 0;
      }
      try {
        if (productId) {
          await apiFetch('/api/admin/products/' + productId, { method: 'PUT', body: JSON.stringify(body) });
        } else {
          await apiFetch('/api/admin/products', { method: 'POST', body: JSON.stringify(body) });
        }
        modal.remove();
        await loadAdminProducts();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }

  async function deleteProduct(productId) {
    if (!confirm('Desactivar este producto? Se ocultar\u00e1 del inventario.')) return;
    try {
      await apiFetch('/api/admin/products/' + productId, { method: 'DELETE' });
      await loadAdminProducts();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  // ============ CATEGORIES ============

  let adminCategoriesList = [];

  async function loadAdminCategories() {
    if (!el.categoriesList) return;
    el.categoriesList.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando...</h3></div>';
    try {
      adminCategoriesList = await apiFetch('/api/admin/categories');
      renderAdminCategories();
    } catch (err) {
      el.categoriesList.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderAdminCategories() {
    if (!adminCategoriesList.length) {
      el.categoriesList.innerHTML = '<div class="empty-state"><i class="ph-light ph-tag"></i><h3>Sin categor&iacute;as</h3><p>No hay categor&iacute;as registradas.</p></div>';
      return;
    }
    let html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
      '<th>ID</th><th>Nombre</th><th>Orden</th><th>Acciones</th>' +
      '</tr></thead><tbody>';
    for (const c of adminCategoriesList) {
      html += '<tr>' +
        '<td>' + c.id + '</td>' +
        '<td>' + c.name + '</td>' +
        '<td>' + c.display_order + '</td>' +
        '<td class="admin-actions">' +
          '<button class="btn-icon admin-edit-category" data-id="' + c.id + '" title="Editar"><i class="ph-light ph-pencil"></i></button>' +
          '<button class="btn-icon admin-delete-category" data-id="' + c.id + '" title="Eliminar"><i class="ph-light ph-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }
    html += '</tbody></table></div>';
    el.categoriesList.innerHTML = html;

    el.categoriesList.querySelectorAll('.admin-edit-category').forEach((btn) => {
      btn.addEventListener('click', () => showCategoryModal(Number(btn.dataset.id)));
    });
    el.categoriesList.querySelectorAll('.admin-delete-category').forEach((btn) => {
      btn.addEventListener('click', () => deleteCategory(Number(btn.dataset.id)));
    });
  }

  function showCategoryModal(categoryId) {
    const cat = categoryId ? adminCategoriesList.find((c) => c.id === categoryId) : null;
    const title = cat ? 'Editar categor\u00eda' : 'Nueva categor\u00eda';
    const name = cat ? cat.name : '';
    const displayOrder = cat ? cat.display_order : 0;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay visible';
    modal.innerHTML =
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h3>' + title + '</h3>' +
          '<button class="modal-close-btn modal-close-trigger" aria-label="Cerrar"><i class="ph-light ph-x"></i></button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div class="admin-form-group">' +
            '<label>Nombre</label>' +
            '<input class="admin-input" id="modal-cat-name" value="' + name.replace(/"/g, '&quot;') + '" placeholder="Nombre de la categor\u00eda" />' +
          '</div>' +
          '<div class="admin-form-group">' +
            '<label>Orden</label>' +
            '<input class="admin-input" id="modal-cat-order" type="number" min="0" value="' + displayOrder + '" />' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn-primary btn-sm" id="modal-cat-save">' + (cat ? 'Guardar cambios' : 'Crear categor\u00eda') + '</button>' +
          '<button class="btn-ghost btn-sm modal-close-trigger">Cancelar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    modal.querySelectorAll('.modal-close-trigger').forEach((btn) => btn.addEventListener('click', () => modal.remove()));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector('#modal-cat-save').addEventListener('click', async () => {
      const body = {
        name: modal.querySelector('#modal-cat-name').value.trim(),
        displayOrder: Number(modal.querySelector('#modal-cat-order').value)
      };
      try {
        if (cat) {
          await apiFetch('/api/admin/categories/' + categoryId, { method: 'PUT', body: JSON.stringify(body) });
        } else {
          await apiFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify(body) });
        }
        modal.remove();
        await loadAdminCategories();
      } catch (err) { alert('Error: ' + err.message); }
    });
  }

  async function deleteCategory(categoryId) {
    if (!confirm('Eliminar esta categor\u00eda? Solo si no tiene productos asociados.')) return;
    try {
      await apiFetch('/api/admin/categories/' + categoryId, { method: 'DELETE' });
      await loadAdminCategories();
    } catch (err) { alert('Error: ' + err.message); }
  }

  // ============ FLOORS ============

  let adminFloors = [];

  async function loadAdminFloors() {
    if (!el.floorsList) return;
    el.floorsList.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando...</h3></div>';
    try {
      adminFloors = await apiFetch('/api/admin/floors');
      renderAdminFloors();
    } catch (err) {
      el.floorsList.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderAdminFloors() {
    if (!adminFloors.length) {
      el.floorsList.innerHTML = '<div class="empty-state"><i class="ph-light ph-buildings"></i><h3>Sin pisos</h3><p>No hay pisos registrados.</p></div>';
      return;
    }
    let html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
      '<th>ID</th><th>Nombre</th><th>N&uacute;mero</th><th>Habitaciones</th><th>Acciones</th>' +
      '</tr></thead><tbody>';
    for (const f of adminFloors) {
      html += '<tr>' +
        '<td>' + f.id + '</td>' +
        '<td>' + f.name + '</td>' +
        '<td>' + f.floor_number + '</td>' +
        '<td>' + (f.room_count || 0) + '</td>' +
        '<td class="admin-actions">' +
          '<button class="btn-icon admin-edit-floor" data-id="' + f.id + '" title="Editar"><i class="ph-light ph-pencil"></i></button>' +
          '<button class="btn-icon admin-delete-floor" data-id="' + f.id + '" title="Eliminar"><i class="ph-light ph-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }
    html += '</tbody></table></div>';
    el.floorsList.innerHTML = html;

    el.floorsList.querySelectorAll('.admin-edit-floor').forEach((btn) => {
      btn.addEventListener('click', () => showFloorModal(Number(btn.dataset.id)));
    });
    el.floorsList.querySelectorAll('.admin-delete-floor').forEach((btn) => {
      btn.addEventListener('click', () => deleteFloor(Number(btn.dataset.id)));
    });
  }

  function showFloorModal(floorId) {
    const floor = floorId ? adminFloors.find((f) => f.id === floorId) : null;
    const title = floor ? 'Editar piso' : 'Nuevo piso';
    const name = floor ? floor.name : '';
    const floorNumber = floor ? floor.floor_number : '';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay visible';
    modal.innerHTML =
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h3>' + title + '</h3>' +
          '<button class="modal-close-btn modal-close-trigger" aria-label="Cerrar"><i class="ph-light ph-x"></i></button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div class="admin-form-group">' +
            '<label>Nombre</label>' +
            '<input class="admin-input" id="modal-floor-name" value="' + name.replace(/"/g, '&quot;') + '" placeholder="Ej: Piso 1" />' +
          '</div>' +
          '<div class="admin-form-group">' +
            '<label>N&uacute;mero de piso</label>' +
            '<input class="admin-input" id="modal-floor-number" type="number" min="1" value="' + floorNumber + '" />' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn-primary btn-sm" id="modal-floor-save">' + (floor ? 'Guardar cambios' : 'Crear piso') + '</button>' +
          '<button class="btn-ghost btn-sm modal-close-trigger">Cancelar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    modal.querySelectorAll('.modal-close-trigger').forEach((btn) => btn.addEventListener('click', () => modal.remove()));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector('#modal-floor-save').addEventListener('click', async () => {
      const body = {
        name: modal.querySelector('#modal-floor-name').value.trim(),
        floorNumber: Number(modal.querySelector('#modal-floor-number').value)
      };
      try {
        if (floor) {
          await apiFetch('/api/admin/floors/' + floorId, { method: 'PUT', body: JSON.stringify(body) });
        } else {
          await apiFetch('/api/admin/floors', { method: 'POST', body: JSON.stringify(body) });
        }
        modal.remove();
        await loadAdminFloors();
      } catch (err) { alert('Error: ' + err.message); }
    });
  }

  async function deleteFloor(floorId) {
    if (!confirm('Eliminar este piso? Solo si no tiene habitaciones asociadas.')) return;
    try {
      await apiFetch('/api/admin/floors/' + floorId, { method: 'DELETE' });
      await loadAdminFloors();
    } catch (err) { alert('Error: ' + err.message); }
  }

  // ============ ROOMS ============

  let adminRooms = [];

  async function loadAdminRooms() {
    if (!el.roomsList) return;
    el.roomsList.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando...</h3></div>';
    try {
      adminRooms = await apiFetch('/api/admin/rooms');
      renderAdminRooms();
    } catch (err) {
      el.roomsList.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderAdminRooms() {
    if (!adminRooms.length) {
      el.roomsList.innerHTML = '<div class="empty-state"><i class="ph-light ph-bed"></i><h3>Sin habitaciones</h3><p>No hay habitaciones registradas.</p></div>';
      return;
    }
    let html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
      '<th>ID</th><th>Habitaci&oacute;n</th><th>Piso</th><th>Acciones</th>' +
      '</tr></thead><tbody>';
    for (const r of adminRooms) {
      html += '<tr>' +
        '<td>' + r.id + '</td>' +
        '<td>' + r.room_number + '</td>' +
        '<td>' + (r.floor_name || '&mdash;') + '</td>' +
        '<td class="admin-actions">' +
          '<button class="btn-icon admin-edit-room" data-id="' + r.id + '" title="Editar"><i class="ph-light ph-pencil"></i></button>' +
          '<button class="btn-icon admin-delete-room" data-id="' + r.id + '" title="Eliminar"><i class="ph-light ph-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }
    html += '</tbody></table></div>';
    el.roomsList.innerHTML = html;

    el.roomsList.querySelectorAll('.admin-edit-room').forEach((btn) => {
      btn.addEventListener('click', () => showRoomModal(Number(btn.dataset.id)));
    });
    el.roomsList.querySelectorAll('.admin-delete-room').forEach((btn) => {
      btn.addEventListener('click', () => deleteRoom(Number(btn.dataset.id)));
    });
  }

  function showRoomModal(roomId) {
    const room = roomId ? adminRooms.find((r) => r.id === roomId) : null;
    const title = room ? 'Editar habitaci&oacute;n' : 'Nueva habitaci&oacute;n';
    const roomNumber = room ? room.room_number : '';
    const floorId = room ? room.floor_id : (adminFloors.length ? adminFloors[0].id : '');

    const floorOptions = adminFloors.map((f) =>
      '<option value="' + f.id + '"' + (f.id === floorId ? ' selected' : '') + '>' + f.name + '</option>'
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay visible';
    modal.innerHTML =
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h3>' + title + '</h3>' +
          '<button class="modal-close-btn modal-close-trigger" aria-label="Cerrar"><i class="ph-light ph-x"></i></button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div class="admin-form-group">' +
            '<label>N&uacute;mero de habitaci&oacute;n</label>' +
            '<input class="admin-input" id="modal-room-number" value="' + roomNumber.replace(/"/g, '&quot;') + '" placeholder="Ej: 101" />' +
          '</div>' +
          '<div class="admin-form-group">' +
            '<label>Piso</label>' +
            '<select class="admin-input" id="modal-room-floor">' + floorOptions + '</select>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn-primary btn-sm" id="modal-room-save">' + (room ? 'Guardar cambios' : 'Crear habitaci&oacute;n') + '</button>' +
          '<button class="btn-ghost btn-sm modal-close-trigger">Cancelar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    modal.querySelectorAll('.modal-close-trigger').forEach((btn) => btn.addEventListener('click', () => modal.remove()));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector('#modal-room-save').addEventListener('click', async () => {
      const body = {
        roomNumber: modal.querySelector('#modal-room-number').value.trim(),
        floorId: Number(modal.querySelector('#modal-room-floor').value)
      };
      try {
        if (room) {
          await apiFetch('/api/admin/rooms/' + roomId, { method: 'PUT', body: JSON.stringify(body) });
        } else {
          await apiFetch('/api/admin/rooms', { method: 'POST', body: JSON.stringify(body) });
        }
        modal.remove();
        await loadAdminRooms();
      } catch (err) { alert('Error: ' + err.message); }
    });
  }

  async function deleteRoom(roomId) {
    if (!confirm('Eliminar esta habitaci&oacute;n? Esta acci&oacute;n no se puede deshacer.')) return;
    try {
      await apiFetch('/api/admin/rooms/' + roomId, { method: 'DELETE' });
      await loadAdminRooms();
    } catch (err) { alert('Error: ' + err.message); }
  }

  // ============ USERS ============

  let adminUsers = [];

  async function loadAdminUsers() {
    if (!el.usersList) return;
    el.usersList.innerHTML = '<div class="empty-state"><i class="ph-light ph-spinner spinning"></i><h3>Cargando...</h3></div>';
    try {
      adminUsers = await apiFetch('/api/admin/users');
      renderAdminUsers();
    } catch (err) {
      el.usersList.innerHTML = '<div class="empty-state"><i class="ph-light ph-warning-circle"></i><h3>Error</h3><p>' + err.message + '</p></div>';
    }
  }

  function renderAdminUsers() {
    if (!adminUsers.length) {
      el.usersList.innerHTML = '<div class="empty-state"><i class="ph-light ph-user"></i><h3>Sin usuarios</h3><p>No hay usuarios registrados.</p></div>';
      return;
    }
    let html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
      '<th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Activo</th><th>Acciones</th>' +
      '</tr></thead><tbody>';
    for (const u of adminUsers) {
      html += '<tr>' +
        '<td>' + u.id + '</td>' +
        '<td>' + u.full_name + '</td>' +
        '<td>' + u.email + '</td>' +
        '<td><span class="movement-type-badge ' + (u.role === 'admin' ? 'restock' : 'consumption') + '">' + (u.role === 'admin' ? 'Admin' : 'Operador') + '</span></td>' +
        '<td>' + (u.is_active ? '<span class="movement-type-badge restock">S&iacute;</span>' : '<span class="movement-type-badge adjustment">No</span>') + '</td>' +
        '<td class="admin-actions">' +
          '<button class="btn-icon admin-edit-user" data-id="' + u.id + '" title="Editar"><i class="ph-light ph-pencil"></i></button>' +
          '<button class="btn-icon admin-delete-user" data-id="' + u.id + '" title="Eliminar"><i class="ph-light ph-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }
    html += '</tbody></table></div>';
    el.usersList.innerHTML = html;

    el.usersList.querySelectorAll('.admin-edit-user').forEach((btn) => {
      btn.addEventListener('click', () => showUserModal(Number(btn.dataset.id)));
    });
    el.usersList.querySelectorAll('.admin-delete-user').forEach((btn) => {
      btn.addEventListener('click', () => deleteUser(Number(btn.dataset.id)));
    });
  }

  function showUserModal(userId) {
    const user = userId ? adminUsers.find((u) => u.id === userId) : null;
    const title = user ? 'Editar usuario' : 'Nuevo usuario';
    const fullName = user ? user.full_name : '';
    const email = user ? user.email : '';
    const role = user ? user.role : 'operator';
    const isActive = user ? user.is_active : 1;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay visible';
    modal.innerHTML =
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h3>' + title + '</h3>' +
          '<button class="modal-close-btn modal-close-trigger" aria-label="Cerrar"><i class="ph-light ph-x"></i></button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div class="admin-form-group">' +
            '<label>Nombre completo</label>' +
            '<input class="admin-input" id="modal-user-name" value="' + fullName.replace(/"/g, '&quot;') + '" placeholder="Nombre completo" />' +
          '</div>' +
          '<div class="admin-form-group">' +
            '<label>Email</label>' +
            '<input class="admin-input" id="modal-user-email" value="' + email.replace(/"/g, '&quot;') + '" placeholder="email@ejemplo.com" />' +
          '</div>' +
          '<div class="admin-form-group">' +
            '<label>Contrase&ntilde;a' + (user ? ' (dejar vac&iacute;o para no cambiar)' : '') + '</label>' +
            '<input class="admin-input" id="modal-user-password" type="password" placeholder="M&iacute;nimo 6 caracteres" />' +
          '</div>' +
          '<div class="admin-form-group">' +
            '<label>Rol</label>' +
            '<select class="admin-input" id="modal-user-role">' +
              '<option value="operator"' + (role === 'operator' ? ' selected' : '') + '>Operador</option>' +
              '<option value="admin"' + (role === 'admin' ? ' selected' : '') + '>Administrador</option>' +
            '</select>' +
          '</div>' +
          '<div class="admin-form-group">' +
            '<label><input type="checkbox" id="modal-user-active"' + (isActive ? ' checked' : '') + ' /> Activo</label>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn-primary btn-sm" id="modal-user-save">' + (user ? 'Guardar cambios' : 'Crear usuario') + '</button>' +
          '<button class="btn-ghost btn-sm modal-close-trigger">Cancelar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    modal.querySelectorAll('.modal-close-trigger').forEach((btn) => btn.addEventListener('click', () => modal.remove()));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector('#modal-user-save').addEventListener('click', async () => {
      const body = {
        fullName: modal.querySelector('#modal-user-name').value.trim(),
        email: modal.querySelector('#modal-user-email').value.trim(),
        role: modal.querySelector('#modal-user-role').value
      };
      body.isActive = modal.querySelector('#modal-user-active').checked ? 1 : 0;
      const password = modal.querySelector('#modal-user-password').value;
      if (password) body.password = password;

      try {
        if (user) {
          await apiFetch('/api/admin/users/' + userId, { method: 'PUT', body: JSON.stringify(body) });
        } else {
          body.password = password || 'changeme123';
          await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(body) });
        }
        modal.remove();
        await loadAdminUsers();
      } catch (err) { alert('Error: ' + err.message); }
    });
  }

  async function deleteUser(userId) {
    if (!confirm('Eliminar este usuario?')) return;
    try {
      await apiFetch('/api/admin/users/' + userId, { method: 'DELETE' });
      await loadAdminUsers();
    } catch (err) { alert('Error: ' + err.message); }
  }

  // ============ EVENTS ============

  // Admin tabs
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const sectionId = tab.dataset.section;
      switchAdminSection(sectionId);
      if (sectionId === 'dashboard') loadDashboard();
      else if (sectionId === 'products') loadAdminProducts();
      else if (sectionId === 'categories') loadAdminCategories();
      else if (sectionId === 'floors') loadAdminFloors();
      else if (sectionId === 'rooms') loadAdminRooms();
      else if (sectionId === 'users') loadAdminUsers();
    });
  });

  // Product buttons
  const addProductBtn = $('#admin-add-product-btn');
  if (addProductBtn) addProductBtn.addEventListener('click', () => showProductModal(null));
  const refreshProductsBtn = $('#admin-refresh-products-btn');
  if (refreshProductsBtn) refreshProductsBtn.addEventListener('click', loadAdminProducts);

  // Category buttons
  const addCategoryBtn = $('#admin-add-category-btn');
  if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => showCategoryModal(null));
  const refreshCategoriesBtn = $('#admin-refresh-categories-btn');
  if (refreshCategoriesBtn) refreshCategoriesBtn.addEventListener('click', loadAdminCategories);

  // Floor buttons
  const addFloorBtn = $('#admin-add-floor-btn');
  if (addFloorBtn) addFloorBtn.addEventListener('click', () => showFloorModal(null));
  const refreshFloorsBtn = $('#admin-refresh-floors-btn');
  if (refreshFloorsBtn) refreshFloorsBtn.addEventListener('click', loadAdminFloors);

  // Room buttons
  const addRoomBtn = $('#admin-add-room-btn');
  if (addRoomBtn) addRoomBtn.addEventListener('click', () => showRoomModal(null));
  const refreshRoomsBtn = $('#admin-refresh-rooms-btn');
  if (refreshRoomsBtn) refreshRoomsBtn.addEventListener('click', loadAdminRooms);

  // User buttons
  const addUserBtn = $('#admin-add-user-btn');
  if (addUserBtn) addUserBtn.addEventListener('click', () => showUserModal(null));
  const refreshUsersBtn = $('#admin-refresh-users-btn');
  if (refreshUsersBtn) refreshUsersBtn.addEventListener('click', loadAdminUsers);

  // ============ INIT ============

  if (typeof initTheme === 'function') initTheme();
  if (typeof initLanguage === 'function') initLanguage();
  if (typeof setupThemeSwitcher === 'function') setupThemeSwitcher(document.getElementById('app-theme-switcher'));
  if (typeof setupLangSelector === 'function') setupLangSelector(document.getElementById('app-lang-selector'));

  loadDashboard();
})();
