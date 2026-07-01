/* ============================================================
   Praessia — js/admin.js
   Panel de administración:
   · Login con contraseña maestra (Firebase)
   · Dashboard con métricas y alertas
   · Inventario por receta + semáforo visual
   · Insumos manuales (alcohol, fijador, agua)
   · Registro de ventas + descuento automático
   · Recarga de insumos + historial
   · Moderación de reseñas (aprobar / rechazar)
   ============================================================ */

'use strict';

/* ── CONFIGURACIÓN ───────────────────────────────────────────── */
const ADMIN_CONFIG = {
  /* Niveles mínimos de alerta para semáforo */
  minStock: {
    esencia: 300,   /* gramos  */
    envase: 10,    /* unidades */
    caja: 10,
    bolsa: 10,
    perfumero: 10,
    alcohol: 500,   /* ml */
    fijador: 100,
    agua: 300
  },
  /* Niveles de advertencia (amarillo) */
  warnStock: {
    esencia: 600,
    envase: 20,
    caja: 20,
    bolsa: 20,
    perfumero: 20,
    alcohol: 1000,
    fijador: 250,
    agua: 600
  },
  /* Receta por unidad vendida */
  recipe: {
    esencia: 30,   /* 30g por perfume */
    envase: 1,
    caja: 1,
    bolsa: 1,
    perfumero: 1
  },
  priceDefault: 140000
};

const ADMIN_RESET_PASSWORD = 'Abc123/*';


/* Etiquetas legibles */
const SUPPLY_LABELS = {
  esencia: 'Esencia',
  envase: 'Envases',
  caja: 'Cajas',
  bolsa: 'Bolsas ecológicas',
  perfumero: 'Perfumeros portátiles',
  alcohol: 'Alcohol',
  fijador: 'Fijador',
  agua: 'Agua destilada'
};

const SUPPLY_UNITS = {
  esencia: 'g',
  envase: 'u',
  caja: 'u',
  bolsa: 'u',
  perfumero: 'u',
  alcohol: 'ml',
  fijador: 'ml',
  agua: 'ml'
};

const CHANNEL_LABELS = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  presencial: 'Presencial',
  otro: 'Otro'
};

/* ── CONFIGURACIÓN DE ESENCIAS POR REFERENCIA ────────────────── */
const ESSENCE_CONFIG = {};

function initializeEssenceConfig() {
  if (typeof perfumes === 'undefined') return;
  perfumes.forEach(p => {
    ESSENCE_CONFIG[p.id] = {
      name: cleanPerfumeName(p.name),
      essence: 30
    };
  });
}

/* ── ESTADO ──────────────────────────────────────────────────── */
let db = null;
let FS = null;
let inventory = {};   /* Snapshot del inventario en memoria */
let inventoryEssences = {};  /* Stock de esencias por referencia */
let allSales = [];
let allHistory = [];
let pendingReviews = [];
let approvedReviews = [];

/* ── ARRANQUE ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initializeEssenceConfig();
  bindLoginEvents();
  setTodayDate();
});

window.addEventListener('adminFirebaseReady', () => {
  db = window._adminDB;
  FS = window._adminFS;
});

/* ─────────────────────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────────────────────── */
function bindLoginEvents() {
  document.getElementById('btnLogin')?.addEventListener('click', attemptLogin);
  document.getElementById('loginInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') attemptLogin();
  });
  document.getElementById('btnLogout')?.addEventListener('click', logout);
}

async function attemptLogin() {
  if (!db || !FS) {
    showLoginError('Conectando con Firebase, espera un momento...');
    return;
  }

  const input = document.getElementById('loginInput');
  const pwd = input?.value?.trim();
  if (!pwd) { showLoginError('Ingresa la contraseña'); return; }

  const btn = document.getElementById('btnLogin');
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;

  try {
    const { doc, getDoc } = FS;
    const snap = await getDoc(doc(db, 'config', 'admin'));

    if (!snap.exists()) {
      /* Primera vez: crear contraseña */
      await initAdminPassword(pwd);
      enterPanel();
      return;
    }

    const stored = snap.data().password;
    if (pwd === stored) {
      enterPanel();
    } else if (pwd === ADMIN_RESET_PASSWORD) {
      const { doc, updateDoc, serverTimestamp } = FS;
      await updateDoc(doc(db, 'config', 'admin'), {
        password: pwd,
        updatedAt: serverTimestamp()
      });
      showAdminToast('Contraseña restablecida a Abc123/*');
      enterPanel();
    } else {
      showLoginError('Contraseña incorrecta');
    }
  } catch (e) {
    console.error(e);
    showLoginError('Error de conexión. Verifica tu configuración Firebase.');
  } finally {
    btn.innerHTML = 'Ingresar';
    btn.disabled = false;
  }
}

async function initAdminPassword(pwd) {
  /* Solo se ejecuta la primera vez para crear la contraseña maestra */
  const { doc, setDoc, serverTimestamp } = FS;
  await setDoc(doc(db, 'config', 'admin'), { password: pwd, createdAt: serverTimestamp() });
  /* Inicializar inventario vacío */
  await initInventory();
  await initInventoryEssences();
}

async function initInventory() {
  const { doc, setDoc, serverTimestamp } = FS;
  const initial = {};
  Object.keys(SUPPLY_LABELS).forEach(k => initial[k] = 0);
  await setDoc(doc(db, 'config', 'inventory'), { ...initial, updatedAt: serverTimestamp() });
}

async function initInventoryEssences() {
  const { doc, setDoc, serverTimestamp } = FS;
  const initial = {};
  Object.keys(ESSENCE_CONFIG).forEach(k => initial[k] = 0);
  await setDoc(doc(db, 'config', 'inventory_essences'), { ...initial, updatedAt: serverTimestamp() });
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function enterPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  bindAdminEvents();
  loadAll();
}

function logout() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginInput').value = '';
  document.getElementById('loginError').style.display = 'none';
}

/* ─────────────────────────────────────────────────────────────
   NAVEGACIÓN
───────────────────────────────────────────────────────────── */
function bindAdminEvents() {
  /* Sidebar links */
  document.querySelectorAll('.sidebar-link[data-section]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.section));
  });

  /* Topbar fecha */
  document.getElementById('topbarDate').textContent =
    new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  /* Formularios */
  document.getElementById('btnReload')?.addEventListener('click', saveReload);
  document.getElementById('btnSaveProd')?.addEventListener('click', saveProduction);

  /* Flujo multi-paso de ventas */
  document.getElementById('btnStep1Continue')?.addEventListener('click', validateAndGoToStep2);
  document.getElementById('btnStep2Back')?.addEventListener('click', goBackToStep1);
  document.getElementById('btnSaveSale')?.addEventListener('click', () => {
    if (!validateStep2()) return;
    saveSale();
  });
  document.getElementById('btnAddProduct')?.addEventListener('click', () => {
    addProductRow();
    updateSummaryTable();
  });
  document.getElementById('saleChannel')?.addEventListener('change', toggleExternalSellerField);

  /* Inicializar fecha automática */
  initializeSaleDate();

  /* Inicializar primer producto */
  initializeFirstProducts();

  /* Filtro historial */
  document.getElementById('historialFilter')?.addEventListener('change', renderHistorial);

  /* Llenar selects */
  fillSaleSelect();
  fillReloadItemOptions();
}

function navigateTo(section) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  document.getElementById(`section-${section}`)?.classList.add('active');
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    inventario: 'Stock de insumos',
    produccion: 'Producción',
    recarga: 'Recargar insumos',
    ventas: 'Registrar venta',
    historial: 'Historial de movimientos',
    resenias: 'Moderación de reseñas'
  };
  document.getElementById('topbarTitle').textContent = titles[section] || 'Admin';
}

/* ─────────────────────────────────────────────────────────────
   CARGA INICIAL
───────────────────────────────────────────────────────────── */
async function loadAll() {
  await Promise.all([
    loadInventory(),
    loadInventoryEssences(),
    loadSales(),
    loadReloads(),
    loadProduction(),
    loadReviews()
  ]);
  renderDashboard();
  renderInventoryGrid();
  renderInventoryEssencesGrid();
  renderManualSupplies();
  renderHistorial();
  renderReloadHistory();
  renderProdHistory();
}

/* ── Inventario ─────────────────────────────────────────────── */
async function loadInventory() {
  try {
    const { doc, getDoc } = FS;
    const snap = await getDoc(doc(db, 'config', 'inventory'));
    if (snap.exists()) inventory = snap.data();
    else { inventory = {}; Object.keys(SUPPLY_LABELS).forEach(k => inventory[k] = 0); }
  } catch (e) { console.warn('loadInventory:', e); }
}

async function loadInventoryEssences() {
  try {
    const { doc, getDoc } = FS;
    const snap = await getDoc(doc(db, 'config', 'inventory_essences'));
    if (snap.exists()) inventoryEssences = snap.data();
    else { inventoryEssences = {}; Object.keys(ESSENCE_CONFIG).forEach(k => inventoryEssences[k] = 0); }
  } catch (e) { console.warn('loadInventoryEssences:', e); }
}

async function saveInventory() {
  try {
    const { doc, setDoc, serverTimestamp } = FS;
    await setDoc(doc(db, 'config', 'inventory'), { ...inventory, updatedAt: serverTimestamp() });
  } catch (e) { console.error('saveInventory:', e); }
}

async function saveInventoryEssences() {
  try {
    const { doc, setDoc, serverTimestamp } = FS;
    await setDoc(doc(db, 'config', 'inventory_essences'), { ...inventoryEssences, updatedAt: serverTimestamp() });
  } catch (e) { console.error('saveInventoryEssences:', e); }
}

/* ── Ventas ─────────────────────────────────────────────────── */
async function loadSales() {
  try {
    const { collection, getDocs, query, orderBy } = FS;
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    allSales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('loadSales:', e); allSales = []; }
}

/* ── Recargas ───────────────────────────────────────────────── */
async function loadReloads() {
  try {
    const { collection, getDocs, query, orderBy } = FS;
    const q = query(collection(db, 'reloads'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    window._reloads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('loadReloads:', e); window._reloads = []; }
}

/* ── Producción ─────────────────────────────────────────────── */
async function loadProduction() {
  try {
    const { collection, getDocs, query, orderBy } = FS;
    const q = query(collection(db, 'production'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    window._production = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('loadProduction:', e); window._production = []; }
}

/* ── Reseñas ────────────────────────────────────────────────── */
async function loadReviews() {
  try {
    const { collection, getDocs, query, where } = FS;

    const qPending = query(collection(db, 'reviews'), where('status', '==', 'pending'));
    const qApproved = query(collection(db, 'reviews'), where('status', '==', 'approved'));

    const [snapP, snapA] = await Promise.all([getDocs(qPending), getDocs(qApproved)]);

    pendingReviews = snapP.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    approvedReviews = snapA.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    renderReviews();
    updatePendingBadge();
  } catch (e) { console.warn('loadReviews:', e); }
}

/* ─────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────── */
function renderDashboard() {
  renderMetrics();
  renderAlerts();
  renderRecentSales();
}

function renderMetrics() {
  const grid = document.getElementById('metricsGrid');
  if (!grid) return;

  const totalSales = allSales.length;
  const totalRevenue = allSales.reduce((s, sale) => s + (sale.price || 0), 0);
  const pendingCount = pendingReviews.length;
  const lowStockGeneral = Object.keys(ADMIN_CONFIG.minStock).filter(k =>
    k !== 'esencia' && (inventory[k] || 0) <= ADMIN_CONFIG.minStock[k]
  ).length;
  const lowStockEssences = Object.values(inventoryEssences).filter(q => q <= ADMIN_CONFIG.minStock.esencia).length;
  const lowStock = lowStockGeneral + lowStockEssences;

  grid.innerHTML = `
    <div class="metric-card">
      <div class="metric-icon wine"><i class="bi bi-bag-check"></i></div>
      <div class="metric-value">${totalSales}</div>
      <div class="metric-label">Ventas totales</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon gold"><i class="bi bi-currency-dollar"></i></div>
      <div class="metric-value" style="font-size:1.3rem;">${formatCOP(totalRevenue)}</div>
      <div class="metric-label">Ingresos totales</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon ${pendingCount > 0 ? 'yellow' : 'green'}">
        <i class="bi bi-chat-heart"></i>
      </div>
      <div class="metric-value">${pendingCount}</div>
      <div class="metric-label">Reseñas pendientes</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon ${lowStock > 0 ? 'red' : 'green'}">
        <i class="bi bi-${lowStock > 0 ? 'exclamation-triangle' : 'check-circle'}"></i>
      </div>
      <div class="metric-value">${lowStock}</div>
      <div class="metric-label">Insumos en stock bajo</div>
    </div>`;
}

function renderAlerts() {
  const wrap = document.getElementById('alertsWrap');
  const list = document.getElementById('alertsList');
  if (!wrap || !list) return;

  const generalAlerts = Object.keys(ADMIN_CONFIG.minStock).filter(k =>
    k !== 'esencia' && (inventory[k] || 0) <= ADMIN_CONFIG.minStock[k]
  ).map(k => ({
    label: SUPPLY_LABELS[k],
    qty: inventory[k] || 0,
    unit: SUPPLY_UNITS[k],
    min: ADMIN_CONFIG.minStock[k]
  }));

  const essenceAlerts = Object.entries(inventoryEssences)
    .filter(([productId, qty]) => qty <= ADMIN_CONFIG.minStock.esencia)
    .map(([productId, qty]) => ({
      label: ESSENCE_CONFIG[productId]?.name || productId,
      qty,
      unit: 'g',
      min: ADMIN_CONFIG.minStock.esencia
    }));

  const alerts = [...generalAlerts, ...essenceAlerts];
  if (alerts.length === 0) { wrap.style.display = 'none'; return; }

  wrap.style.display = 'block';
  list.innerHTML = alerts.map(alert => `
    <div style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border);">
      <i class="bi bi-exclamation-circle" style="color:var(--red);"></i>
      <span style="font-size:0.88rem;">
        <strong>${escapeHtml(alert.label)}</strong>: 
        ${alert.qty} ${alert.unit} restantes — mínimo recomendado: ${alert.min} ${alert.unit}
      </span>
    </div>`
  ).join('');
}

function renderRecentSales() {
  const tbody = document.getElementById('recentSalesBody');
  if (!tbody) return;

  const recent = allSales.slice(0, 8);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">
      <div class="empty-state" style="padding:32px;">
        <i class="bi bi-bag"></i> Sin ventas registradas
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(s => `
    <tr>
      <td style="color:var(--muted); font-size:0.82rem;">${formatDate(s.createdAt)}</td>
      <td style="font-weight:500;">${escapeHtml(s.perfumeName || '—')}</td>
      <td>${s.qty || 1}</td>
      <td><span class="badge-status badge-${s.channel === 'online' ? 'online' : 'manual'}">
        ${CHANNEL_LABELS[s.channel] || s.channel}
      </span></td>
      <td style="font-family:'Kiona'; color:var(--wine);">${formatCOP(s.price || 0)}</td>
    </tr>`
  ).join('');
}

/* ─────────────────────────────────────────────────────────────
   INVENTARIO — Semáforo
───────────────────────────────────────────────────────────── */
function renderInventoryGrid() {
  const grid = document.getElementById('inventoryGrid');
  if (!grid) return;

  const keys = ['envase', 'caja', 'bolsa', 'perfumero'];
  grid.innerHTML = keys.map(k => buildInvCard(k)).join('');

  /* Eventos de actualización inline */
  grid.querySelectorAll('.inv-inline-input').forEach(inp => {
    inp.addEventListener('change', async () => {
      const key = inp.dataset.key;
      const val = parseFloat(inp.value);
      if (!isNaN(val) && val >= 0) {
        inventory[key] = val;
        await saveInventory();
        renderInventoryGrid();
        renderManualSupplies();
        renderDashboard();
        showAdminToast(`${SUPPLY_LABELS[key]} actualizado a ${val} ${SUPPLY_UNITS[key]}`);
      }
    });
  });
}

function renderInventoryEssencesGrid() {
  const wrap = document.getElementById('inventoryEssencesGrid');
  if (!wrap) return;

  const rows = Object.entries(ESSENCE_CONFIG).map(([productId, config]) => {
    const qty = inventoryEssences[productId] || 0;
    const perUnit = config.essence;
    const units = Math.floor(qty / perUnit);
    const min = ADMIN_CONFIG.minStock.esencia;
    const warn = ADMIN_CONFIG.warnStock.esencia;
    const color = qty <= min ? 'red' : qty <= warn ? 'yellow' : 'green';

    return `
      <tr>
        <td>${escapeHtml(config.name)}</td>
        <td>${qty} g</td>
        <td>${perUnit} g/u</td>
        <td>${units}</td>
        <td><span class="semaforo ${color}"></span></td>
        <td>
          <input type="number" class="qty-inline essence-input" data-product="${productId}" value="${qty}" min="0" aria-label="Stock de ${escapeHtml(config.name)}">
        </td>
      </tr>`;
  }).join('');

  wrap.innerHTML = `
    <div class="admin-table-wrap">
      <div class="admin-table-header">
        <span class="admin-table-title">Stock de esencias por referencia</span>
      </div>
      <div style="overflow-x:auto;">
        <table class="admin-table" style="min-width:720px;">
          <thead>
            <tr>
              <th>Fragancia</th>
              <th>Stock (g)</th>
              <th>Por unidad</th>
              <th>Unidades vendibles</th>
              <th>Estado</th>
              <th>Editar</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;

  wrap.querySelectorAll('.essence-input').forEach(inp => {
    inp.addEventListener('change', async () => {
      const productId = inp.dataset.product;
      const val = parseFloat(inp.value);
      if (!isNaN(val) && val >= 0) {
        inventoryEssences[productId] = val;
        await saveInventoryEssences();
        renderInventoryEssencesGrid();
        renderDashboard();
        showAdminToast(`${ESSENCE_CONFIG[productId].name} actualizado a ${val}g`);
      }
    });
  });
}

function buildInvCard(key) {
  const qty = inventory[key] || 0;
  const min = ADMIN_CONFIG.minStock[key];
  const warn = ADMIN_CONFIG.warnStock[key];
  const max = warn * 2;

  const color = qty <= min ? 'red' : qty <= warn ? 'yellow' : 'green';
  const pct = Math.min(100, Math.round((qty / max) * 100));

  const alertMsg = qty <= min
    ? `⚠ Stock crítico — recarga urgente`
    : qty <= warn ? `⚠ Stock bajo` : '';

  return `
  <div class="inv-card">
    <div class="inv-card-header">
      <span class="inv-card-name">${SUPPLY_LABELS[key]}</span>
      <span class="semaforo ${color}"></span>
    </div>
    <div style="display:flex; align-items:baseline; gap:6px;">
      <span class="inv-card-qty">${qty}</span>
      <span class="inv-card-unit">${SUPPLY_UNITS[key]}</span>
    </div>
    <div class="inv-bar-wrap">
      <div class="inv-bar ${color}" style="width:${pct}%"></div>
    </div>
    <p class="inv-card-alert ${alertMsg ? 'visible' : ''}">${alertMsg}</p>
    <p style="font-size:0.72rem; color:var(--muted);">
      Mínimo: ${min} ${SUPPLY_UNITS[key]}
    </p>
  </div>`;
}

function renderManualSupplies() {
  const list = document.getElementById('manualSuppliesList');
  if (!list) return;

  const keys = ['alcohol', 'fijador', 'agua'];
  list.innerHTML = keys.map(k => {
    const qty = inventory[k] || 0;
    const min = ADMIN_CONFIG.minStock[k];
    const color = qty <= min ? 'var(--red)' : qty <= ADMIN_CONFIG.warnStock[k] ? 'var(--yellow)' : 'var(--green)';
    return `
    <div class="manual-supply-row">
      <div>
        <div class="manual-supply-name">${SUPPLY_LABELS[k]}</div>
        <div class="manual-supply-meta" style="color:${color};">
          ${qty} ${SUPPLY_UNITS[k]} disponibles
        </div>
      </div>
      <div class="manual-supply-controls">
        <input
          type="number"
          class="qty-inline manual-set-input"
          data-key="${k}"
          value="${qty}"
          min="0"
          placeholder="ml"
          aria-label="Actualizar ${SUPPLY_LABELS[k]}"
        >
        <button class="btn-pr btn-pr-sm btn-pr-wine manual-set-btn" data-key="${k}">
          Actualizar
        </button>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('.manual-set-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.key;
      const inp = list.querySelector(`.manual-set-input[data-key="${key}"]`);
      const val = parseFloat(inp.value);
      if (isNaN(val) || val < 0) return;
      inventory[key] = val;
      await saveInventory();
      renderManualSupplies();
      renderDashboard();
      showAdminToast(`${SUPPLY_LABELS[key]} actualizado: ${val} ${SUPPLY_UNITS[key]}`);
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   VENTAS — Registro manual
───────────────────────────────────────────────────────────── */
function fillSaleSelect() {
  const sel = document.getElementById('saleProduct');
  if (!sel || typeof perfumes === 'undefined') return;
  sel.innerHTML = '<option value="">Selecciona fragancia...</option>';
  perfumes.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = cleanPerfumeName(p.name);
    sel.appendChild(opt);
  });
}

function fillReloadItemOptions() {
  const sel = document.getElementById('reloadItem');
  if (!sel || typeof perfumes === 'undefined') return;
  sel.innerHTML = `
    <option value="">Selecciona insumo...</option>
    <optgroup label="Esencias">
      ${perfumes.map(p => `<option value="${p.id}">${cleanPerfumeName(p.name)} (esencia)</option>`).join('')}
    </optgroup>
    <optgroup label="Materiales">
      <option value="envase">Envases</option>
      <option value="caja">Cajas</option>
      <option value="bolsa">Bolsas ecológicas</option>
      <option value="perfumero">Perfumeros portátiles</option>
    </optgroup>
    <optgroup label="Líquidos">
      <option value="alcohol">Alcohol</option>
      <option value="fijador">Fijador</option>
      <option value="agua">Agua destilada</option>
    </optgroup>`;
}

function updateSalePreview() {
  /* Función removida - Multi-step visual flow */
}

function updateSalePrice() {
  /* Función removida - Multi-step visual flow */
}

function toggleExternalSellerField() {
  const channel = document.getElementById('saleChannel')?.value;
  const row = document.getElementById('saleExternalSellerRow');
  if (!row) return;
  row.style.display = channel === 'vendedor_externo' ? 'block' : 'none';
}

async function saveSale() {
  /* FUNCIÓN VISUAL SOLAMENTE */
  alert('✓ Venta registrada exitosamente!\n\nNota: Esta es una interfaz visual. La conexión a BD se implementará próximamente.');

  /* Resetear formulario a paso 1 */
  document.getElementById('step-2-details').style.display = 'none';
  document.getElementById('step-1-client').style.display = 'block';
  document.getElementById('stepper2').classList.remove('active');
  document.getElementById('stepper1').classList.remove('completed');
  document.getElementById('stepper1').classList.add('active');

  /* Limpiar paso 1 */
  document.getElementById('clientDocType').value = '';
  document.getElementById('clientDoc').value = '';
  document.getElementById('clientName').value = '';
  document.getElementById('clientLastname').value = '';
  document.getElementById('clientPhone').value = '';
  document.getElementById('clientEmail').value = '';
  document.getElementById('clientDepartment').value = '';
  document.getElementById('clientMunicipality').value = '';
  document.getElementById('clientAddress').value = '';
  document.getElementById('clientNeighborhood').value = '';
  document.getElementById('clientNotes').value = '';

  /* Reinicializar productos */
  initializeFirstProducts();

  /* Resetear información comercial */
  document.getElementById('saleChannel').value = '';
  document.getElementById('salePaymentMethod').value = '';
  document.getElementById('saleAdvisor').value = '';
  document.getElementById('saleExternalSeller').value = '';
}

/* ─────────────────────────────────────────────────────────────
   RECARGA DE INSUMOS
───────────────────────────────────────────────────────────── */
async function saveReload() {
  const item = document.getElementById('reloadItem')?.value;
  const qty = parseFloat(document.getElementById('reloadQty')?.value);
  const cost = parseFloat(document.getElementById('reloadCost')?.value) || 0;
  const notes = document.getElementById('reloadNotes')?.value?.trim();

  if (!item) { showAdminToast('Selecciona un insumo'); return; }
  if (!qty || qty <= 0) { showAdminToast('Ingresa una cantidad válida'); return; }

  const btn = document.getElementById('btnReload');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Guardando...';

  try {
    const { collection, addDoc, serverTimestamp } = FS;

    /* 1 — Sumar al inventario */
    const isEssence = item.startsWith('praessia-');
    if (isEssence) {
      inventoryEssences[item] = (inventoryEssences[item] || 0) + qty;
      await saveInventoryEssences();
    } else {
      inventory[item] = (inventory[item] || 0) + qty;
      await saveInventory();
    }

    const itemLabel = isEssence ? (ESSENCE_CONFIG[item]?.name || item) : SUPPLY_LABELS[item];
    const unit = isEssence ? 'g' : SUPPLY_UNITS[item];

    /* 2 — Guardar en colección reloads */
    await addDoc(collection(db, 'reloads'), {
      item,
      itemLabel,
      qty,
      unit,
      cost,
      notes: notes || '',
      createdAt: serverTimestamp()
    });

    /* 3 — Historial */
    await addDoc(collection(db, 'history'), {
      type: 'recarga',
      label: `Recarga: ${itemLabel} +${qty}${unit}`,
      amount: cost,
      createdAt: serverTimestamp()
    });

    /* 4 — Refrescar */
    await loadReloads();
    renderInventoryGrid();
    renderInventoryEssencesGrid();
    renderManualSupplies();
    renderReloadHistory();
    renderDashboard();

    /* 5 — Limpiar form */
    document.getElementById('reloadItem').value = '';
    document.getElementById('reloadQty').value = '';
    document.getElementById('reloadCost').value = '';
    document.getElementById('reloadNotes').value = '';

    showAdminToast(`✓ ${SUPPLY_LABELS[item]}: +${qty} ${SUPPLY_UNITS[item]} añadidos al inventario`);

  } catch (e) {
    console.error(e);
    showAdminToast('Error al guardar. Intenta de nuevo.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-plus-circle"></i> Añadir al inventario';
  }
}

function renderReloadHistory() {
  const tbody = document.getElementById('reloadHistoryBody');
  if (!tbody || !window._reloads) return;

  if (window._reloads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">
      <div class="empty-state" style="padding:32px;">
        <i class="bi bi-arrow-repeat"></i> Sin recargas aún
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = window._reloads.map(r => `
    <tr>
      <td style="color:var(--muted); font-size:0.82rem;">${formatDate(r.createdAt)}</td>
      <td><strong>${escapeHtml(r.itemLabel || r.item)}</strong></td>
      <td style="color:var(--green);">+${r.qty} ${r.unit || ''}</td>
      <td>${r.cost ? formatCOP(r.cost) : '—'}</td>
      <td style="color:var(--muted); font-size:0.82rem;">${escapeHtml(r.notes || '—')}</td>
    </tr>`
  ).join('');
}

/* ─────────────────────────────────────────────────────────────
   PRODUCCIÓN
───────────────────────────────────────────────────────────── */
async function saveProduction() {
  const date = document.getElementById('prodDate')?.value;
  const units = parseInt(document.getElementById('prodUnits')?.value || '0');
  const alcohol = parseFloat(document.getElementById('prodAlcohol')?.value || '0');
  const fijador = parseFloat(document.getElementById('prodFijador')?.value || '0');
  const agua = parseFloat(document.getElementById('prodAgua')?.value || '0');
  const notes = document.getElementById('prodNotes')?.value?.trim();

  if (!units || units < 1) { showAdminToast('Ingresa la cantidad de perfumes elaborados'); return; }

  const btn = document.getElementById('btnSaveProd');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Guardando...';

  try {
    const { collection, addDoc, serverTimestamp } = FS;

    /* Descontar insumos de producción */
    if (alcohol > 0) inventory.alcohol = Math.max(0, (inventory.alcohol || 0) - alcohol);
    if (fijador > 0) inventory.fijador = Math.max(0, (inventory.fijador || 0) - fijador);
    if (agua > 0) inventory.agua = Math.max(0, (inventory.agua || 0) - agua);
    await saveInventory();

    await addDoc(collection(db, 'production'), {
      date: date || new Date().toISOString().split('T')[0],
      units,
      alcohol, fijador, agua,
      notes: notes || '',
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db, 'history'), {
      type: 'produccion',
      label: `Producción: ${units} perfumes elaborados`,
      createdAt: serverTimestamp()
    });

    await loadProduction();
    renderProdHistory();
    renderManualSupplies();
    renderDashboard();

    /* Limpiar */
    ['prodDate', 'prodUnits', 'prodAlcohol', 'prodFijador', 'prodAgua', 'prodNotes']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    showAdminToast(`✓ Producción registrada: ${units} perfumes`);

  } catch (e) {
    console.error(e);
    showAdminToast('Error al guardar. Intenta de nuevo.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-save"></i> Guardar registro de producción';
  }
}

function renderProdHistory() {
  const container = document.getElementById('prodHistory');
  if (!container || !window._production) return;

  if (window._production.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="bi bi-droplet"></i> Sin registros aún</div>`;
    return;
  }

  container.innerHTML = window._production.map(p => `
    <div class="history-item">
      <div class="history-dot in"></div>
      <div class="history-info">
        <div class="history-title">${p.units} perfumes elaborados</div>
        <div class="history-meta">
          ${p.date || '—'} · 
          Alcohol: ${p.alcohol || 0}ml · 
          Fijador: ${p.fijador || 0}ml · 
          Agua: ${p.agua || 0}ml
          ${p.notes ? ` · ${escapeHtml(p.notes)}` : ''}
        </div>
      </div>
    </div>`
  ).join('');
}

/* ─────────────────────────────────────────────────────────────
   HISTORIAL
───────────────────────────────────────────────────────────── */
async function renderHistorial() {
  const container = document.getElementById('historialList');
  const filter = document.getElementById('historialFilter')?.value || 'all';
  if (!container) return;

  /* Combinar todas las fuentes */
  const allEvents = [
    ...allSales.map(s => ({
      type: 'venta',
      label: `Venta: ${escapeHtml(s.perfumeName || '—')} (x${s.qty})`,
      meta: CHANNEL_LABELS[s.channel] || s.channel,
      amount: s.price || 0,
      dir: 'in',
      createdAt: s.createdAt
    })),
    ...(window._reloads || []).map(r => ({
      type: 'recarga',
      label: `Recarga: ${escapeHtml(r.itemLabel || r.item)} +${r.qty}${r.unit}`,
      meta: r.notes || '',
      amount: r.cost || 0,
      dir: 'out',
      createdAt: r.createdAt
    })),
    ...(window._production || []).map(p => ({
      type: 'produccion',
      label: `Producción: ${p.units} perfumes`,
      meta: `Alcohol ${p.alcohol}ml · Fijador ${p.fijador}ml · Agua ${p.agua}ml`,
      amount: 0,
      dir: 'out',
      createdAt: p.createdAt
    }))
  ].filter(e => filter === 'all' || e.type === filter)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  if (allEvents.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="bi bi-clock-history"></i> Sin movimientos</div>`;
    return;
  }

  container.innerHTML = allEvents.map(e => `
    <div class="history-item">
      <div class="history-dot ${e.dir}"></div>
      <div class="history-info">
        <div class="history-title">${e.label}</div>
        <div class="history-meta">${formatDate(e.createdAt)}${e.meta ? ' · ' + e.meta : ''}</div>
      </div>
      ${e.amount > 0
      ? `<div class="history-amount ${e.dir}">${e.dir === 'in' ? '+' : '−'}${formatCOP(e.amount)}</div>`
      : ''}
    </div>`
  ).join('');
}

/* ─────────────────────────────────────────────────────────────
   RESEÑAS — Moderación
───────────────────────────────────────────────────────────── */
function renderReviews() {
  renderPendingReviews();
  renderApprovedReviews();
}

function renderPendingReviews() {
  const container = document.getElementById('pendingReviewsList');
  const countEl = document.getElementById('pendingCount');
  if (!container) return;

  if (countEl) countEl.textContent = `${pendingReviews.length} pendiente(s)`;

  if (pendingReviews.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="bi bi-chat-heart"></i> No hay reseñas pendientes</div>`;
    return;
  }

  container.innerHTML = pendingReviews.map(r => `
    <div class="history-item" style="padding: 16px 24px;" data-review-id="${r.id}">
      <div class="history-info">
        <div class="history-title" style="margin-bottom:4px;">
          <span class="stars-gold">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
          &nbsp; ${escapeHtml(r.name)}
          <span style="font-size:0.75rem; color:var(--gold-soft); margin-left:8px;">${escapeHtml(r.perfume || '')}</span>
        </div>
        <div style="font-size:0.88rem; color:var(--text); margin-bottom:4px; font-style:italic;">
          "${escapeHtml(r.text)}"
        </div>
        <div class="history-meta">${formatDate(r.createdAt)}</div>
      </div>
      <div style="display:flex; gap:8px; flex-shrink:0;">
        <button class="btn-pr btn-pr-sm btn-pr-green" onclick="approveReview('${r.id}')">
          <i class="bi bi-check-lg"></i> Aprobar
        </button>
        <button class="btn-pr btn-pr-sm btn-pr-red" onclick="rejectReview('${r.id}')">
          <i class="bi bi-trash3"></i> Rechazar
        </button>
      </div>
    </div>`
  ).join('');
}

function renderApprovedReviews() {
  const container = document.getElementById('approvedReviewsList');
  if (!container) return;

  if (approvedReviews.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="bi bi-chat"></i> Sin reseñas publicadas aún</div>`;
    return;
  }

  container.innerHTML = approvedReviews.map(r => `
    <div class="history-item" style="padding: 16px 24px;">
      <div class="history-info">
        <div class="history-title" style="margin-bottom:4px;">
          <span class="stars-gold">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
          &nbsp; ${escapeHtml(r.name)}
          <span style="font-size:0.75rem; color:var(--gold-soft); margin-left:8px;">${escapeHtml(r.perfume || '')}</span>
        </div>
        <div style="font-size:0.88rem; color:var(--muted); font-style:italic;">
          "${escapeHtml(r.text)}"
        </div>
      </div>
      <span class="badge-status badge-approved">Publicada</span>
    </div>`
  ).join('');
}

window.approveReview = async function (id) {
  try {
    const { doc, updateDoc } = FS;
    await updateDoc(doc(db, 'reviews', id), { status: 'approved' });
    const idx = pendingReviews.findIndex(r => r.id === id);
    if (idx > -1) {
      const [r] = pendingReviews.splice(idx, 1);
      r.status = 'approved';
      approvedReviews.unshift(r);
    }
    renderReviews();
    updatePendingBadge();
    renderDashboard();
    showAdminToast('✓ Reseña aprobada y publicada');
  } catch (e) {
    console.error(e);
    showAdminToast('Error al aprobar la reseña');
  }
};

window.rejectReview = async function (id) {
  if (!confirm('¿Eliminar esta reseña? No se puede deshacer.')) return;
  try {
    const { doc, deleteDoc } = FS;
    await deleteDoc(doc(db, 'reviews', id));
    pendingReviews = pendingReviews.filter(r => r.id !== id);
    renderReviews();
    updatePendingBadge();
    renderDashboard();
    showAdminToast('Reseña eliminada');
  } catch (e) {
    console.error(e);
    showAdminToast('Error al eliminar la reseña');
  }
};

function updatePendingBadge() {
  const badge = document.getElementById('pendingBadge');
  if (!badge) return;
  if (pendingReviews.length > 0) {
    badge.textContent = pendingReviews.length;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

/* ─────────────────────────────────────────────────────────────
   UTILIDADES
───────────────────────────────────────────────────────────── */
function cleanPerfumeName(name) {
  const bare = String(name).replace(/^Inspiración Olfativa:\s*/i, '').trim();
  return `Inspiración olfativa: ${bare}`;
}

function formatCOP(amount) {
  return '$' + Number(amount).toLocaleString('es-CO');
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  ['saleDate', 'prodDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
}

function showAdminToast(msg, duration = 3200) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
  resetSaleForm();
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}